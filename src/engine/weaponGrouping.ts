import type { Weapon } from "./schema";

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export function getWeaponGroupName(name: string) {
  const parts = name.split(/\s+[—-]\s+/);
  return parts[0]?.trim() || name;
}

export function getWeaponGroupKey(weapon: Weapon) {
  return `${weapon.type}:${normalizeName(getWeaponGroupName(weapon.name))}`;
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
      name: getWeaponGroupName(weapon.name),
      weapons: [weapon],
    });
  }

  return Array.from(grouped.values());
}
