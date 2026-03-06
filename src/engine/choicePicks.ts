import type { FactionRules } from "./schema";

export function getAbilityPickCount(
  faction: FactionRules,
  archetypeId: string,
): number {
  const archetype = faction.archetypes.find((a) => a.id === archetypeId);
  return archetype?.abilityPick ?? faction.abilities.pick;
}
