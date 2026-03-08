import { describe, expect, it } from "vitest";
import { loadFaction } from "../../src/rules/loadFaction";
import darkAngelsRaw from "../../src/rules/dark_angels.json";
import bloodAngelsRaw from "../../src/rules/blood_angels.json";

describe("loadFaction inheritance", () => {
  it("inherits archetypes and extends options/weapons from Adeptus Astartes", () => {
    const faction = loadFaction(darkAngelsRaw);

    expect(faction.id).toBe("dark_angels");
    expect(faction.archetypes.length).toBeGreaterThan(0);

    expect(
      faction.archetypes.some((archetype) => archetype.id === "champion_of_the_chapter"),
    ).toBe(true);

    expect(
      faction.specialisms.options.some((option) => option.id === "ravenwing_bike"),
    ).toBe(true);

    expect(
      faction.abilities.options.some((option) => option.id === "ravenwing_hunter"),
    ).toBe(true);

    expect(faction.weapons.some((weapon) => weapon.id === "plasma_talon_standard")).toBe(
      true,
    );

    expect(faction.weapons.some((weapon) => weapon.id === "forge_bolter")).toBe(true);
  });

  it("normalizes custom dark angels shorthand fields", () => {
    const faction = loadFaction(darkAngelsRaw);
    const ravenwing = faction.specialisms.options.find(
      (option) => option.id === "ravenwing_bike",
    );

    expect(ravenwing).toBeDefined();

    const effectKinds = (ravenwing?.effects ?? []).map((effect) => effect.kind);
    expect(effectKinds).toContain("remove");
    expect(effectKinds).toContain("addKeywords");
    expect(effectKinds).toContain("addWeapons");

    const allWeaponFieldsAreStrings = faction.weapons.every(
      (weapon) =>
        typeof weapon.range === "string" &&
        typeof weapon.attacks === "string" &&
        typeof weapon.strength === "string" &&
        typeof weapon.ap === "string" &&
        typeof weapon.damage === "string",
    );

    expect(allWeaponFieldsAreStrings).toBe(true);
  });

  it("adds dark angels as faction keyword to inherited archetypes", () => {
    const faction = loadFaction(darkAngelsRaw);
    const archetype = faction.archetypes.find(
      (candidate) => candidate.id === "champion_of_the_chapter",
    );

    expect(archetype).toBeDefined();
    expect(archetype?.factionKeywords).toContain("Adeptus Astartes");
    expect(archetype?.factionKeywords).toContain("Dark Angels");
  });

  it("loads blood angels inheritance and normalizes archetype requirement shorthand", () => {
    const faction = loadFaction(bloodAngelsRaw);

    expect(faction.id).toBe("blood_angels");
    expect(
      faction.archetypes.some((archetype) => archetype.id === "champion_of_the_chapter"),
    ).toBe(true);
    expect(
      faction.specialisms.options.some((option) => option.id === "death_company"),
    ).toBe(true);
    expect(
      faction.abilities.options.some((option) => option.id === "blood_chalice"),
    ).toBe(true);

    const hero = faction.specialisms.options.find(
      (option) => option.id === "hero_of_the_golden_host",
    );
    const requirement = hero?.requirements?.[0];
    expect(requirement?.kind).toBe("archetypeIs");
    if (requirement?.kind === "archetypeIs") {
      expect(requirement.archetypeId).toBe("champion_of_the_chapter");
    }
  });
});
