import type { FactionRules, Weapon } from "./schema";
import { getWeaponGroupKey } from "./weaponGrouping";

const MAX_ONE_PER_MODEL_KEYWORD = "max 1 per model";

export function hasMaxOnePerModelKeyword(weapon: Weapon) {
  return weapon.keywords.some(
    (keyword) => keyword.trim().toLowerCase() === MAX_ONE_PER_MODEL_KEYWORD,
  );
}

export function isGroupMaxOnePerModel(faction: FactionRules, groupKey: string) {
  return faction.weapons.some(
    (weapon) =>
      getWeaponGroupKey(weapon) === groupKey && hasMaxOnePerModelKeyword(weapon),
  );
}
