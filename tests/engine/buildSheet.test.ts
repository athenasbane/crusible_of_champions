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
    expect(result.sheet.pointsBreakdown).toEqual({
      archetype: 160,
      specialisms: 0,
      abilities: 0,
      weapons: 20,
    });
  });

  it("prices a single selected weapon group once", () => {
    const faction = loadFaction(adeptusAstartesRaw);

    const result = buildSheet(faction, {
      archetypeId: "venerable_battle_brother",
      specialismIds: [],
      abilityIds: [],
      weaponIds: [
        "armoured_feet",
        "macro_plasma_incinerator_standard",
      ],
    });

    expect(result.type).toBe("success");
    if (result.type !== "success") return;

    expect(result.sheet.points).toBe(170);
    expect(result.sheet.pointsBreakdown).toEqual({
      archetype: 160,
      specialisms: 0,
      abilities: 0,
      weapons: 10,
    });
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
          group: "Combat blade",
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
          group: "Bonus carbine",
          type: "ranged",
          range: "24\"",
          attacks: "2",
          skill: "3+",
          strength: "4",
          ap: "0",
          damage: "1",
          keywords: [],
          points: 15,
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
    expect(result.sheet.pointsBreakdown).toEqual({
      archetype: 50,
      specialisms: 5,
      abilities: 0,
      weapons: 0,
    });
    expect(result.sheet.weapons.some((weapon) => weapon.id === "bonus_carbine")).toBe(true);
    expect(result.sheet.weapons.some((weapon) => weapon.id === "combat_blade")).toBe(true);
  });

  it("prices selected weapon groups with first two default groups free", () => {
    const faction = loadFaction({
      id: "test_faction_weapon_pricing",
      name: "Test Faction Weapon Pricing",
      defaultLoadout: {
        caps: { ranged: 2, pistol: 0, melee: 5 },
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
        options: [],
      },
      abilities: {
        id: "abilities",
        title: "Abilities",
        pick: 1,
        options: [],
      },
      weapons: [
        {
          id: "blade_a",
          name: "Blade A",
          group: "Blade A",
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
          id: "blade_b",
          name: "Blade B",
          group: "Blade B",
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
          id: "blade_c",
          name: "Blade C",
          group: "Blade C",
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
          id: "blade_d",
          name: "Blade D",
          group: "Blade D",
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
          id: "relic_gun",
          name: "Relic gun",
          group: "Relic gun",
          type: "ranged",
          range: "24\"",
          attacks: "2",
          skill: "3+",
          strength: "4",
          ap: "0",
          damage: "1",
          keywords: [],
          points: 10,
        },
      ],
    });

    const result = buildSheet(faction, {
      archetypeId: "test_archetype",
      specialismIds: [],
      abilityIds: [],
      weaponIds: ["blade_a", "blade_b", "blade_c", "blade_d", "relic_gun"],
    });

    expect(result.type).toBe("success");
    if (result.type !== "success") return;

    expect(result.sheet.points).toBe(70);
    expect(result.sheet.pointsBreakdown).toEqual({
      archetype: 50,
      specialisms: 0,
      abilities: 0,
      weapons: 20,
    });
  });

  it("rejects selecting more than one of a max-1-per-model weapon", () => {
    const faction = loadFaction({
      id: "test_faction_max_one",
      name: "Test Faction Max One",
      defaultLoadout: {
        caps: { ranged: 0, pistol: 0, melee: 3 },
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
        options: [],
      },
      abilities: {
        id: "abilities",
        title: "Abilities",
        pick: 1,
        options: [],
      },
      weapons: [
        {
          id: "max_one_blade",
          name: "Max One Blade",
          group: "Max One Blade",
          type: "melee",
          range: "Melee",
          attacks: "4",
          skill: "3+",
          strength: "5",
          ap: "-1",
          damage: "2",
          keywords: ["Max 1 per model"],
        },
      ],
    });

    const result = buildSheet(faction, {
      archetypeId: "test_archetype",
      specialismIds: [],
      abilityIds: [],
      weaponIds: ["max_one_blade", "max_one_blade"],
    });

    expect(result.type).toBe("error");
    if (result.type !== "error") return;

    expect(
      result.errors.some((error) => error.includes("max 1 per model")),
    ).toBe(true);
  });
});
