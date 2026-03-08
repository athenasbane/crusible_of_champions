import { describe, expect, it } from "vitest";
import { loadFaction } from "../../src/rules/loadFaction";
import adeptusAstartesRaw from "../../src/rules/adeptus_astartes.json";
import { getChoiceRequirementStatus } from "../../src/engine/weaponRequirements";

const faction = loadFaction(adeptusAstartesRaw);
const blessing = faction.abilities.options.find(
  (ability) => ability.id === "blessing_of_the_omnissiah",
);

if (!blessing) {
  throw new Error("Expected blessing_of_the_omnissiah ability in fixture data");
}

describe("weaponRequirements / choice requirements", () => {
  it("fails keyword oneOf requirement for non-infantry/non-mounted archetype", () => {
    const status = getChoiceRequirementStatus(
      blessing,
      {
        archetypeId: "venerable_battle_brother",
        specialismIds: [],
        abilityIds: [],
        weaponIds: [],
      },
      faction,
    );

    expect(status.met).toBe(false);
    expect(status.unmet[0]).toContain("Keyword: INFANTRY or Keyword: MOUNTED");
  });

  it("passes keyword oneOf requirement when a specialism adds mounted", () => {
    const status = getChoiceRequirementStatus(
      blessing,
      {
        archetypeId: "champion_of_the_chapter",
        specialismIds: ["raider_pattern_bike"],
        abilityIds: [],
        weaponIds: [],
      },
      faction,
    );

    expect(status.met).toBe(true);
    expect(status.unmet).toEqual([]);
  });
});
