import { CharacterSheet } from "../sheet/CharacterSheet";
import { ArchetypeSelector } from "./ArchetypeSelector";
import { SpecialismSelector } from "./SpecialismSelector";
import { AbilitySelector } from "./AbilitySelector";
import { WeaponSelector } from "./WeaponSelector";
import { FactionSelector } from "./FactionSelector";
import { useBuilderState, availableFactions } from "./hooks/useBuilderState";
import { useAbilityOptions } from "./hooks/useAbilityOptions";
import { useSpecialismOptions } from "./hooks/useSpecialismOptions";
import { useWeaponOptions } from "./hooks/useWeaponOptions";
import "./builder.css";

export function BuilderPage() {
  const {
    selectedFactionId,
    faction,
    input,
    result,
    points,
    weaponTypeCounts,
    selectedWeaponCount,
    setCharacterName,
    setArchetype,
    toggleAbility,
    clearSpecialismGroup,
    selectSpecialism,
    changeWeaponQuantity,
    selectWeaponSlotOption,
    handleFactionChange,
  } = useBuilderState();

  const abilityView = useAbilityOptions(input, faction);
  const specialismGroups = useSpecialismOptions(input, faction);
  const weaponView = useWeaponOptions(input, faction);

  return (
    <div className="builder-page">
      <header className="builder-disclaimer no-print">
        Check rules with the source material. Our best effort has been made to
        keep everything correct, but nurglings sometimes get into the code.
      </header>

      <div className="builder-layout">
        <div className="builder-controls no-print">
          <h1 className="builder-title">{faction.name} Builder</h1>
          <p className="builder-subtitle">
            Pick an archetype, optional specialism(s), ability, and legal weapon
            loadout.
          </p>
          <div className="builder-summary">
            <span className="builder-chip">Points: {points ?? "—"}</span>
            <span className="builder-chip">Weapons: {selectedWeaponCount}</span>
            <span className="builder-chip">
              R/P/M: {weaponTypeCounts.ranged}/{weaponTypeCounts.pistol}/
              {weaponTypeCounts.melee}
            </span>
          </div>
          <div className="builder-section">
            <div className="builder-faction-row">
              <label className="builder-label" htmlFor="character-name-input">
                Character Name
              </label>
              <input
                id="character-name-input"
                className="builder-select"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                value={input.name ?? ""}
                onChange={(event) => setCharacterName(event.target.value)}
                placeholder="Enter character name"
              />
            </div>
          </div>
          <div className="builder-sections-grid">
            <div>
              <FactionSelector
                factions={availableFactions}
                selectedFactionId={selectedFactionId}
                onSelect={handleFactionChange}
              />

              <ArchetypeSelector
                input={input}
                faction={faction}
                onSelectArchetype={setArchetype}
              />

              <SpecialismSelector
                groups={specialismGroups}
                onClearGroup={clearSpecialismGroup}
                onSelectSpecialism={selectSpecialism}
              />
            </div>

            <div>
              <AbilitySelector
                view={abilityView}
                onToggleAbility={toggleAbility}
              />

              <WeaponSelector
                sections={weaponView.sections}
                slotGuide={weaponView.slotGuide}
                loadoutRules={weaponView.loadoutRules}
                onChangeWeaponQuantity={changeWeaponQuantity}
                onSelectSlotOption={selectWeaponSlotOption}
              />

              <div className="builder-print">
                <button onClick={() => window.print()}>
                  Print / Save as PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="builder-preview">
          {result.type === "success" && <CharacterSheet sheet={result.sheet} />}
        </div>
      </div>

      {result.type === "error" && (
        <div className="builder-errors">
          <h3>Build Errors</h3>

          <ul>
            {result.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
