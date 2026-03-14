import { useMemo, useState } from "react";
import { buildSheet } from "../../engine/buildSheet";
import type { BuildInput, FactionRules } from "../../engine/schema";
import { loadFaction } from "../../rules/loadFaction";
import adeptus_astartes_raw from "../../rules/adeptus_astartes.json";
import emperors_children_raw from "../../rules/emperors-children.json";
import chaos_space_marines_raw from "../../rules/chaos-space-marines.json";
import death_guard_raw from "../../rules/death-guard.json";
import astra_militarum_raw from "../../rules/astra_militarum.json";
import adeptus_sororitas_raw from "../../rules/adeptus_sororitas.json";
import tyranids_raw from "../../rules/tyranids.json";
import thousand_sons_raw from "../../rules/thousand-sons.json";
import chaos_daemons_raw from "../../rules/chaos_daemons.json";
import dark_angels_raw from "../../rules/dark_angels.json";
import blood_angels_raw from "../../rules/blood_angels.json";
import space_wolves_raw from "../../rules/space_wolves.json";
import adeptus_custodes_raw from "../../rules/adeptus_custodes.json";
import black_templars_raw from "../../rules/black_templars.json";
import adeptus_mechanicus_raw from "../../rules/adeptus_mechanicus.json";
import necrons_raw from "../../rules/necrons.json";
import genestealer_cult_raw from "../../rules/genestealer_cults.json";
import tau_raw from "../../rules/tau_empire.json";
import orks_raw from "../../rules/orks.json";
import {
  countWeapons,
  getEffectiveLoadoutRules,
} from "../../engine/validateWeapons";
import { getWeaponRequirementStatus } from "../../engine/weaponRequirements";
import { getWeaponGroupKey } from "../../engine/weaponGrouping";
import { isGroupMaxOnePerModel } from "../../engine/weaponLimits";
import {
  getGroupCapForWeapon,
  isWeaponAllowedForSelectionRules,
} from "../../engine/weaponSelectionRules";
import { getAbilityPickCount } from "../../engine/choicePicks";
import {
  getSelectedSpecialismIds,
  getSpecialismGroups,
} from "../../engine/specialisms";

const factionData: Record<string, unknown> = {
  "adeptus-astartes": adeptus_astartes_raw,
  "dark-angels": dark_angels_raw,
  "blood-angels": blood_angels_raw,
  "space-wolves": space_wolves_raw,
  "black-templars": black_templars_raw,
  "adeptus-custodes": adeptus_custodes_raw,
  "astra-militarum": astra_militarum_raw,
  "adeptus-mechanicus": adeptus_mechanicus_raw,
  "adeptus-sororitas": adeptus_sororitas_raw,
  "chaos-space-marines": chaos_space_marines_raw,
  "death-guard": death_guard_raw,
  "thousand-sons": thousand_sons_raw,
  "chaos-daemons": chaos_daemons_raw,
  "emperors-children": emperors_children_raw,
  "genestealer-cult": genestealer_cult_raw,
  tyranids: tyranids_raw,
  necrons: necrons_raw,
  tau: tau_raw,
  orks: orks_raw,
};

export const availableFactions = [
  { id: "adeptus-astartes", name: "Adeptus Astartes" },
  { id: "dark-angels", name: "Dark Angels" },
  { id: "blood-angels", name: "Blood Angels" },
  { id: "space-wolves", name: "Space Wolves" },
  { id: "black-templars", name: "Black Templars" },
  { id: "adeptus-custodes", name: "Adeptus Custodes" },
  { id: "astra-militarum", name: "Astra Militarum" },
  { id: "adeptus-mechanicus", name: "Adeptus Mechanicus" },
  { id: "adeptus-sororitas", name: "Adeptus Sororitas" },
  { id: "emperors-children", name: "Emperor's Children" },
  { id: "chaos-space-marines", name: "Chaos Space Marines" },
  { id: "death-guard", name: "Death Guard" },
  { id: "thousand-sons", name: "Thousand Sons" },
  { id: "chaos-daemons", name: "Chaos Daemons" },
  { id: "tyranids", name: "Tyranids" },
  { id: "necrons", name: "Necrons" },
  { id: "tau", name: "Tau Empire" },
  { id: "orks", name: "Orks" },
  { id: "genestealer-cult", name: "Genestealer Cult" },
];

function sanitizeInputWeapons(faction: FactionRules, input: BuildInput) {
  const rules = getEffectiveLoadoutRules(faction, input.archetypeId);
  const counts = { ranged: 0, pistol: 0, melee: 0 };
  const sanitizedWeaponIds: string[] = [];
  const quantitiesByGroup: Record<string, number> = {};

  for (const weaponId of input.weaponIds) {
    const weapon = faction.weapons.find((w) => w.id === weaponId);
    if (!weapon) continue;
    const groupKey = getWeaponGroupKey(weapon);

    const requirementStatus = getWeaponRequirementStatus(
      weapon,
      input,
      faction,
    );
    if (!requirementStatus.met) continue;
    if (!isWeaponAllowedForSelectionRules(faction, input, weapon)) continue;

    if (counts[weapon.type] >= rules.caps[weapon.type]) continue;
    if (isGroupMaxOnePerModel(faction, groupKey) && (quantitiesByGroup[groupKey] ?? 0) >= 1) {
      continue;
    }
    const groupCap = getGroupCapForWeapon(faction, input, weapon);
    if (typeof groupCap === "number" && (quantitiesByGroup[groupKey] ?? 0) >= groupCap) {
      continue;
    }

    const representativeWeapon = faction.weapons.find(
      (candidate) => getWeaponGroupKey(candidate) === groupKey,
    );
    if (!representativeWeapon) continue;

    sanitizedWeaponIds.push(representativeWeapon.id);
    quantitiesByGroup[groupKey] = (quantitiesByGroup[groupKey] ?? 0) + 1;
    counts[weapon.type] += 1;
  }

  return { ...input, weaponIds: sanitizedWeaponIds };
}

function sanitizeInputChoices(faction: FactionRules, input: BuildInput) {
  const abilityPickCount = getAbilityPickCount(faction, input.archetypeId);
  const specialismGroups = getSpecialismGroups(faction);
  const selectedSpecialismIds = getSelectedSpecialismIds(input);
  const allSpecialismOptions = specialismGroups.flatMap(
    (group) => group.options,
  );
  const specialismOptionIds = new Set(
    allSpecialismOptions.map((option) => option.id),
  );

  const specialismIds = selectedSpecialismIds.filter((specialismId) =>
    specialismOptionIds.has(specialismId),
  );

  const specialismIdsByGroup = specialismGroups.flatMap((group) => {
    const groupIds = specialismIds.filter((specialismId) =>
      group.options.some((option) => option.id === specialismId),
    );
    return groupIds.slice(0, group.pick);
  });

  const abilityOptions = new Set(
    faction.abilities.options.map((ability) => ability.id),
  );
  const uniqueAbilityIds = [...new Set(input.abilityIds)].filter((abilityId) =>
    abilityOptions.has(abilityId),
  );

  const abilityIds = uniqueAbilityIds.slice(0, abilityPickCount);

  return { ...input, specialismIds: specialismIdsByGroup, abilityIds };
}

function getEmptyInput(faction: FactionRules): BuildInput {
  return {
    archetypeId: faction.archetypes[0].id,
    specialismIds: [],
    abilityIds: [],
    weaponIds: [],
  };
}

export function useBuilderState() {
  const [selectedFactionId, setSelectedFactionId] =
    useState("adeptus-astartes");

  const faction = useMemo(() => {
    const raw = factionData[selectedFactionId];
    return loadFaction(raw);
  }, [selectedFactionId]);

  const [input, setInput] = useState<BuildInput>(() => getEmptyInput(faction));

  function setInputSanitized(
    updater: BuildInput | ((prev: BuildInput) => BuildInput),
  ) {
    setInput((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return sanitizeInputWeapons(faction, sanitizeInputChoices(faction, next));
    });
  }

  function setArchetype(archetypeId: string) {
    setInputSanitized((prev) => ({ ...prev, archetypeId }));
  }

  function toggleAbility(abilityId: string, checked: boolean) {
    setInputSanitized((prev) => ({
      ...prev,
      abilityIds: checked
        ? [...prev.abilityIds, abilityId]
        : prev.abilityIds.filter((id) => id !== abilityId),
    }));
  }

  function clearSpecialismGroup(groupId: string) {
    const group = getSpecialismGroups(faction).find(
      (item) => item.id === groupId,
    );
    if (!group) return;

    setInputSanitized((prev) => ({
      ...prev,
      specialismIds: prev.specialismIds.filter(
        (selectedId) =>
          !group.options.some((option) => option.id === selectedId),
      ),
    }));
  }

  function selectSpecialism(groupId: string, specialismId: string) {
    const group = getSpecialismGroups(faction).find(
      (item) => item.id === groupId,
    );
    if (!group) return;

    setInputSanitized((prev) => ({
      ...prev,
      specialismIds: [
        ...prev.specialismIds.filter(
          (selectedId) =>
            !group.options.some((option) => option.id === selectedId),
        ),
        specialismId,
      ],
    }));
  }

  function changeWeaponQuantity(id: string, delta: 1 | -1) {
    setInputSanitized((prev) => ({
      ...prev,
      weaponIds: (() => {
        const weapon = faction.weapons.find((w) => w.id === id);
        if (!weapon) return prev.weaponIds;

        const groupKey = getWeaponGroupKey(weapon);
        const representativeWeapon = faction.weapons.find(
          (candidate) => getWeaponGroupKey(candidate) === groupKey,
        );
        if (!representativeWeapon) return prev.weaponIds;

        if (delta > 0) {
          return [...prev.weaponIds, representativeWeapon.id];
        }

        const removeIndex = prev.weaponIds.lastIndexOf(representativeWeapon.id);
        if (removeIndex < 0) return prev.weaponIds;
        return prev.weaponIds.filter((_, index) => index !== removeIndex);
      })(),
    }));
  }

  function selectWeaponSlotOption(slotId: string, optionId: string) {
    setInputSanitized((prev) => {
      const archetype = faction.archetypes.find(
        (item) => item.id === prev.archetypeId,
      );
      const slotRules = archetype?.weaponSelectionRules?.slots;
      if (!slotRules?.length) return prev;

      const slot = slotRules.find((item) => item.id === slotId);
      if (!slot) return prev;
      const option = slot.options.find((item) => item.id === optionId);
      if (!option) return prev;

      const selectedWeapons = prev.weaponIds
        .map((weaponId) =>
          faction.weapons.find((weapon) => weapon.id === weaponId),
        )
        .filter(
          (weapon): weapon is (typeof faction.weapons)[number] =>
            weapon !== undefined,
        );

      const selectedCounts = selectedWeapons.reduce<Record<string, number>>(
        (counts, weapon) => {
          const key = (weapon.group ?? weapon.name).toLowerCase();
          counts[key] = (counts[key] ?? 0) + 1;
          return counts;
        },
        {},
      );

      const optionAlreadySelected = option.groups.every(
        (groupName) => (selectedCounts[groupName.toLowerCase()] ?? 0) > 0,
      );

      const groupsInSlot = new Set(
        slot.options
          .flatMap((slotOption) => slotOption.groups)
          .map((groupName) => groupName.toLowerCase()),
      );

      const remainingWeaponIds = prev.weaponIds.filter((weaponId) => {
        const weapon = faction.weapons.find((candidate) => candidate.id === weaponId);
        if (!weapon) return false;
        return !groupsInSlot.has((weapon.group ?? weapon.name).toLowerCase());
      });

      if (optionAlreadySelected) {
        return { ...prev, weaponIds: remainingWeaponIds };
      }

      const addedWeaponIds = option.groups
        .map((groupName) =>
          faction.weapons.find(
            (weapon) =>
              (weapon.group ?? weapon.name).toLowerCase() ===
              groupName.toLowerCase(),
          ),
        )
        .filter(
          (weapon): weapon is (typeof faction.weapons)[number] =>
            weapon !== undefined,
        )
        .map((weapon) => weapon.id);

      return {
        ...prev,
        weaponIds: [...remainingWeaponIds, ...addedWeaponIds],
      };
    });
  }

  function handleFactionChange(factionId: string) {
    setSelectedFactionId(factionId);
    const nextFaction = loadFaction(factionData[factionId]);
    setInput(getEmptyInput(nextFaction));
  }

  const result = useMemo(() => buildSheet(faction, input), [faction, input]);

  const selectedWeapons = useMemo(
    () =>
      input.weaponIds
        .map((weaponId) => faction.weapons.find((weapon) => weapon.id === weaponId))
        .filter((weapon): weapon is (typeof faction.weapons)[number] => weapon !== undefined),
    [faction, input.weaponIds],
  );

  const weaponTypeCounts = useMemo(
    () => countWeapons(selectedWeapons),
    [selectedWeapons],
  );

  const selectedWeaponCount =
    weaponTypeCounts.ranged + weaponTypeCounts.pistol + weaponTypeCounts.melee;

  const points = result.type === "success" ? result.sheet.points : undefined;

  return {
    selectedFactionId,
    faction,
    input,
    result,
    points,
    weaponTypeCounts,
    selectedWeaponCount,
    setArchetype,
    toggleAbility,
    clearSpecialismGroup,
    selectSpecialism,
    changeWeaponQuantity,
    selectWeaponSlotOption,
    handleFactionChange,
  };
}
