import type {
  BuildInput,
  ChoiceOption,
  FactionRules,
  Requirement,
  Weapon,
} from "./schema";
import { getSelectedSpecialismIds, getSpecialismGroups } from "./specialisms";

function findGroupAndOption(
  faction: FactionRules,
  groupId: string,
  optionId: string,
) {
  const groups = [...getSpecialismGroups(faction), faction.abilities];
  const group = groups.find((g) => g.id === groupId);
  const option = group?.options.find((o) => o.id === optionId);
  return { group, option };
}

function getEffectiveKeywords(input: BuildInput, faction: FactionRules): string[] {
  const archetype = faction.archetypes.find((a) => a.id === input.archetypeId);
  if (!archetype) return [];

  const effectiveKeywords = [...archetype.keywords];
  const selectedSpecialismIds = getSelectedSpecialismIds(input);
  const selectedSpecialisms = getSpecialismGroups(faction)
    .flatMap((group) => group.options)
    .filter((option) => selectedSpecialismIds.includes(option.id));
  const selectedAbilities = faction.abilities.options.filter((option) =>
    input.abilityIds.includes(option.id),
  );

  for (const option of [...selectedSpecialisms, ...selectedAbilities]) {
    if (option.keywords) {
      effectiveKeywords.push(...option.keywords);
    }
    for (const effect of option.effects ?? []) {
      if (effect.kind === "addKeywords") {
        effectiveKeywords.push(...effect.value);
      }
      if (effect.kind === "remove" && effect.field === "keywords") {
        const matchIndex = effectiveKeywords.findIndex(
          (keyword) => keyword.toLowerCase() === effect.value.toLowerCase(),
        );
        if (matchIndex >= 0) {
          effectiveKeywords.splice(matchIndex, 1);
        }
      }
    }
  }

  return effectiveKeywords;
}

function isRequirementMet(
  requirement: Requirement,
  input: BuildInput,
  faction: FactionRules,
): boolean {
  if (requirement.kind === "oneOf") {
    return requirement.requirements.some((nestedRequirement) =>
      isRequirementMet(nestedRequirement, input, faction),
    );
  }

  if (requirement.kind === "archetypeIs") {
    return input.archetypeId === requirement.archetypeId;
  }

  if (requirement.kind === "keywordHas") {
    const effectiveKeywords = getEffectiveKeywords(input, faction);
    return effectiveKeywords.some(
      (keyword) => keyword.toLowerCase() === requirement.keyword.toLowerCase(),
    );
  }

  const selectedSpecialismIds = getSelectedSpecialismIds(input);
  const specialismGroups = getSpecialismGroups(faction);
  if (
    requirement.kind === "hasChoice" &&
    specialismGroups.some((group) => group.id === requirement.groupId)
  ) {
    return selectedSpecialismIds.includes(requirement.optionId);
  }

  if (requirement.kind === "hasChoice" && requirement.groupId === faction.abilities.id) {
    return input.abilityIds.includes(requirement.optionId);
  }

  return false;
}

function requirementLabel(requirement: Requirement, faction: FactionRules): string {
  if (requirement.kind === "oneOf") {
    return requirement.requirements
      .map((nestedRequirement) => requirementLabel(nestedRequirement, faction))
      .join(" or ");
  }

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
