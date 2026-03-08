import { describe, expect, it } from "vitest";
import { applyEffectsToProfile, applyEffectsToSheet } from "../../src/engine/applyEffects";
import type { Effect } from "../../src/engine/schema";
import type { BuiltSheet } from "../../src/sheet/types";

function makeSheet(): BuiltSheet {
  return {
    points: 100,
    factionName: "Test Faction",
    archetypeName: "Test Archetype",
    archetypeAbilities: [],
    modelCount: 1,
    profile: {
      move: 6,
      toughness: 4,
      save: 3,
      wounds: 4,
      leadership: 6,
      objectiveControl: 1,
    },
    specialisms: [],
    abilities: [],
    leaderUnits: ["Unit A"],
    factionKeywords: ["Test"],
    keywords: ["Infantry", "Tacticus"],
    weapons: [],
  };
}

describe("applyEffectsToProfile", () => {
  it("applies set and add effects to profile stats", () => {
    const effects: Effect[] = [
      { kind: "set", field: "move", value: 10 },
      { kind: "add", field: "wounds", delta: 2 },
      { kind: "addKeywords", value: ["Ignored by profile"] },
    ];

    const result = applyEffectsToProfile(
      {
        move: 6,
        toughness: 4,
        save: 3,
        wounds: 4,
        leadership: 6,
        objectiveControl: 1,
      },
      effects,
    );

    expect(result.move).toBe(10);
    expect(result.wounds).toBe(6);
    expect(result.toughness).toBe(4);
  });
});

describe("applyEffectsToSheet", () => {
  it("applies keyword and leader-unit effects", () => {
    const effects: Effect[] = [
      { kind: "remove", field: "keywords", value: "Tacticus" },
      { kind: "addKeywords", value: ["Fly", "Jump Pack"] },
      { kind: "setLeaderUnits", value: ["Outrider Squad"] },
      { kind: "addLeaderUnits", value: ["Attack Bike Squad"] },
    ];

    const result = applyEffectsToSheet(makeSheet(), effects);

    expect(result.keywords).toEqual(["Infantry", "Fly", "Jump Pack"]);
    expect(result.leaderUnits).toEqual(["Outrider Squad", "Attack Bike Squad"]);
  });
});
