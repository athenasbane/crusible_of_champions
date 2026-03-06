import type { FactionRules, LoadoutRules, Weapon } from "./schema";
import { getWeaponGroupKey } from "./weaponGrouping";

export function countWeapons(weapons: readonly Weapon[]) {
  const seen = new Set<string>();
  return weapons.reduce(
    (counts, w) => {
      const key = getWeaponGroupKey(w);
      if (seen.has(key)) return counts;

      seen.add(key);
      return {
        ...counts,
        [w.type]: counts[w.type] + 1,
      };
    },
    { ranged: 0, pistol: 0, melee: 0 },
  );
}

export function validateWeapons(
  weapons: readonly Weapon[],
  rules: LoadoutRules,
): string[] {
  const c = countWeapons(weapons);
  const errors: string[] = [];

  if (c.ranged > rules.caps.ranged) errors.push("Too many ranged weapons");

  if (c.pistol > rules.caps.pistol) errors.push("Too many pistols");

  if (c.melee > rules.caps.melee) errors.push("Too many melee weapons");

  if (c.melee < rules.mins.melee)
    errors.push("You must take at least one melee weapon");

  return errors;
}

export function getEffectiveLoadoutRules(
  faction: FactionRules,
  archetypeId: string,
): LoadoutRules {
  const archetype = faction.archetypes.find((a) => a.id === archetypeId);
  return archetype?.loadout ?? faction.defaultLoadout;
}
