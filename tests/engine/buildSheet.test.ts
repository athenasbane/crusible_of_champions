import { describe, expect, it } from "vitest";
import { buildSheet } from "../../src/engine/buildSheet";
import { loadFaction } from "../../src/rules/loadFaction";
import adeptusAstartesRaw from "../../src/rules/adeptus_astartes.json";

describe("buildSheet", () => {
  it("adds weapon points from selected loadout groups", () => {
    const faction = loadFaction(adeptusAstartesRaw);

    const result = buildSheet(faction, {
      archetypeId: "venerable_battle_brother",
      specialismIds: [],
      abilityIds: [],
      weaponIds: [
        "armoured_feet",
        "ballistus_lascannon",
        "twin_multi_melta",
        "twin_icarus_ironhail_heavy_stubber",
      ],
    });

    expect(result.type).toBe("success");
    if (result.type !== "success") return;

    expect(result.sheet.points).toBe(180);
  });

  it("does not double-count points for profile variants in same group", () => {
    const faction = loadFaction(adeptusAstartesRaw);

    const result = buildSheet(faction, {
      archetypeId: "venerable_battle_brother",
      specialismIds: [],
      abilityIds: [],
      weaponIds: [
        "armoured_feet",
        "macro_plasma_incinerator_standard",
        "macro_plasma_incinerator_supercharge",
      ],
    });

    expect(result.type).toBe("success");
    if (result.type !== "success") return;

    expect(result.sheet.points).toBe(170);
  });

  it("adds granted weapons from addWeapons effects", () => {
    const faction = loadFaction({
      id: "test_faction",
      name: "Test Faction",
      defaultLoadout: {
        caps: { ranged: 1, pistol: 0, melee: 1 },
        mins: { melee: 1 },
      },
      archetypes: [
        {
          id: "test_archetype",
          name: "Test Archetype",
          abilitiesText: [],
          profile: {
            move: 6,
            toughness: 4,
            save: 3,
            wounds: 4,
            leadership: 6,
            objectiveControl: 1,
          },
          points: 50,
          modelCount: 1,
          leaderUnits: [],
          keywords: ["Infantry"],
          factionKeywords: ["Test Faction"],
        },
      ],
      specialisms: {
        id: "specialisms",
        title: "Specialisms",
        pick: 1,
        options: [
          {
            id: "free_carbine",
            name: "Free Carbine",
            text: "Gain a carbine.",
            points: 5,
            effects: [{ kind: "addWeapons", value: ["bonus_carbine"] }],
          },
        ],
      },
      abilities: {
        id: "abilities",
        title: "Abilities",
        pick: 1,
        options: [],
      },
      weapons: [
        {
          id: "combat_blade",
          name: "Combat blade",
          type: "melee",
          range: "Melee",
          attacks: "4",
          skill: "3+",
          strength: "4",
          ap: "0",
          damage: "1",
          keywords: [],
        },
        {
          id: "bonus_carbine",
          name: "Bonus carbine",
          type: "ranged",
          range: "24\"",
          attacks: "2",
          skill: "3+",
          strength: "4",
          ap: "0",
          damage: "1",
          keywords: [],
        },
      ],
    });

    const result = buildSheet(faction, {
      archetypeId: "test_archetype",
      specialismIds: ["free_carbine"],
      abilityIds: [],
      weaponIds: ["combat_blade"],
    });

    expect(result.type).toBe("success");
    if (result.type !== "success") return;

    expect(result.sheet.points).toBe(55);
    expect(result.sheet.weapons.some((weapon) => weapon.id === "bonus_carbine")).toBe(true);
    expect(result.sheet.weapons.some((weapon) => weapon.id === "combat_blade")).toBe(true);
  });
});
