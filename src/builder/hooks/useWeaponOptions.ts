import { useMemo } from "react";
import type { BuildInput, FactionRules, Weapon } from "../../engine/schema";
import { countWeapons, getEffectiveLoadoutRules } from "../../engine/validateWeapons";
import { getWeaponRequirementStatus } from "../../engine/weaponRequirements";
import { getWeaponGroupKey, groupWeapons } from "../../engine/weaponGrouping";
import { hasMaxOnePerModelKeyword } from "../../engine/weaponLimits";
import {
  getGroupCapForWeapon,
  isWeaponAllowedForSelectionRules,
} from "../../engine/weaponSelectionRules";

export type WeaponGroupView = {
  key: string;
  type: Weapon["type"];
  name: string;
  weapons: Weapon[];
  quantity: number;
  points: number;
  canAdd: boolean;
  canRemove: boolean;
  requirementLabels: string[];
  unmetRequirements: string[];
  unavailableReasons: string[];
};

export type WeaponSectionView = {
  title: string;
  groups: WeaponGroupView[];
};

export type WeaponSlotOptionGuideView = {
  id: string;
  name: string;
  selected: boolean;
  disabled: boolean;
};

export type WeaponSlotGuideView = {
  id: string;
  title: string;
  min: number;
  max: number;
  selectedCount: number;
  required: boolean;
  options: WeaponSlotOptionGuideView[];
};

export type WeaponOptionsView = {
  loadoutRules: ReturnType<typeof getEffectiveLoadoutRules>;
  slotGuide?: {
    guideTitle?: string;
    guideLines?: string[];
    slots: WeaponSlotGuideView[];
  };
  sections: WeaponSectionView[];
};

export function useWeaponOptions(
  input: BuildInput,
  faction: FactionRules,
): WeaponOptionsView {
  return useMemo(() => {
    const archetype = faction.archetypes.find((item) => item.id === input.archetypeId);
    const weaponSelectionRules = archetype?.weaponSelectionRules;
    const loadoutRules = getEffectiveLoadoutRules(faction, input.archetypeId);
    const selectedWeapons = input.weaponIds
      .map((weaponId) => faction.weapons.find((weapon) => weapon.id === weaponId))
      .filter((weapon): weapon is Weapon => weapon !== undefined);
    const counts = countWeapons(selectedWeapons);
    const quantitiesByGroup = selectedWeapons.reduce<Record<string, number>>(
      (quantities, weapon) => {
        const groupKey = getWeaponGroupKey(weapon);
        quantities[groupKey] = (quantities[groupKey] ?? 0) + 1;
        return quantities;
      },
      {},
    );

    const sections: WeaponSectionView[] = [
      { title: "Ranged", groups: [] },
      { title: "Pistol", groups: [] },
      { title: "Melee", groups: [] },
    ];

    const slotGuide =
      weaponSelectionRules?.slots ?
        (() => {
          const selectedOptionIds = new Set<string>();

          const findGroupKeyByName = (groupName: string) => {
            const profile = faction.weapons.find(
              (weapon) => weapon.group?.toLowerCase() === groupName.toLowerCase(),
            );
            return profile ? getWeaponGroupKey(profile) : undefined;
          };

          const slots = weaponSelectionRules.slots.map((slot) => {
            const options = slot.options.map((option) => {
              const selected = option.groups.every((groupName) => {
                const groupKey = findGroupKeyByName(groupName);
                return groupKey ? (quantitiesByGroup[groupKey] ?? 0) > 0 : false;
              });
              if (selected) selectedOptionIds.add(option.id);
              return {
                id: option.id,
                name: option.name,
                selected,
                disabled: false,
              };
            });

            return {
              id: slot.id,
              title: slot.title,
              min: slot.min,
              max: slot.max,
              selectedCount: options.filter((option) => option.selected).length,
              required: slot.min > 0,
              disabledWhenAnyOptionsSelected: slot.disabledWhenAnyOptionsSelected ?? [],
              options,
            };
          });

          const finalizedSlots = slots.map((slot) => {
            const slotDisabled = slot.disabledWhenAnyOptionsSelected.some((optionId) =>
              selectedOptionIds.has(optionId),
            );

            return {
              id: slot.id,
              title: slot.title,
              min: slot.min,
              max: slot.max,
              selectedCount: slot.selectedCount,
              required: !slotDisabled && slot.required,
              options: slot.options.map((option) => ({
                ...option,
                disabled:
                  slotDisabled ||
                  (!option.selected &&
                    slot.selectedCount >= slot.max &&
                    slot.max > 0),
              })),
            } satisfies WeaponSlotGuideView;
          });

          return {
            guideTitle: weaponSelectionRules.guideTitle,
            guideLines: weaponSelectionRules.guideLines,
            slots: finalizedSlots,
          };
        })()
      : undefined;

    const byType = {
      ranged: faction.weapons.filter((weapon) => weapon.type === "ranged"),
      pistol: faction.weapons.filter((weapon) => weapon.type === "pistol"),
      melee: faction.weapons.filter((weapon) => weapon.type === "melee"),
    };

    sections[0].groups = groupWeapons(byType.ranged).map((group) => {
      const quantity = quantitiesByGroup[group.key] ?? 0;
      const points = Math.max(...group.weapons.map((weapon) => weapon.points ?? 0));
      const requirementStatus = getWeaponRequirementStatus(group.weapons[0], input, faction);
      const allowedBySelectionRules = isWeaponAllowedForSelectionRules(
        faction,
        input,
        group.weapons[0],
      );
      const overTypeCap = counts[group.type] >= loadoutRules.caps[group.type];
      const atPerModelLimit =
        quantity >= 1 && group.weapons.some(hasMaxOnePerModelKeyword);
      const groupCap = getGroupCapForWeapon(faction, input, group.weapons[0]);
      const atGroupCap =
        typeof groupCap === "number" && quantity >= groupCap;
      const canAdd =
        requirementStatus.met &&
        allowedBySelectionRules &&
        !overTypeCap &&
        !atPerModelLimit &&
        !atGroupCap;
      const canRemove = quantity > 0;
      const unavailableReasons = [
        ...requirementStatus.unmet,
        ...(!allowedBySelectionRules ? ["Not available for this archetype"] : []),
        ...(overTypeCap ? ["Ranged cap reached"] : []),
        ...(atPerModelLimit ? ["Max 1 per model"] : []),
        ...(atGroupCap ? [`Max ${groupCap}`] : []),
      ];

      return {
        ...group,
        quantity,
        points,
        canAdd,
        canRemove,
        requirementLabels: requirementStatus.labels,
        unmetRequirements: requirementStatus.unmet,
        unavailableReasons,
      };
    });

    sections[1].groups = groupWeapons(byType.pistol).map((group) => {
      const quantity = quantitiesByGroup[group.key] ?? 0;
      const points = Math.max(...group.weapons.map((weapon) => weapon.points ?? 0));
      const requirementStatus = getWeaponRequirementStatus(group.weapons[0], input, faction);
      const allowedBySelectionRules = isWeaponAllowedForSelectionRules(
        faction,
        input,
        group.weapons[0],
      );
      const overTypeCap = counts[group.type] >= loadoutRules.caps[group.type];
      const atPerModelLimit =
        quantity >= 1 && group.weapons.some(hasMaxOnePerModelKeyword);
      const groupCap = getGroupCapForWeapon(faction, input, group.weapons[0]);
      const atGroupCap =
        typeof groupCap === "number" && quantity >= groupCap;
      const canAdd =
        requirementStatus.met &&
        allowedBySelectionRules &&
        !overTypeCap &&
        !atPerModelLimit &&
        !atGroupCap;
      const canRemove = quantity > 0;
      const unavailableReasons = [
        ...requirementStatus.unmet,
        ...(!allowedBySelectionRules ? ["Not available for this archetype"] : []),
        ...(overTypeCap ? ["Pistol cap reached"] : []),
        ...(atPerModelLimit ? ["Max 1 per model"] : []),
        ...(atGroupCap ? [`Max ${groupCap}`] : []),
      ];

      return {
        ...group,
        quantity,
        points,
        canAdd,
        canRemove,
        requirementLabels: requirementStatus.labels,
        unmetRequirements: requirementStatus.unmet,
        unavailableReasons,
      };
    });

    sections[2].groups = groupWeapons(byType.melee).map((group) => {
      const quantity = quantitiesByGroup[group.key] ?? 0;
      const points = Math.max(...group.weapons.map((weapon) => weapon.points ?? 0));
      const requirementStatus = getWeaponRequirementStatus(group.weapons[0], input, faction);
      const allowedBySelectionRules = isWeaponAllowedForSelectionRules(
        faction,
        input,
        group.weapons[0],
      );
      const overTypeCap = counts[group.type] >= loadoutRules.caps[group.type];
      const atPerModelLimit =
        quantity >= 1 && group.weapons.some(hasMaxOnePerModelKeyword);
      const groupCap = getGroupCapForWeapon(faction, input, group.weapons[0]);
      const atGroupCap =
        typeof groupCap === "number" && quantity >= groupCap;
      const canAdd =
        requirementStatus.met &&
        allowedBySelectionRules &&
        !overTypeCap &&
        !atPerModelLimit &&
        !atGroupCap;
      const canRemove = quantity > 0;
      const unavailableReasons = [
        ...requirementStatus.unmet,
        ...(!allowedBySelectionRules ? ["Not available for this archetype"] : []),
        ...(overTypeCap ? ["Melee cap reached"] : []),
        ...(atPerModelLimit ? ["Max 1 per model"] : []),
        ...(atGroupCap ? [`Max ${groupCap}`] : []),
      ];

      return {
        ...group,
        quantity,
        points,
        canAdd,
        canRemove,
        requirementLabels: requirementStatus.labels,
        unmetRequirements: requirementStatus.unmet,
        unavailableReasons,
      };
    });

    return { loadoutRules, slotGuide, sections };
  }, [faction, input]);
}
