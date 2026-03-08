import { useMemo } from "react";
import type { BuildInput, FactionRules } from "../../engine/schema";
import { getChoiceRequirementStatus } from "../../engine/weaponRequirements";
import { getAbilityPickCount } from "../../engine/choicePicks";

export type AbilityOptionView = {
  id: string;
  name: string;
  text: string;
  points: number;
  selected: boolean;
  atCap: boolean;
  disabled: boolean;
  requirementLabels: string[];
  unmetRequirements: string[];
};

export type AbilityOptionsView = {
  pickCount: number;
  selectedCount: number;
  options: AbilityOptionView[];
};

export function useAbilityOptions(
  input: BuildInput,
  faction: FactionRules,
): AbilityOptionsView {
  return useMemo(() => {
    const pickCount = getAbilityPickCount(faction, input.archetypeId);
    const selectedCount = input.abilityIds.length;

    const options = faction.abilities.options.map((ability) => {
      const requirementStatus = getChoiceRequirementStatus(ability, input, faction);
      const selected = input.abilityIds.includes(ability.id);
      const atCap = !selected && selectedCount >= pickCount;
      const disabled = !selected && (!requirementStatus.met || atCap);

      return {
        id: ability.id,
        name: ability.name,
        text: ability.text,
        points: ability.points,
        selected,
        atCap,
        disabled,
        requirementLabels: requirementStatus.labels,
        unmetRequirements: requirementStatus.unmet,
      };
    });

    return { pickCount, selectedCount, options };
  }, [faction, input]);
}
