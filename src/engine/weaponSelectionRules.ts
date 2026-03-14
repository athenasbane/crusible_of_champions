import type { BuildInput, FactionRules, Weapon } from "./schema";
import { getWeaponGroupKey } from "./weaponGrouping";

type WeaponSelectionRules = NonNullable<
  FactionRules["archetypes"][number]["weaponSelectionRules"]
>;

function normalizeGroupKey(type: Weapon["type"], groupName: string) {
  return `${type}:${groupName.trim().toLowerCase()}`;
}

function getRules(faction: FactionRules, archetypeId: string): WeaponSelectionRules | undefined {
  const archetype = faction.archetypes.find((item) => item.id === archetypeId);
  return archetype?.weaponSelectionRules;
}

function getSelectedGroupCounts(selectedWeapons: readonly Weapon[]) {
  return selectedWeapons.reduce<Record<string, number>>((counts, weapon) => {
    const key = getWeaponGroupKey(weapon);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function groupKeyForGroupName(groupName: string, faction: FactionRules) {
  const profile = faction.weapons.find(
    (weapon) => weapon.group?.toLowerCase() === groupName.toLowerCase(),
  );
  if (!profile) return undefined;
  return getWeaponGroupKey(profile);
}

function getAllowedGroupKeys(faction: FactionRules, input: BuildInput): Set<string> | undefined {
  const rules = getRules(faction, input.archetypeId);
  if (!rules?.allowedGroups?.length) return undefined;

  const keys = rules.allowedGroups
    .map((groupName) => groupKeyForGroupName(groupName, faction))
    .filter((groupKey): groupKey is string => typeof groupKey === "string");

  return new Set(keys);
}

export function isWeaponAllowedForSelectionRules(
  faction: FactionRules,
  input: BuildInput,
  weapon: Weapon,
): boolean {
  const allowedGroupKeys = getAllowedGroupKeys(faction, input);
  if (!allowedGroupKeys) return true;
  return allowedGroupKeys.has(getWeaponGroupKey(weapon));
}

export function getGroupCapForWeapon(
  faction: FactionRules,
  input: BuildInput,
  weapon: Weapon,
): number | undefined {
  const rules = getRules(faction, input.archetypeId);
  if (!rules?.groupCaps) return undefined;
  return rules.groupCaps[weapon.group ?? weapon.name];
}

export function validateWeaponSelectionRules(
  faction: FactionRules,
  input: BuildInput,
  selectedWeapons: readonly Weapon[],
) {
  const rules = getRules(faction, input.archetypeId);
  if (!rules) return [];

  const errors: string[] = [];
  const selectedGroupCounts = getSelectedGroupCounts(selectedWeapons);
  const allowedGroupKeys = getAllowedGroupKeys(faction, input);

  if (allowedGroupKeys) {
    for (const selectedGroupKey of Object.keys(selectedGroupCounts)) {
      if (allowedGroupKeys.has(selectedGroupKey)) continue;
      const selectedWeapon = selectedWeapons.find(
        (weapon) => getWeaponGroupKey(weapon) === selectedGroupKey,
      );
      errors.push(
        `${selectedWeapon?.group ?? selectedWeapon?.name ?? "Weapon"} is not available for this archetype`,
      );
    }
  }

  if (rules.groupCaps) {
    for (const [groupName, cap] of Object.entries(rules.groupCaps)) {
      const groupKey = groupKeyForGroupName(groupName, faction);
      if (!groupKey) continue;
      const selectedCount = selectedGroupCounts[groupKey] ?? 0;
      if (selectedCount > cap) {
        errors.push(`${groupName}: select up to ${cap}`);
      }
    }
  }

  if (!rules.slots?.length) return errors;

  const selectedOptionsBySlot = new Map<string, string[]>();
  const selectedOptionIds = new Set<string>();

  for (const slot of rules.slots) {
    const selectedOptions = slot.options
      .filter((option) =>
        option.groups.every((groupName) => {
          const profile = faction.weapons.find(
            (weapon) => weapon.group?.toLowerCase() === groupName.toLowerCase(),
          );
          if (!profile) return false;
          const groupKey = normalizeGroupKey(profile.type, groupName);
          return (selectedGroupCounts[groupKey] ?? 0) > 0;
        }),
      )
      .map((option) => option.id);

    selectedOptionsBySlot.set(slot.id, selectedOptions);
    for (const optionId of selectedOptions) {
      selectedOptionIds.add(optionId);
    }
  }

  for (const slot of rules.slots) {
    const selectedOptions = selectedOptionsBySlot.get(slot.id) ?? [];
    const disabled =
      slot.disabledWhenAnyOptionsSelected?.some((optionId) =>
        selectedOptionIds.has(optionId),
      ) ?? false;
    const min = disabled ? 0 : slot.min;
    const max = disabled ? 0 : slot.max;

    if (selectedOptions.length < min) {
      errors.push(`${slot.title}: select at least ${min}`);
    }
    if (selectedOptions.length > max) {
      errors.push(`${slot.title}: select up to ${max}`);
    }
  }

  return errors;
}
