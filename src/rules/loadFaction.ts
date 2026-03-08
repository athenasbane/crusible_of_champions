import { FactionSchema } from "../engine/schema";
import type { FactionRules } from "../engine/schema";
import adeptus_astartes_raw from "./adeptus_astartes.json";

type UnknownRecord = Record<string, unknown>;

type InheritableFactionData = UnknownRecord & {
  inheritsFrom?: string;
  archetypes?: unknown;
  specialismsMode?: "inherit" | "extend" | "override";
  abilitiesMode?: "inherit" | "extend" | "override";
  weaponsMode?: "inherit" | "extend" | "override";
  factionKeywords?: string[];
};

const baseFactionDataById: Record<string, unknown> = {
  adeptus_astartes: adeptus_astartes_raw,
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function mergeOptionsById<T extends { id: string }>(base: T[], next: T[]) {
  const merged = new Map<string, T>();

  for (const option of base) merged.set(option.id, option);
  for (const option of next) merged.set(option.id, option);

  return [...merged.values()];
}

function normalizeRequirement(requirement: unknown): unknown {
  if (!isRecord(requirement) || typeof requirement.kind !== "string") {
    return requirement;
  }

  if (requirement.kind === "archetypeIs") {
    return {
      ...requirement,
      archetypeId:
        typeof requirement.archetypeId === "string"
          ? requirement.archetypeId
          : requirement.value,
    };
  }

  if (requirement.kind === "oneOf" && Array.isArray(requirement.requirements)) {
    return {
      ...requirement,
      requirements: requirement.requirements.map(normalizeRequirement),
    };
  }

  return requirement;
}

function normalizeRequirements(requirements: unknown): unknown {
  if (!Array.isArray(requirements)) return requirements;
  return requirements.map(normalizeRequirement);
}

function normalizeEffects(
  effects: unknown,
  bonusWeaponChoices: unknown,
): unknown[] | undefined {
  const normalizedEffects = Array.isArray(effects)
    ? effects.flatMap((effect) => {
        if (!isRecord(effect) || typeof effect.kind !== "string") {
          return [effect];
        }

        if (effect.kind === "removeKeyword") {
          return [{ kind: "remove", field: "keywords", value: effect.value }];
        }

        if (effect.kind === "addKeyword") {
          return [{ kind: "addKeywords", value: [effect.value] }];
        }

        return [effect];
      })
    : [];

  if (Array.isArray(bonusWeaponChoices) && bonusWeaponChoices.length > 0) {
    normalizedEffects.push({
      kind: "addWeapons",
      value: bonusWeaponChoices,
    });
  }

  return normalizedEffects.length > 0 ? normalizedEffects : undefined;
}

function normalizeChoiceGroup(group: unknown) {
  if (!isRecord(group) || !Array.isArray(group.options)) return group;

  return {
    ...group,
    options: group.options.map((option) => {
      if (!isRecord(option)) return option;

      return {
        ...option,
        points:
          typeof option.points === "number" ? option.points : 0,
        requirements: normalizeRequirements(option.requirements),
        effects: normalizeEffects(option.effects, option.bonusWeaponChoices),
      };
    }),
  };
}

function normalizeSpecialisms(specialisms: unknown) {
  if (!isRecord(specialisms)) return specialisms;
  if ("partA" in specialisms || "partB" in specialisms) return specialisms;

  return normalizeChoiceGroup(specialisms);
}

function normalizeWeapons(weapons: unknown) {
  if (!Array.isArray(weapons)) return weapons;

  return weapons.map((weapon) => {
    if (!isRecord(weapon)) return weapon;

    return {
      ...weapon,
      range: weapon.range != null ? String(weapon.range) : weapon.range,
      attacks: weapon.attacks != null ? String(weapon.attacks) : weapon.attacks,
      strength: weapon.strength != null ? String(weapon.strength) : weapon.strength,
      ap: weapon.ap != null ? String(weapon.ap) : weapon.ap,
      damage: weapon.damage != null ? String(weapon.damage) : weapon.damage,
      keywords: Array.isArray(weapon.keywords) ? weapon.keywords : [],
      requirements: normalizeRequirements(weapon.requirements),
    };
  });
}

function normalizeFaction(data: unknown): unknown {
  if (!isRecord(data)) return data;

  return {
    ...data,
    specialisms: normalizeSpecialisms(data.specialisms),
    abilities: normalizeChoiceGroup(data.abilities),
    weapons: normalizeWeapons(data.weapons),
  };
}

function resolveInheritance(data: unknown): unknown {
  if (!isRecord(data)) return data;

  const faction = data as InheritableFactionData;
  if (!faction.inheritsFrom) return normalizeFaction(faction);

  const baseRaw = baseFactionDataById[faction.inheritsFrom];
  if (!baseRaw) {
    throw new Error(`Inherited faction not found: ${faction.inheritsFrom}`);
  }

  const base = resolveInheritance(baseRaw);
  if (!isRecord(base)) return normalizeFaction(faction);

  const archetypes =
    faction.archetypes === "inherit" || faction.archetypes == null
      ? base.archetypes
      : faction.archetypes;

  const specialismsMode = faction.specialismsMode ?? "inherit";
  const abilitiesMode = faction.abilitiesMode ?? "inherit";
  const weaponsMode = faction.weaponsMode ?? "inherit";

  const specialisms =
    specialismsMode === "extend" &&
    isRecord(base.specialisms) &&
    isRecord(faction.specialisms) &&
    Array.isArray(base.specialisms.options) &&
    Array.isArray(faction.specialisms.options)
      ? {
          ...base.specialisms,
          ...faction.specialisms,
          options: mergeOptionsById(
            base.specialisms.options as { id: string }[],
            faction.specialisms.options as { id: string }[],
          ),
        }
      : specialismsMode === "inherit"
        ? base.specialisms
        : faction.specialisms;

  const abilities =
    abilitiesMode === "extend" &&
    isRecord(base.abilities) &&
    isRecord(faction.abilities) &&
    Array.isArray(base.abilities.options) &&
    Array.isArray(faction.abilities.options)
      ? {
          ...base.abilities,
          ...faction.abilities,
          options: mergeOptionsById(
            base.abilities.options as { id: string }[],
            faction.abilities.options as { id: string }[],
          ),
        }
      : abilitiesMode === "inherit"
        ? base.abilities
        : faction.abilities;

  const weapons =
    weaponsMode === "extend" &&
    Array.isArray(base.weapons) &&
    Array.isArray(faction.weapons)
      ? mergeOptionsById(
          base.weapons as { id: string }[],
          faction.weapons as { id: string }[],
        )
      : weaponsMode === "inherit"
        ? base.weapons
        : faction.weapons;

  const merged = {
    ...base,
    ...faction,
    archetypes,
    specialisms,
    abilities,
    weapons,
    defaultLoadout: faction.defaultLoadout ?? base.defaultLoadout,
  } as UnknownRecord;

  const factionKeywords =
    Array.isArray(faction.factionKeywords) ? faction.factionKeywords : undefined;

  if (factionKeywords && Array.isArray(merged.archetypes)) {
    merged.archetypes = merged.archetypes.map((archetype) => {
      if (!isRecord(archetype) || !Array.isArray(archetype.factionKeywords)) {
        return archetype;
      }

      return {
        ...archetype,
        factionKeywords: [
          ...new Set([...archetype.factionKeywords, ...factionKeywords]),
        ],
      };
    });
  }

  return normalizeFaction(merged);
}

export function loadFaction(data: unknown): FactionRules {
  return FactionSchema.parse(resolveInheritance(data));
}
