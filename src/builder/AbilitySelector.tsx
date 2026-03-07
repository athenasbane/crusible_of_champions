import type { BuildInput, FactionRules } from "../engine/schema";
import { getChoiceRequirementStatus } from "../engine/weaponRequirements";
import { getAbilityPickCount } from "../engine/choicePicks";

export type AbilitySelectorProps = {
  input: BuildInput;
  setInput: React.Dispatch<React.SetStateAction<BuildInput>>;
  faction: FactionRules;
};

export const AbilitySelector = ({
  input,
  setInput,
  faction,
}: AbilitySelectorProps) => {
  const pickCount = getAbilityPickCount(faction, input.archetypeId);
  const selectedCount = input.abilityIds.length;

  return (
    <section className="builder-section">
      <h2 className="builder-section-title">
        {pickCount > 1 ? "Abilities" : "Ability"} ({selectedCount}/{pickCount})
      </h2>
      {faction.abilities.options.map((ability) => {
        const requirementStatus = getChoiceRequirementStatus(ability, input, faction);
        const selected = input.abilityIds.includes(ability.id);
        const atCap = !selected && selectedCount >= pickCount;
        const disabled = !selected && (!requirementStatus.met || atCap);
        return (
          <div
            key={ability.id}
            className={`builder-option ${disabled ? "builder-option-disabled" : ""}`}
          >
            <label className="builder-option-label">
              <input
                type="checkbox"
                value={ability.id}
                checked={selected}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    abilityIds:
                      e.target.checked ?
                        [...prev.abilityIds, ability.id] :
                        prev.abilityIds.filter((id) => id !== ability.id),
                  }))
                }
                disabled={disabled}
              />
              <span>
                <span className="builder-option-title">
                  {ability.name}
                  {ability.points > 0 ?
                    ` (+${ability.points}pts)` : null}
                </span>
              </span>
            </label>
            <div className="builder-option-meta">
              {ability.text}
              {requirementStatus.labels.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <strong>Requires:</strong> {requirementStatus.labels.join(" + ")}
                </div>
              )}
              {!requirementStatus.met && (
                <div className="builder-option-warning">
                  Unavailable: {requirementStatus.unmet.join(" and ")}
                </div>
              )}
              {atCap && (
                <div className="builder-option-warning">
                  Unavailable: Ability cap reached
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
};
