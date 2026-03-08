import type { BuildInput, FactionRules } from "./schema";
import { applyEffectsToProfile, applyEffectsToSheet } from "./applyEffects";
import { getEffectiveLoadoutRules, validateWeapons } from "./validateWeapons";
import {
  getChoiceRequirementStatus,
  getWeaponRequirementStatus,
} from "./weaponRequirements";
import { getWeaponGroupKey } from "./weaponGrouping";
import { getAbilityPickCount } from "./choicePicks";
import { getSelectedSpecialismIds, getSpecialismGroups } from "./specialisms";
import type { BuiltSheet } from "../sheet/types";

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

  const specialismGroups = getSpecialismGroups(faction);
  const selectedSpecialismIds = getSelectedSpecialismIds(input);
  const allSpecialismOptions = specialismGroups.flatMap((group) => group.options);
  const specialisms = selectedSpecialismIds
    .map((specialismId) =>
      allSpecialismOptions.find((option) => option.id === specialismId),
    )
    .filter(
      (specialism): specialism is (typeof allSpecialismOptions)[number] =>
        specialism !== undefined,
    );

  if (specialisms.length !== selectedSpecialismIds.length) {
    errors.push("Specialism not found");
  }

  for (const group of specialismGroups) {
    const groupSelectedCount = specialisms.filter((specialism) =>
      group.options.some((option) => option.id === specialism.id),
    ).length;
    if (groupSelectedCount > group.pick) {
      errors.push(
        group.pick === 1 ?
          `${group.title}: select up to 1 option` :
          `${group.title}: select up to ${group.pick} options`,
      );
    }
  }

  for (const specialism of specialisms) {
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
    ...specialisms.flatMap((specialism) => specialism.effects ?? []),
    ...abilities.flatMap((ability) => ability.effects ?? []),
    ...weapons.flatMap((w) => w.effects ?? []),
  ];

  const keywords: string[] = [
    archetype.keywords,
    ...specialisms.flatMap((specialism) => specialism.keywords ?? []),
    ...abilities.flatMap((ability) => ability.keywords ?? []),
  ].flat();

  const profile = applyEffectsToProfile(archetype.profile, effects);

  const preeffectSheet: BuiltSheet = {
    points:
      archetype.points +
      specialisms.reduce((sum, specialism) => sum + specialism.points, 0) +
      abilities.reduce((sum, ability) => sum + ability.points, 0),
    factionName: faction.name,
    archetypeName: archetype.name,
    archetypeAbilities: archetype.abilitiesText,
    modelCount: archetype.modelCount,
    name: input.name,
    profile,
    specialisms,
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
