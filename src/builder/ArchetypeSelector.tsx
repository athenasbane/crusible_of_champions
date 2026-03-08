import type { BuildInput, FactionRules } from "../engine/schema";

export type ArchetypeSelectorProps = {
  input: BuildInput;
  faction: FactionRules;
  onSelectArchetype: (archetypeId: string) => void;
};

export const ArchetypeSelector = ({
  input,
  faction,
  onSelectArchetype,
}: ArchetypeSelectorProps) => {
  return (
    <section className="builder-section">
      <h2 className="builder-section-title">Archetype</h2>
      {faction.archetypes.map((archetype) => (
        <div key={archetype.id} className="builder-option">
          <label className="builder-option-label">
            <input
              type="radio"
              name="archetype"
              value={archetype.id}
              checked={input.archetypeId === archetype.id}
              onChange={(event) => onSelectArchetype(event.target.value)}
            />
            <span>
              <span className="builder-option-title">
                {archetype.name}
                {archetype.points > 0 ? ` (+${archetype.points}pts)` : null}
              </span>
            </span>
          </label>
          {archetype.leaderUnits && archetype.leaderUnits.length > 0 && (
            <div className="builder-option-meta">
              Leader of: {archetype.leaderUnits.join(", ")}
            </div>
          )}
          <div className="builder-archetype-profile">
            <div className="builder-archetype-stats">
              <Stat label="M" value={`${archetype.profile.move}"`} />
              <Stat label="T" value={`${archetype.profile.toughness}`} />
              <Stat label="Sv" value={`${archetype.profile.save}+`} />
              <Stat label="W" value={`${archetype.profile.wounds}`} />
              <Stat label="Ld" value={`${archetype.profile.leadership}+`} />
              <Stat label="OC" value={`${archetype.profile.objectiveControl}`} />
              <Stat
                label="Inv"
                value={archetype.profile.invuln ? `${archetype.profile.invuln}+` : "—"}
              />
            </div>
          </div>
          <div className="builder-option-meta">
            {archetype.abilitiesText.map((ability, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                <strong>{ability.title}:</strong> {ability.text}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="builder-archetype-stat">
      <span className="builder-archetype-stat-label">{label}</span>
      <span className="builder-archetype-stat-value">{value}</span>
    </span>
  );
}
