import type { BuildInput, FactionRules } from "../engine/schema";
import { getChoiceRequirementStatus } from "../engine/weaponRequirements";

export type SpecialismSelectorProps = {
  input: BuildInput;
  setInput: React.Dispatch<React.SetStateAction<BuildInput>>;
  faction: FactionRules;
};

export const SpecialismSelector = ({
  input,
  setInput,
  faction,
}: SpecialismSelectorProps) => {
  return (
    <section className="builder-section">
      <h2 className="builder-section-title">Specialism</h2>
      <p className="builder-help">Optional. Choose one if you want extra rules and points.</p>
      <div className="builder-option">
        <label className="builder-option-label">
          <input
            type="radio"
            name="specialism"
            checked={!input.specialismId}
            onChange={() =>
              setInput((prev) => ({
                ...prev,
                specialismId: undefined,
              }))
            }
          />
          <span>
            <span className="builder-option-title">None</span>
          </span>
        </label>
      </div>
      {faction.specialisms.options.map((specialism) => {
        const requirementStatus = getChoiceRequirementStatus(
          specialism,
          input,
          faction,
        );
        const selected = input.specialismId === specialism.id;
        const disabled = !selected && !requirementStatus.met;

        return (
          <div
            key={specialism.id}
            className={`builder-option ${disabled ? "builder-option-disabled" : ""}`}
          >
            <label className="builder-option-label">
              <input
                type="radio"
                name="specialism"
                value={specialism.id}
                checked={selected}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    specialismId: e.target.value,
                  }))
                }
                disabled={disabled}
              />
              <span>
                <span className="builder-option-title">
                  {specialism.name}
                  {specialism.points > 0 && ` (+${specialism.points}pts)`}
                </span>
              </span>
            </label>
            <div className="builder-option-meta">
              {specialism.text}
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
            </div>
          </div>
        );
      })}
    </section>
  );
};
