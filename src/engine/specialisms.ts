import type { BuildInput, ChoiceGroup, FactionRules } from "./schema";

export function getSpecialismGroups(faction: FactionRules): ChoiceGroup[] {
  if ("options" in faction.specialisms) {
    return [faction.specialisms];
  }

  return [faction.specialisms.partA, faction.specialisms.partB];
}

export function getSelectedSpecialismIds(input: BuildInput): string[] {
  return [...new Set(input.specialismIds)];
}

