import { useMemo } from "react";
import type { BuildInput, FactionRules, Weapon } from "../../engine/schema";
import { countWeapons, getEffectiveLoadoutRules } from "../../engine/validateWeapons";
import { getWeaponRequirementStatus } from "../../engine/weaponRequirements";
import { groupWeapons } from "../../engine/weaponGrouping";

export type WeaponGroupView = {
  key: string;
  type: Weapon["type"];
  name: string;
  weapons: Weapon[];
  selected: boolean;
  points: number;
  disabled: boolean;
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
    const selectedWeapons = faction.weapons.filter((weapon) =>
      input.weaponIds.includes(weapon.id),
    );
    const counts = countWeapons(selectedWeapons);

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
      const selected = group.weapons.some((weapon) => input.weaponIds.includes(weapon.id));
      const points = Math.max(...group.weapons.map((weapon) => weapon.points ?? 0));
      const requirementStatus = getWeaponRequirementStatus(group.weapons[0], input, faction);
      const overTypeCap = !selected && counts[group.type] >= loadoutRules.caps[group.type];
      const disabled = !selected && (!requirementStatus.met || overTypeCap);
      const unavailableReasons = [
        ...requirementStatus.unmet,
        ...(overTypeCap ? ["Ranged cap reached"] : []),
      ];

      return {
        ...group,
        selected,
        points,
        disabled,
        requirementLabels: requirementStatus.labels,
        unmetRequirements: requirementStatus.unmet,
        unavailableReasons,
      };
    });

    sections[1].groups = groupWeapons(byType.pistol).map((group) => {
      const selected = group.weapons.some((weapon) => input.weaponIds.includes(weapon.id));
      const points = Math.max(...group.weapons.map((weapon) => weapon.points ?? 0));
      const requirementStatus = getWeaponRequirementStatus(group.weapons[0], input, faction);
      const overTypeCap = !selected && counts[group.type] >= loadoutRules.caps[group.type];
      const disabled = !selected && (!requirementStatus.met || overTypeCap);
      const unavailableReasons = [
        ...requirementStatus.unmet,
        ...(overTypeCap ? ["Pistol cap reached"] : []),
      ];

      return {
        ...group,
        selected,
        points,
        disabled,
        requirementLabels: requirementStatus.labels,
        unmetRequirements: requirementStatus.unmet,
        unavailableReasons,
      };
    });

    sections[2].groups = groupWeapons(byType.melee).map((group) => {
      const selected = group.weapons.some((weapon) => input.weaponIds.includes(weapon.id));
      const points = Math.max(...group.weapons.map((weapon) => weapon.points ?? 0));
      const requirementStatus = getWeaponRequirementStatus(group.weapons[0], input, faction);
      const overTypeCap = !selected && counts[group.type] >= loadoutRules.caps[group.type];
      const disabled = !selected && (!requirementStatus.met || overTypeCap);
      const unavailableReasons = [
        ...requirementStatus.unmet,
        ...(overTypeCap ? ["Melee cap reached"] : []),
      ];

      return {
        ...group,
        selected,
        points,
        disabled,
        requirementLabels: requirementStatus.labels,
        unmetRequirements: requirementStatus.unmet,
        unavailableReasons,
      };
    });

    return { loadoutRules, sections };
  }, [faction, input]);
}
