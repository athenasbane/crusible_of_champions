import type { FactionRules } from "./schema";
import { applyEffectsToProfile, applyEffectsToSheet } from "./applyEffects";
import { getEffectiveLoadoutRules, validateWeapons } from "./validateWeapons";
import {
  getChoiceRequirementStatus,
  getWeaponRequirementStatus,
} from "./weaponRequirements";
import { getWeaponGroupKey } from "./weaponGrouping";
import { getAbilityPickCount } from "./choicePicks";
import type { BuiltSheet } from "../sheet/types";

export type BuildInput = {
  archetypeId: string;
  specialismId?: string;
  abilityIds: string[];
  weaponIds: string[];
  name?: string;
  notes?: string;
};

export type BuildResult =
  | { type: "error"; errors: string[] }
  | { type: "success"; sheet: BuiltSheet };

export function buildSheet(
  faction: FactionRules,
  input: BuildInput,
): BuildResult {
  const errors: string[] = [];

  const archetype = faction.archetypes.find((a) => a.id === input.archetypeId);
  if (!archetype) return { type: "error", errors: ["Archetype not found"] };

  const specialism = input.specialismId
    ? faction.specialisms.options.find((o) => o.id === input.specialismId)
    : undefined;
  if (input.specialismId && !specialism) errors.push("Specialism not found");
  if (specialism) {
    const status = getChoiceRequirementStatus(specialism, input, faction);
    if (!status.met) {
      errors.push(`${specialism.name} requires ${status.unmet.join(" and ")}`);
    }
  }

  const abilityPickCount = getAbilityPickCount(faction, input.archetypeId);
  const abilityIds = [...new Set(input.abilityIds)];
  if (abilityIds.length > abilityPickCount) {
    errors.push(
      abilityPickCount === 1
        ? "Select up to 1 ability"
        : `Select up to ${abilityPickCount} abilities`,
    );
  }

  const abilities = abilityIds
    .map((abilityId) => faction.abilities.options.find((o) => o.id === abilityId))
    .filter((ability): ability is (typeof faction.abilities.options)[number] => ability !== undefined);

  if (abilities.length !== abilityIds.length) {
    errors.push("Ability not found");
  }

  for (const ability of abilities) {
    const status = getChoiceRequirementStatus(ability, input, faction);
    if (!status.met) {
      errors.push(`${ability.name} requires ${status.unmet.join(" and ")}`);
    }
  }

  const weapons = faction.weapons.filter((w) => input.weaponIds.includes(w.id));
  const loadoutRules = getEffectiveLoadoutRules(faction, input.archetypeId);

  const checkedWeaponGroups = new Set<string>();
  for (const weapon of weapons) {
    const groupKey = getWeaponGroupKey(weapon);
    if (checkedWeaponGroups.has(groupKey)) continue;
    checkedWeaponGroups.add(groupKey);

    const status = getWeaponRequirementStatus(weapon, input, faction);
    if (!status.met) {
      errors.push(`${weapon.name} requires ${status.unmet.join(" and ")}`);
    }
  }

  errors.push(...validateWeapons(weapons, loadoutRules));

  if (errors.length) return { type: "error", errors };

  const effects = [
    ...(specialism?.effects ?? []),
    ...abilities.flatMap((ability) => ability.effects ?? []),
    ...weapons.flatMap((w) => w.effects ?? []),
  ];

  const keywords: string[] = [
    archetype.keywords,
    ...(specialism?.keywords ?? []),
    ...abilities.flatMap((ability) => ability.keywords ?? []),
  ].flat();

  const profile = applyEffectsToProfile(archetype.profile, effects);

  const preeffectSheet: BuiltSheet = {
    points:
      archetype.points +
      (specialism?.points ?? 0) +
      abilities.reduce((sum, ability) => sum + ability.points, 0),
    factionName: faction.name,
    archetypeName: archetype.name,
    modelCount: archetype.modelCount,
    name: input.name,
    profile,
    specialism,
    abilities,
    leaderUnits: archetype.leaderUnits,
    factionKeywords: archetype.factionKeywords,
    keywords,
    weapons,
    notes: input.notes,
  };

  const sheet = applyEffectsToSheet(preeffectSheet, effects);

  return {
    type: "success",
    sheet,
  };
}
