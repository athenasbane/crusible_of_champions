import { useMemo } from "react";
import type { BuildInput, FactionRules, Weapon } from "../../engine/schema";
import { countWeapons, getEffectiveLoadoutRules } from "../../engine/validateWeapons";
import { getWeaponRequirementStatus } from "../../engine/weaponRequirements";
import { getWeaponGroupKey, groupWeapons } from "../../engine/weaponGrouping";
import { hasMaxOnePerModelKeyword } from "../../engine/weaponLimits";

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

export type WeaponOptionsView = {
  loadoutRules: ReturnType<typeof getEffectiveLoadoutRules>;
  sections: WeaponSectionView[];
};

export function useWeaponOptions(
  input: BuildInput,
  faction: FactionRules,
): WeaponOptionsView {
  return useMemo(() => {
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

    const byType = {
      ranged: faction.weapons.filter((weapon) => weapon.type === "ranged"),
      pistol: faction.weapons.filter((weapon) => weapon.type === "pistol"),
      melee: faction.weapons.filter((weapon) => weapon.type === "melee"),
    };

    sections[0].groups = groupWeapons(byType.ranged).map((group) => {
      const quantity = quantitiesByGroup[group.key] ?? 0;
      const points = Math.max(...group.weapons.map((weapon) => weapon.points ?? 0));
      const requirementStatus = getWeaponRequirementStatus(group.weapons[0], input, faction);
      const overTypeCap = counts[group.type] >= loadoutRules.caps[group.type];
      const atPerModelLimit =
        quantity >= 1 && group.weapons.some(hasMaxOnePerModelKeyword);
      const canAdd = requirementStatus.met && !overTypeCap && !atPerModelLimit;
      const canRemove = quantity > 0;
      const unavailableReasons = [
        ...requirementStatus.unmet,
        ...(overTypeCap ? ["Ranged cap reached"] : []),
        ...(atPerModelLimit ? ["Max 1 per model"] : []),
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
      const overTypeCap = counts[group.type] >= loadoutRules.caps[group.type];
      const atPerModelLimit =
        quantity >= 1 && group.weapons.some(hasMaxOnePerModelKeyword);
      const canAdd = requirementStatus.met && !overTypeCap && !atPerModelLimit;
      const canRemove = quantity > 0;
      const unavailableReasons = [
        ...requirementStatus.unmet,
        ...(overTypeCap ? ["Pistol cap reached"] : []),
        ...(atPerModelLimit ? ["Max 1 per model"] : []),
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
      const overTypeCap = counts[group.type] >= loadoutRules.caps[group.type];
      const atPerModelLimit =
        quantity >= 1 && group.weapons.some(hasMaxOnePerModelKeyword);
      const canAdd = requirementStatus.met && !overTypeCap && !atPerModelLimit;
      const canRemove = quantity > 0;
      const unavailableReasons = [
        ...requirementStatus.unmet,
        ...(overTypeCap ? ["Melee cap reached"] : []),
        ...(atPerModelLimit ? ["Max 1 per model"] : []),
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

    return { loadoutRules, sections };
  }, [faction, input]);
}
