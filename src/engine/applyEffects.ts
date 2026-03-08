import type { BuiltSheet } from "../sheet/types";
import type { Effect, Profile } from "./schema";

export function applyEffectsToProfile(
  profile: Profile,
  effects: readonly Effect[],
): Profile {
  return effects.reduce((current, effect) => {
    switch (effect.kind) {
      case "set":
        return { ...current, [effect.field]: effect.value };

      case "add":
        return {
          ...current,
          [effect.field]: current[effect.field] + effect.delta,
        };
      default:
        return current;
    }
  }, profile);
}

export function applyEffectsToSheet(
  sheet: BuiltSheet,
  effects: readonly Effect[],
) {
  return effects.reduce((current, effect) => {
    switch (effect.kind) {
      case "remove":
        return {
          ...current,
          [effect.field]: current[effect.field].filter(
            (k) => k !== effect.value,
          ),
        };
      case "setLeadership":
        return {
          ...current,
          leaderUnits: effect.value,
        };
      case "addKeywords":
        return {
          ...current,
          keywords: [...current.keywords, ...effect.value],
        };
      case "setLeaderUnits":
        return {
          ...current,
          leaderUnits: [...effect.value],
        };
      case "addLeaderUnits":
        return {
          ...current,
          leaderUnits: [...(current.leaderUnits ?? []), ...effect.value],
        };
      default:
        return current;
    }
  }, sheet);
}
