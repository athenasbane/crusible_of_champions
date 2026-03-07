import { useMemo, useState } from "react";
import { buildSheet } from "../engine/buildSheet";
import type { BuildInput } from "../engine/schema";
import { loadFaction } from "../rules/loadFaction";
import emperors_children_raw from "../rules/emperors-children.json";
import chaos_space_marines_raw from "../rules/chaos-space-marines.json";
import death_guard_raw from "../rules/death-guard.json";
import thousand_sons_raw from "../rules/thousand-sons.json";
import chaos_daemons_raw from "../rules/chaos_daemons.json";
import { CharacterSheet } from "../sheet/CharacterSheet";
import { ArchetypeSelector } from "./ArchetypeSelector";
import { SpecialismSelector } from "./SpecialismSelector";
import { AbilitySelector } from "./AbilitySelector";
import { WeaponSelector } from "./WeaponSelector";
import { FactionSelector } from "./FactionSelector";
import {
  countWeapons,
  getEffectiveLoadoutRules,
} from "../engine/validateWeapons";
import { getWeaponRequirementStatus } from "../engine/weaponRequirements";
import { getWeaponGroupKey } from "../engine/weaponGrouping";
import { getAbilityPickCount } from "../engine/choicePicks";
import { getSelectedSpecialismIds, getSpecialismGroups } from "../engine/specialisms";
import "./builder.css";

const factionData: Record<string, unknown> = {
  "emperors-children": emperors_children_raw,
  "chaos-space-marines": chaos_space_marines_raw,
  "death-guard": death_guard_raw,
  "thousand-sons": thousand_sons_raw,
  "chaos-daemons": chaos_daemons_raw,
  // Placeholder until we have more factions
};

const availableFactions = [
  { id: "emperors-children", name: "Emperor's Children" },
  { id: "chaos-space-marines", name: "Chaos Space Marines" },
  { id: "death-guard", name: "Death Guard" },
  { id: "thousand-sons", name: "Thousand Sons" },
  { id: "chaos-daemons", name: "Chaos Daemons" },
  // Add more factions here
];

function sanitizeInputWeapons(
  faction: ReturnType<typeof loadFaction>,
  input: BuildInput,
) {
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

function sanitizeInputChoices(
  faction: ReturnType<typeof loadFaction>,
  input: BuildInput,
) {
  const abilityPickCount = getAbilityPickCount(faction, input.archetypeId);
  const specialismGroups = getSpecialismGroups(faction);
  const selectedSpecialismIds = getSelectedSpecialismIds(input);
  const allSpecialismOptions = specialismGroups.flatMap((group) => group.options);
  const specialismOptionIds = new Set(allSpecialismOptions.map((option) => option.id));

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

export function BuilderPage() {
  const [selectedFactionId, setSelectedFactionId] =
    useState("emperors-children");

  const faction = useMemo(() => {
    const raw = factionData[selectedFactionId];
    return loadFaction(raw);
  }, [selectedFactionId]);

  const [input, setInput] = useState<BuildInput>({
    archetypeId: faction.archetypes[0].id,
    specialismIds: [],
    abilityIds: [],
    weaponIds: [],
  });

  function setInputSanitized(
    updater: BuildInput | ((prev: BuildInput) => BuildInput),
  ) {
    setInput((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return sanitizeInputWeapons(faction, sanitizeInputChoices(faction, next));
    });
  }

  const result = useMemo(() => buildSheet(faction, input), [faction, input]);

  const selectedWeapons = useMemo(
    () => faction.weapons.filter((w) => input.weaponIds.includes(w.id)),
    [faction, input.weaponIds],
  );

  const weaponTypeCounts = useMemo(
    () => countWeapons(selectedWeapons),
    [selectedWeapons],
  );

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
    setInput({
      archetypeId: nextFaction.archetypes[0].id,
      specialismIds: [],
      abilityIds: [],
      weaponIds: [],
    });
  }

  return (
    <div className="builder-page">
      <div className="builder-layout">
        <div className="builder-controls no-print">
          <h1 className="builder-title">{faction.name} Builder</h1>
          <p className="builder-subtitle">
            Pick an archetype, optional specialism(s), ability, and legal weapon
            loadout.
          </p>
          <div className="builder-summary">
            <span className="builder-chip">
              Points: {result.type === "success" ? result.sheet.points : "—"}
            </span>
            <span className="builder-chip">
              Weapons:{" "}
              {weaponTypeCounts.ranged +
                weaponTypeCounts.pistol +
                weaponTypeCounts.melee}
            </span>
            <span className="builder-chip">
              R/P/M: {weaponTypeCounts.ranged}/{weaponTypeCounts.pistol}/
              {weaponTypeCounts.melee}
            </span>
          </div>
          <div className="builder-sections-grid">
            <div>
              {/* Faction Selector */}
              <FactionSelector
                factions={availableFactions}
                selectedFactionId={selectedFactionId}
                onSelect={handleFactionChange}
              />

              {/* Archetype */}
              <ArchetypeSelector
                input={input}
                setInput={setInputSanitized}
                faction={faction}
              />

              {/* Specialism */}
              <SpecialismSelector
                input={input}
                setInput={setInputSanitized}
                faction={faction}
              />
            </div>

            <div>
              {/* Ability */}
              <AbilitySelector
                input={input}
                setInput={setInputSanitized}
                faction={faction}
              />

              {/* Weapons */}
              <WeaponSelector
                input={input}
                toggleWeapon={toggleWeapon}
                faction={faction}
              />

              {/* Print */}
              <div className="builder-print">
                <button onClick={() => window.print()}>
                  Print / Save as PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sheet Renderer */}
        <div className="builder-preview">
          {result.type === "success" && <CharacterSheet sheet={result.sheet} />}
        </div>
      </div>

      {result.type === "error" && (
        <div className="builder-errors">
          <h3>Build Errors</h3>

          <ul>
            {result.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
