import { describe, expect, it } from "vitest";
import { loadFaction } from "../../src/rules/loadFaction";
import adeptusAstartesRaw from "../../src/rules/adeptus_astartes.json";
import { countWeapons, validateWeapons } from "../../src/engine/validateWeapons";

const faction = loadFaction(adeptusAstartesRaw);

describe("validateWeapons", () => {
  it("counts profile variants as one weapon group", () => {
    const weapons = faction.weapons.filter((weapon) =>
      ["macro_plasma_incinerator_standard", "macro_plasma_incinerator_supercharge"].includes(
        weapon.id,
      ),
    );

    const counts = countWeapons(weapons);

    expect(counts.ranged).toBe(1);
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
});
