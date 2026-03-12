import { describe, expect, it } from "vitest";
import { loadFaction } from "../../src/rules/loadFaction";
import adeptusAstartesRaw from "../../src/rules/adeptus_astartes.json";
import { countWeapons, validateWeapons } from "../../src/engine/validateWeapons";

const faction = loadFaction(adeptusAstartesRaw);

describe("validateWeapons", () => {
  it("counts each selected weapon entry", () => {
    const weapons = faction.weapons.filter((weapon) =>
      ["macro_plasma_incinerator_standard", "macro_plasma_incinerator_supercharge"].includes(
        weapon.id,
      ),
    );

    const counts = countWeapons(weapons);

    expect(counts.ranged).toBe(2);
    expect(counts.pistol).toBe(0);
    expect(counts.melee).toBe(0);
  });

  it("returns cap and minimum melee errors", () => {
    const rules = {
      caps: { ranged: 1, pistol: 0, melee: 1 },
      mins: { melee: 1 },
    };

    const tooManyRanged = faction.weapons.filter((weapon) =>
      ["forge_bolter", "storm_bolter"].includes(weapon.id),
    );
    const rangedErrors = validateWeapons(tooManyRanged, rules);

    expect(rangedErrors).toContain("Too many ranged weapons");
    expect(rangedErrors).toContain("You must take at least one melee weapon");
  });

  it("does not collapse duplicate picks by weapon group", () => {
    const weapons = faction.weapons.filter((weapon) =>
      ["plasma_pistol_standard", "plasma_pistol_supercharge"].includes(
        weapon.id,
      ),
    );

    const counts = countWeapons([
      {
        ...weapons[0],
        name: "Alpha profile",
        group: "Plasma pistol",
      },
      {
        ...weapons[1],
        name: "Beta profile",
        group: "Plasma pistol",
      },
    ]);

    expect(counts.ranged).toBe(0);
    expect(counts.pistol).toBe(2);
    expect(counts.melee).toBe(0);
  });
});
