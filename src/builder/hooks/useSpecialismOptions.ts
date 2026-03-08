import { useMemo } from "react";
import type { BuildInput, FactionRules } from "../../engine/schema";
import { getChoiceRequirementStatus } from "../../engine/weaponRequirements";
import { getSelectedSpecialismIds, getSpecialismGroups } from "../../engine/specialisms";

export type SpecialismOptionView = {
  id: string;
  name: string;
  text: string;
  points: number;
  selected: boolean;
  disabled: boolean;
  requirementLabels: string[];
  unmetRequirements: string[];
};

export type SpecialismGroupView = {
  id: string;
  title: string;
  selectedId?: string;
  options: SpecialismOptionView[];
};

export function useSpecialismOptions(
  input: BuildInput,
  faction: FactionRules,
): SpecialismGroupView[] {
  return useMemo(() => {
    const groups = getSpecialismGroups(faction);
    const selectedSpecialismIds = getSelectedSpecialismIds(input);

    return groups.map((group) => {
      const selectedId = selectedSpecialismIds.find((selected) =>
        group.options.some((option) => option.id === selected),
      );

      const options = group.options.map((specialism) => {
        const requirementStatus = getChoiceRequirementStatus(
          specialism,
          input,
          faction,
        );
        const selected = selectedSpecialismIds.includes(specialism.id);
        const disabled = !selected && !requirementStatus.met;

        return {
          id: specialism.id,
          name: specialism.name,
          text: specialism.text,
          points: specialism.points,
          selected,
          disabled,
          requirementLabels: requirementStatus.labels,
          unmetRequirements: requirementStatus.unmet,
        };
      });

      return {
        id: group.id,
        title: group.title,
        selectedId,
        options,
      };
    });
  }, [faction, input]);
}
