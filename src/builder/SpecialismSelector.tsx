import type { SpecialismGroupView } from "./hooks/useSpecialismOptions";

export type SpecialismSelectorProps = {
  groups: SpecialismGroupView[];
  onClearGroup: (groupId: string) => void;
  onSelectSpecialism: (groupId: string, specialismId: string) => void;
};

export const SpecialismSelector = ({
  groups,
  onClearGroup,
  onSelectSpecialism,
}: SpecialismSelectorProps) => {
  return (
    <section className="builder-section">
      <h2 className="builder-section-title">
        Specialism{groups.length > 1 ? "s" : ""}
      </h2>
      <p className="builder-help">
        Optional. Choose up to one per specialism group.
      </p>
      {groups.map((group) => (
        <div key={group.id} style={{ marginBottom: 10 }}>
          <h3 className="builder-help" style={{ marginTop: 4, marginBottom: 8 }}>
            {group.title}
          </h3>
          <div className="builder-option">
            <label className="builder-option-label">
              <input
                type="radio"
                name={`specialism-${group.id}`}
                checked={!group.selectedId}
                onChange={() => onClearGroup(group.id)}
              />
              <span>
                <span className="builder-option-title">None</span>
              </span>
            </label>
          </div>
          {group.options.map((specialism) => (
            <div
              key={specialism.id}
              className={`builder-option ${specialism.disabled ? "builder-option-disabled" : ""}`}
            >
              <label className="builder-option-label">
                <input
                  type="radio"
                  name={`specialism-${group.id}`}
                  value={specialism.id}
                  checked={specialism.selected}
                  onChange={() => onSelectSpecialism(group.id, specialism.id)}
                  disabled={specialism.disabled}
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
                {specialism.requirementLabels.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <strong>Requires:</strong> {specialism.requirementLabels.join(" + ")}
                  </div>
                )}
                {specialism.unmetRequirements.length > 0 && (
                  <div className="builder-option-warning">
                    Unavailable: {specialism.unmetRequirements.join(" and ")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
};
