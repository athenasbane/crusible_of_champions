import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { loadFaction } from "../../../src/rules/loadFaction";
import adeptusAstartesRaw from "../../../src/rules/adeptus_astartes.json";
import { useAbilityOptions } from "../../../src/builder/hooks/useAbilityOptions";
import { useSpecialismOptions } from "../../../src/builder/hooks/useSpecialismOptions";
import { useWeaponOptions } from "../../../src/builder/hooks/useWeaponOptions";
import { useBuilderState } from "../../../src/builder/hooks/useBuilderState";

const faction = loadFaction(adeptusAstartesRaw);

describe("builder option hooks", () => {
  it("builds ability option state with cap handling", () => {
    const input = {
      archetypeId: "champion_of_the_chapter",
      specialismIds: [],
      abilityIds: [faction.abilities.options[0].id],
      weaponIds: [],
    };

    const { result } = renderHook(() => useAbilityOptions(input, faction));

    expect(result.current.pickCount).toBe(1);
    expect(result.current.selectedCount).toBe(1);
    const unselected = result.current.options.find((option) => !option.selected);
    expect(unselected?.atCap).toBe(true);
  });

  it("builds specialism groups including current selection", () => {
    const input = {
      archetypeId: "champion_of_the_chapter",
      specialismIds: ["raider_pattern_bike"],
      abilityIds: [],
      weaponIds: [],
    };

    const { result } = renderHook(() => useSpecialismOptions(input, faction));

    expect(result.current.length).toBeGreaterThan(0);
    expect(result.current[0].selectedId).toBe("raider_pattern_bike");
  });

  it("builds weapon sections and points labels", () => {
    const input = {
      archetypeId: "venerable_battle_brother",
      specialismIds: [],
      abilityIds: [],
      weaponIds: ["ballistus_lascannon", "armoured_feet"],
    };

    const { result } = renderHook(() => useWeaponOptions(input, faction));

    const ranged = result.current.sections.find((section) => section.title === "Ranged");
    expect(ranged).toBeTruthy();

    const ballistus = ranged?.groups.find((group) => group.name === "Ballistus lascannon");
    expect(ballistus?.selected).toBe(true);
    expect(ballistus?.points).toBe(10);
  });
});

describe("useBuilderState", () => {
  it("toggles a weapon by group (selects both profiles, then clears both)", () => {
    const { result } = renderHook(() => useBuilderState());

    act(() => {
      result.current.setArchetype("venerable_battle_brother");
      result.current.toggleWeapon("macro_plasma_incinerator_standard");
    });

    expect(result.current.input.weaponIds).toContain("macro_plasma_incinerator_standard");
    expect(result.current.input.weaponIds).toContain("macro_plasma_incinerator_supercharge");

    act(() => {
      result.current.toggleWeapon("macro_plasma_incinerator_standard");
    });

    expect(result.current.input.weaponIds).not.toContain("macro_plasma_incinerator_standard");
    expect(result.current.input.weaponIds).not.toContain("macro_plasma_incinerator_supercharge");
  });

  it("resets input when faction changes", () => {
    const { result } = renderHook(() => useBuilderState());
    const abilityId = result.current.faction.abilities.options[0].id;

    act(() => {
      result.current.setArchetype("venerable_battle_brother");
      result.current.toggleAbility(abilityId, true);
      result.current.toggleWeapon("ballistus_lascannon");
    });

    act(() => {
      result.current.handleFactionChange("tyranids");
    });

    expect(result.current.selectedFactionId).toBe("tyranids");
    expect(result.current.input.specialismIds).toEqual([]);
    expect(result.current.input.abilityIds).toEqual([]);
    expect(result.current.input.weaponIds).toEqual([]);
    expect(result.current.input.archetypeId).toBe(result.current.faction.archetypes[0].id);
  });
});
