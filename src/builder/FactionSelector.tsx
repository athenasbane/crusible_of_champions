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
    <div className="builder-faction-row">
      <label className="builder-label">Select Faction</label>
      <div className="builder-faction-row">
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
    </div>
  );
}
