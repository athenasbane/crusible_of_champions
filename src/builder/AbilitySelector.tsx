import type { AbilityOptionsView } from "./hooks/useAbilityOptions";

export type AbilitySelectorProps = {
  view: AbilityOptionsView;
  onToggleAbility: (abilityId: string, checked: boolean) => void;
};

export const AbilitySelector = ({
  view,
  onToggleAbility,
}: AbilitySelectorProps) => {
  return (
    <section className="builder-section">
      <h2 className="builder-section-title">
        {view.pickCount > 1 ? "Abilities" : "Ability"} ({view.selectedCount}/
        {view.pickCount})
      </h2>
      {view.options.map((ability) => (
        <div
          key={ability.id}
          className={`builder-option ${ability.disabled ? "builder-option-disabled" : ""}`}
        >
          <label className="builder-option-label">
            <input
              type="checkbox"
              value={ability.id}
              checked={ability.selected}
              onChange={(event) => onToggleAbility(ability.id, event.target.checked)}
              disabled={ability.disabled}
            />
            <span>
              <span className="builder-option-title">
                {ability.name}
                {ability.points > 0 ? ` (+${ability.points}pts)` : null}
              </span>
            </span>
          </label>
          <div className="builder-option-meta">
            {ability.text}
            {ability.requirementLabels.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <strong>Requires:</strong> {ability.requirementLabels.join(" + ")}
              </div>
            )}
            {ability.unmetRequirements.length > 0 && (
              <div className="builder-option-warning">
                Unavailable: {ability.unmetRequirements.join(" and ")}
              </div>
            )}
            {ability.atCap && (
              <div className="builder-option-warning">
                Unavailable: Ability cap reached
              </div>
            )}
          </div>
        </div>
      ))}
    </section>
  );
};
