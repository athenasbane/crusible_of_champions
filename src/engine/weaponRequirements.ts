import type {
  BuildInput,
  ChoiceOption,
  FactionRules,
  Requirement,
  Weapon,
} from "./schema";

function findGroupAndOption(
  faction: FactionRules,
  groupId: string,
  optionId: string,
) {
  const groups = [faction.specialisms, faction.abilities];
  const group = groups.find((g) => g.id === groupId);
  const option = group?.options.find((o) => o.id === optionId);
  return { group, option };
}

function isRequirementMet(
  requirement: Requirement,
  input: BuildInput,
  faction: FactionRules,
) {
  if (requirement.kind === "archetypeIs") {
    return input.archetypeId === requirement.archetypeId;
  }

  if (requirement.kind === "keywordHas") {
    const archetype = faction.archetypes.find((a) => a.id === input.archetypeId);
    return archetype?.keywords.some(
      (keyword) => keyword.toLowerCase() === requirement.keyword.toLowerCase(),
    );
  }

  if (requirement.kind === "hasChoice" && requirement.groupId === faction.specialisms.id) {
    return input.specialismId === requirement.optionId;
  }

  if (requirement.kind === "hasChoice" && requirement.groupId === faction.abilities.id) {
    return input.abilityIds.includes(requirement.optionId);
  }

  return false;
}

function requirementLabel(requirement: Requirement, faction: FactionRules) {
  if (requirement.kind === "archetypeIs") {
    const archetype = faction.archetypes.find((a) => a.id === requirement.archetypeId);
    return `Archetype: ${archetype?.name ?? requirement.archetypeId}`;
  }

  if (requirement.kind === "keywordHas") {
    return `Keyword: ${requirement.keyword.toUpperCase()}`;
  }

  const { group, option } = findGroupAndOption(
    faction,
    requirement.groupId,
    requirement.optionId,
  );
  return `${group?.title ?? requirement.groupId}: ${option?.name ?? requirement.optionId}`;
}

export function getRequirementStatus(
  requirements: Requirement[] | undefined,
  input: BuildInput,
  faction: FactionRules,
) {
  const list = requirements ?? [];
  const labels = list.map((requirement) => requirementLabel(requirement, faction));
  const unmet = list
    .filter((requirement) => !isRequirementMet(requirement, input, faction))
    .map((requirement) => requirementLabel(requirement, faction));

  return {
    met: unmet.length === 0,
    labels,
    unmet,
  };
}

export function getWeaponRequirementStatus(
  weapon: Weapon,
  input: BuildInput,
  faction: FactionRules,
) {
  return getRequirementStatus(weapon.requirements, input, faction);
}

export function getChoiceRequirementStatus(
  option: ChoiceOption,
  input: BuildInput,
  faction: FactionRules,
) {
  return getRequirementStatus(option.requirements, input, faction);
}
