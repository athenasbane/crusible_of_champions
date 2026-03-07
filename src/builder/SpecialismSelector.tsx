import type { BuildInput, FactionRules } from "../engine/schema";
import { getChoiceRequirementStatus } from "../engine/weaponRequirements";
import { getSelectedSpecialismIds, getSpecialismGroups } from "../engine/specialisms";

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
  const groups = getSpecialismGroups(faction);
  const selectedSpecialismIds = getSelectedSpecialismIds(input);

  return (
    <section className="builder-section">
      <h2 className="builder-section-title">
        Specialism{groups.length > 1 ? "s" : ""}
      </h2>
      <p className="builder-help">
        Optional. Choose up to one per specialism group.
      </p>
      {groups.map((group) => {
        const selectedGroupId = selectedSpecialismIds.find((selectedId) =>
          group.options.some((option) => option.id === selectedId),
        );

        return (
          <div key={group.id} style={{ marginBottom: 10 }}>
            <h3 className="builder-help" style={{ marginTop: 4, marginBottom: 8 }}>
              {group.title}
            </h3>
            <div className="builder-option">
              <label className="builder-option-label">
                <input
                  type="radio"
                  name={`specialism-${group.id}`}
                  checked={!selectedGroupId}
                  onChange={() =>
                    setInput((prev) => ({
                      ...prev,
                      specialismIds: prev.specialismIds.filter(
                        (selectedId) =>
                          !group.options.some((option) => option.id === selectedId),
                      ),
                    }))
                  }
                />
                <span>
                  <span className="builder-option-title">None</span>
                </span>
              </label>
            </div>
            {group.options.map((specialism) => {
              const requirementStatus = getChoiceRequirementStatus(
                specialism,
                input,
                faction,
              );
              const selected = selectedSpecialismIds.includes(specialism.id);
              const disabled = !selected && !requirementStatus.met;

              return (
                <div
                  key={specialism.id}
                  className={`builder-option ${disabled ? "builder-option-disabled" : ""}`}
                >
                  <label className="builder-option-label">
                    <input
                      type="radio"
                      name={`specialism-${group.id}`}
                      value={specialism.id}
                      checked={selected}
                      onChange={(e) =>
                        setInput((prev) => ({
                          ...prev,
                          specialismIds: [
                            ...prev.specialismIds.filter(
                              (selectedId) =>
                                !group.options.some(
                                  (option) => option.id === selectedId,
                                ),
                            ),
                            e.target.value,
                          ],
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
                        <strong>Requires:</strong>{" "}
                        {requirementStatus.labels.join(" + ")}
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
          </div>
        );
      })}
    </section>
  );
};
