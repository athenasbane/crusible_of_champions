import type { BuiltSheet } from "../sheet/types";
import type { Effect, Profile } from "./schema";

type EffectHandlerMap<State> = Partial<{
  [Kind in Effect["kind"]]: (
    state: State,
    effect: Extract<Effect, { kind: Kind }>,
  ) => State;
}>;

function reduceWithEffectHandlers<State>(
  initialState: State,
  effects: readonly Effect[],
  handlers: EffectHandlerMap<State>,
) {
  return effects.reduce((state, effect) => {
    const handler = handlers[effect.kind];
    if (!handler) return state;

    return handler(state, effect as never);
  }, initialState);
}

const profileHandlers: EffectHandlerMap<Profile> = {
  set: (profile, effect) => ({ ...profile, [effect.field]: effect.value }),
  add: (profile, effect) => ({
    ...profile,
    [effect.field]: profile[effect.field] + effect.delta,
  }),
};

export function applyEffectsToProfile(
  profile: Profile,
  effects: readonly Effect[],
): Profile {
  return reduceWithEffectHandlers(profile, effects, profileHandlers);
}

const sheetHandlers: EffectHandlerMap<BuiltSheet> = {
  remove: (sheet, effect) => ({
    ...sheet,
    [effect.field]: sheet[effect.field].filter((keyword) => keyword !== effect.value),
  }),
  setLeadership: (sheet, effect) => ({
    ...sheet,
    leaderUnits: effect.value,
  }),
  addKeywords: (sheet, effect) => ({
    ...sheet,
    keywords: [...sheet.keywords, ...effect.value],
  }),
  setLeaderUnits: (sheet, effect) => ({
    ...sheet,
    leaderUnits: [...effect.value],
  }),
  addLeaderUnits: (sheet, effect) => ({
    ...sheet,
    leaderUnits: [...(sheet.leaderUnits ?? []), ...effect.value],
  }),
};

export function applyEffectsToSheet(
  sheet: BuiltSheet,
  effects: readonly Effect[],
) {
  return reduceWithEffectHandlers(sheet, effects, sheetHandlers);
}
