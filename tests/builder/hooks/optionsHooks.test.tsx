import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { loadFaction } from "../../../src/rules/loadFaction";
import adeptusAstartesRaw from "../../../src/rules/adeptus_astartes.json";
import orksRaw from "../../../src/rules/orks.json";
import { useAbilityOptions } from "../../../src/builder/hooks/useAbilityOptions";
import { useSpecialismOptions } from "../../../src/builder/hooks/useSpecialismOptions";
import { useWeaponOptions } from "../../../src/builder/hooks/useWeaponOptions";
import { useBuilderState } from "../../../src/builder/hooks/useBuilderState";

const faction = loadFaction(adeptusAstartesRaw);
const orksFaction = loadFaction(orksRaw);

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
    expect(ballistus?.quantity).toBe(1);
    expect(ballistus?.points).toBe(10);
  });

  it("marks non-allowed upstart gretchin weapons as unavailable", () => {
    const input = {
      archetypeId: "upstart_gretchin",
      specialismIds: [],
      abilityIds: [],
      weaponIds: [],
    };

    const { result } = renderHook(() => useWeaponOptions(input, orksFaction));
    const pistolSection = result.current.sections.find((section) => section.title === "Pistol");
    const rokkitPistol = pistolSection?.groups.find((group) => group.name === "Rokkit pistol");

    expect(rokkitPistol?.canAdd).toBe(false);
    expect(rokkitPistol?.unavailableReasons).toContain("Not available for this archetype");
  });
});

describe("useBuilderState", () => {
  it("changes weapon quantity by group", () => {
    const { result } = renderHook(() => useBuilderState());

    act(() => {
      result.current.setArchetype("venerable_battle_brother");
      result.current.changeWeaponQuantity("macro_plasma_incinerator_standard", 1);
      result.current.changeWeaponQuantity("macro_plasma_incinerator_standard", 1);
    });

    expect(result.current.input.weaponIds).toEqual([
      "macro_plasma_incinerator_standard",
      "macro_plasma_incinerator_standard",
    ]);

    act(() => {
      result.current.changeWeaponQuantity("macro_plasma_incinerator_standard", -1);
    });

    expect(result.current.input.weaponIds).toEqual([
      "macro_plasma_incinerator_standard",
    ]);
  });

  it("updates character name for sheet output", () => {
    const { result } = renderHook(() => useBuilderState());

    act(() => {
      result.current.setCharacterName("Grimtoof");
      result.current.changeWeaponQuantity("close_combat_weapon", 1);
    });

    expect(result.current.input.name).toBe("Grimtoof");
    expect(result.current.result.type).toBe("success");
    if (result.current.result.type === "success") {
      expect(result.current.result.sheet.name).toBe("Grimtoof");
    }
  });

  it("resets input when faction changes", () => {
    const { result } = renderHook(() => useBuilderState());
    const abilityId = result.current.faction.abilities.options[0].id;

    act(() => {
      result.current.setArchetype("venerable_battle_brother");
      result.current.toggleAbility(abilityId, true);
      result.current.changeWeaponQuantity("ballistus_lascannon", 1);
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

  it("does not keep duplicate max-1-per-model weapons", () => {
    const { result } = renderHook(() => useBuilderState());

    act(() => {
      result.current.handleFactionChange("adeptus-sororitas");
    });

    act(() => {
      result.current.setArchetype("reliquant_knight");
      result.current.changeWeaponQuantity("paragon_war_blade", 1);
      result.current.changeWeaponQuantity("paragon_war_blade", 1);
    });

    expect(result.current.input.weaponIds).toEqual(["paragon_war_blade"]);
  });

  it("enforces archetype group caps from data (up to two grot blastas)", () => {
    const { result } = renderHook(() => useBuilderState());

    act(() => {
      result.current.handleFactionChange("orks");
    });

    act(() => {
      result.current.setArchetype("upstart_gretchin");
      result.current.changeWeaponQuantity("grot_blasta", 1);
      result.current.changeWeaponQuantity("grot_blasta", 1);
      result.current.changeWeaponQuantity("grot_blasta", 1);
    });

    expect(result.current.input.weaponIds).toEqual([
      "grot_blasta",
      "grot_blasta",
    ]);
  });

  it("rejects non-allowed weapons for upstart gretchin", () => {
    const { result } = renderHook(() => useBuilderState());

    act(() => {
      result.current.handleFactionChange("orks");
    });

    act(() => {
      result.current.setArchetype("upstart_gretchin");
      result.current.changeWeaponQuantity("rokkit_pistol", 1);
    });

    expect(result.current.input.weaponIds).toEqual([]);
  });

  it("allows upstart gretchin to take attack squig and close-combat weapon together", () => {
    const { result } = renderHook(() => useBuilderState());

    act(() => {
      result.current.handleFactionChange("orks");
    });

    act(() => {
      result.current.setArchetype("upstart_gretchin");
      result.current.changeWeaponQuantity("attack_squig", 1);
      result.current.changeWeaponQuantity("close_combat_weapon", 1);
    });

    expect(result.current.input.weaponIds).toEqual([
      "attack_squig",
      "close_combat_weapon",
    ]);
  });

  it("selects dreadnought slot options via slot guide actions", () => {
    const { result } = renderHook(() => useBuilderState());

    act(() => {
      result.current.setArchetype("venerable_battle_brother");
      result.current.selectWeaponSlotOption("dreadnought_primary", "primary_ballistus");
      result.current.selectWeaponSlotOption("dreadnought_secondary", "secondary_twin_storm_bolter");
      result.current.selectWeaponSlotOption("dreadnought_main_gun", "main_ballistus_lascannon");
    });

    expect(result.current.input.weaponIds).toEqual([
      "ballistus_missile_launcher_frag",
      "armoured_feet",
      "twin_storm_bolter",
      "ballistus_lascannon",
    ]);
  });
});
