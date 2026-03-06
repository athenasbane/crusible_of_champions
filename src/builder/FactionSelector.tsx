export interface FactionSelectorProps {
  factions: { id: string; name: string }[];
  selectedFactionId: string;
  onSelect: (factionId: string) => void;
}

export function FactionSelector({
  factions,
  selectedFactionId,
  onSelect,
}: FactionSelectorProps) {
  return (
    <section className="builder-section">
      <h2 className="builder-section-title">Faction</h2>
      <div className="builder-faction-row">
        <label htmlFor="faction-select" className="builder-label">
        Faction:
        </label>
        <select
          id="faction-select"
          value={selectedFactionId}
          onChange={(e) => onSelect(e.target.value)}
          className="builder-select"
        >
          {factions.map((faction) => (
            <option key={faction.id} value={faction.id}>
              {faction.name}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
