import { useMemo, useState } from "react";
import { buildSheet } from "../../engine/buildSheet";
import type { BuildInput, FactionRules } from "../../engine/schema";
import { loadFaction } from "../../rules/loadFaction";
import adeptus_astartes_raw from "../../rules/adeptus_astartes.json";
import emperors_children_raw from "../../rules/emperors-children.json";
import chaos_space_marines_raw from "../../rules/chaos-space-marines.json";
import death_guard_raw from "../../rules/death-guard.json";
import tyranids_raw from "../../rules/tyranids.json";
import thousand_sons_raw from "../../rules/thousand-sons.json";
import chaos_daemons_raw from "../../rules/chaos_daemons.json";
import dark_angels_raw from "../../rules/dark_angels.json";
import blood_angels_raw from "../../rules/blood_angels.json";
import space_wolves_raw from "../../rules/space_wolves.json";
import adeptus_custodes_raw from "../../rules/adeptus_custodes.json";
import black_templars_raw from "../../rules/black_templars.json";
import {
  countWeapons,
  getEffectiveLoadoutRules,
} from "../../engine/validateWeapons";
import { getWeaponRequirementStatus } from "../../engine/weaponRequirements";
import { getWeaponGroupKey } from "../../engine/weaponGrouping";
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
  "chaos-space-marines": chaos_space_marines_raw,
  "death-guard": death_guard_raw,
  "thousand-sons": thousand_sons_raw,
  "chaos-daemons": chaos_daemons_raw,
  "emperors-children": emperors_children_raw,
  tyranids: tyranids_raw,
};

export const availableFactions = [
  { id: "adeptus-astartes", name: "Adeptus Astartes" },
  { id: "dark-angels", name: "Dark Angels" },
  { id: "blood-angels", name: "Blood Angels" },
  { id: "space-wolves", name: "Space Wolves" },
  { id: "black-templars", name: "Black Templars" },
  { id: "adeptus-custodes", name: "Adeptus Custodes" },
  { id: "emperors-children", name: "Emperor's Children" },
  { id: "chaos-space-marines", name: "Chaos Space Marines" },
  { id: "death-guard", name: "Death Guard" },
  { id: "thousand-sons", name: "Thousand Sons" },
  { id: "chaos-daemons", name: "Chaos Daemons" },
  { id: "tyranids", name: "Tyranids" },
];

function sanitizeInputWeapons(faction: FactionRules, input: BuildInput) {
  const rules = getEffectiveLoadoutRules(faction, input.archetypeId);
  const counts = { ranged: 0, pistol: 0, melee: 0 };
  const sanitizedWeaponIds: string[] = [];
  const handledGroups = new Set<string>();

  for (const weaponId of input.weaponIds) {
    const weapon = faction.weapons.find((w) => w.id === weaponId);
    if (!weapon) continue;
    const groupKey = getWeaponGroupKey(weapon);
    if (handledGroups.has(groupKey)) continue;

    const requirementStatus = getWeaponRequirementStatus(
      weapon,
      input,
      faction,
    );
    if (!requirementStatus.met) continue;

    if (counts[weapon.type] >= rules.caps[weapon.type]) continue;

    const groupWeaponIds = faction.weapons
      .filter((candidate) => getWeaponGroupKey(candidate) === groupKey)
      .map((candidate) => candidate.id);

    sanitizedWeaponIds.push(...groupWeaponIds);
    handledGroups.add(groupKey);
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

  function toggleWeapon(id: string) {
    setInputSanitized((prev) => ({
      ...prev,
      weaponIds: (() => {
        const weapon = faction.weapons.find((w) => w.id === id);
        if (!weapon) return prev.weaponIds;

        const groupKey = getWeaponGroupKey(weapon);
        const groupWeaponIds = faction.weapons
          .filter((candidate) => getWeaponGroupKey(candidate) === groupKey)
          .map((candidate) => candidate.id);
        const hasAnySelected = groupWeaponIds.some((groupId) =>
          prev.weaponIds.includes(groupId),
        );

        if (hasAnySelected) {
          return prev.weaponIds.filter(
            (selectedId) => !groupWeaponIds.includes(selectedId),
          );
        }

        return [...prev.weaponIds, ...groupWeaponIds];
      })(),
    }));
  }

  function handleFactionChange(factionId: string) {
    setSelectedFactionId(factionId);
    const nextFaction = loadFaction(factionData[factionId]);
    setInput(getEmptyInput(nextFaction));
  }

  const result = useMemo(() => buildSheet(faction, input), [faction, input]);

  const selectedWeapons = useMemo(
    () =>
      faction.weapons.filter((weapon) => input.weaponIds.includes(weapon.id)),
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
    toggleWeapon,
    handleFactionChange,
  };
}
