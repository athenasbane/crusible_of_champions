import type { BuildInput, FactionRules } from "./schema";
import { applyEffectsToProfile, applyEffectsToSheet } from "./applyEffects";
import { getEffectiveLoadoutRules, validateWeapons } from "./validateWeapons";
import {
  getChoiceRequirementStatus,
  getWeaponRequirementStatus,
} from "./weaponRequirements";
import { getWeaponGroupKey } from "./weaponGrouping";
import { isGroupMaxOnePerModel } from "./weaponLimits";
import { validateWeaponSelectionRules } from "./weaponSelectionRules";
import { getAbilityPickCount } from "./choicePicks";
import { getSelectedSpecialismIds, getSpecialismGroups } from "./specialisms";
import type { BuiltSheet } from "../sheet/types";

export type BuildResult =
  | { type: "error"; errors: string[] }
  | { type: "success"; sheet: BuiltSheet };

function getWeaponPointsForGroup(weapon: FactionRules["weapons"][number], faction: FactionRules) {
  const groupKey = getWeaponGroupKey(weapon);
  const groupProfiles = faction.weapons.filter(
    (candidate) => getWeaponGroupKey(candidate) === groupKey,
  );
  const points = groupProfiles
    .map((profile) => profile.points)
    .filter((value): value is number => typeof value === "number");

  return points.length > 0 ? Math.max(...points) : undefined;
}

function calculateSelectedWeaponPoints(
  selectedWeapons: FactionRules["weapons"],
  faction: FactionRules,
) {
  let fixedPoints = 0;
  let defaultCostWeapons = 0;

  for (const weapon of selectedWeapons) {
    const points = getWeaponPointsForGroup(weapon, faction);
    if (typeof points === "number") {
      fixedPoints += points;
      continue;
    }

    defaultCostWeapons += 1;
  }

  return fixedPoints + Math.max(0, defaultCostWeapons - 2) * 5;
}

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

  const selectedWeapons = input.weaponIds
    .map((weaponId) => faction.weapons.find((weapon) => weapon.id === weaponId))
    .filter((weapon): weapon is FactionRules["weapons"][number] => weapon !== undefined);
  const loadoutRules = getEffectiveLoadoutRules(faction, input.archetypeId);
  const quantitiesByGroup = selectedWeapons.reduce<Record<string, number>>(
    (quantities, weapon) => {
      const groupKey = getWeaponGroupKey(weapon);
      quantities[groupKey] = (quantities[groupKey] ?? 0) + 1;
      return quantities;
    },
    {},
  );

  for (const weapon of selectedWeapons) {

    const status = getWeaponRequirementStatus(weapon, input, faction);
    if (!status.met) {
      errors.push(`${weapon.name} requires ${status.unmet.join(" and ")}`);
    }
  }

  for (const [groupKey, quantity] of Object.entries(quantitiesByGroup)) {
    if (quantity <= 1) continue;
    if (!isGroupMaxOnePerModel(faction, groupKey)) continue;

    const groupWeapon = faction.weapons.find(
      (weapon) => getWeaponGroupKey(weapon) === groupKey,
    );
    errors.push(`${groupWeapon?.name ?? "Weapon"} is max 1 per model`);
  }

  errors.push(...validateWeapons(selectedWeapons, loadoutRules));
  errors.push(...validateWeaponSelectionRules(faction, input, selectedWeapons));

  if (errors.length) return { type: "error", errors };

  const selectedEffects = [
    ...specialisms.flatMap((specialism) => specialism.effects ?? []),
    ...abilities.flatMap((ability) => ability.effects ?? []),
    ...selectedWeapons.flatMap((w) => w.effects ?? []),
  ];
  const grantedWeaponIds = selectedEffects.flatMap((effect) =>
    effect.kind === "addWeapons" ? effect.value : [],
  );
  const grantedWeapons = faction.weapons.filter((weapon) =>
    grantedWeaponIds.includes(weapon.id),
  );
  const selectedWeaponGroups = new Set(
    selectedWeapons.map((weapon) => getWeaponGroupKey(weapon)),
  );
  const weapons = [
    ...faction.weapons.filter((weapon) =>
      selectedWeaponGroups.has(getWeaponGroupKey(weapon)),
    ),
    ...grantedWeapons.filter(
      (grantedWeapon) =>
        !selectedWeaponGroups.has(getWeaponGroupKey(grantedWeapon)),
    ),
  ];
  const weaponQuantities = selectedWeapons.reduce<Record<string, number>>(
    (quantities, weapon) => {
      const groupKey = getWeaponGroupKey(weapon);
      quantities[groupKey] = (quantities[groupKey] ?? 0) + 1;
      return quantities;
    },
    {},
  );

  for (const weapon of grantedWeapons) {
    const groupKey = getWeaponGroupKey(weapon);
    if (!(groupKey in weaponQuantities)) {
      weaponQuantities[groupKey] = 1;
    }
  }
  const effects = [
    ...selectedEffects,
    ...grantedWeapons.flatMap((weapon) => weapon.effects ?? []),
  ];

  const keywords: string[] = [
    archetype.keywords,
    ...specialisms.flatMap((specialism) => specialism.keywords ?? []),
    ...abilities.flatMap((ability) => ability.keywords ?? []),
  ].flat();
  const weaponPoints = calculateSelectedWeaponPoints(selectedWeapons, faction);
  const archetypePoints = archetype.points;
  const specialismPoints = specialisms.reduce(
    (sum, specialism) => sum + specialism.points,
    0,
  );
  const abilityPoints = abilities.reduce((sum, ability) => sum + ability.points, 0);
  const totalPoints =
    archetypePoints + specialismPoints + abilityPoints + weaponPoints;

  const profile = applyEffectsToProfile(archetype.profile, effects);

  const preeffectSheet: BuiltSheet = {
    points: totalPoints,
    pointsBreakdown: {
      archetype: archetypePoints,
      specialisms: specialismPoints,
      abilities: abilityPoints,
      weapons: weaponPoints,
    },
    factionName: faction.name,
    archetypeName: archetype.name,
    archetypeAbilities: archetype.abilitiesText,
    modelCount: archetype.modelCount,
    name: input.name,
    profile,
    specialisms,
    abilities,
    weaponQuantities,
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
