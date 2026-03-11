import type { Weapon } from "./schema";

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export function getWeaponGroupName(weapon: Weapon) {
  if (weapon.group && weapon.group.trim().length > 0) {
    return weapon.group.trim();
  }

  return weapon.name.trim();
}

export function getWeaponGroupKey(weapon: Weapon) {
  return `${weapon.type}:${normalizeName(getWeaponGroupName(weapon))}`;
}

export function groupWeapons(weapons: readonly Weapon[]) {
  const grouped = new Map<
    string,
    { key: string; type: Weapon["type"]; name: string; weapons: Weapon[] }
  >();

  for (const weapon of weapons) {
    const key = getWeaponGroupKey(weapon);
    const existing = grouped.get(key);

    if (existing) {
      existing.weapons.push(weapon);
      continue;
    }

    grouped.set(key, {
      key,
      type: weapon.type,
      name: getWeaponGroupName(weapon),
      weapons: [weapon],
    });
  }

  return Array.from(grouped.values());
}
