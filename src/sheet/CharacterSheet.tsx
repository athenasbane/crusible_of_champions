import type { BuiltSheet } from "./types";
import "./CharacterSheet.css";

export function CharacterSheet({ sheet }: { sheet: BuiltSheet }) {
  const p = sheet.profile;
  const pointsParts = [
    `${sheet.pointsBreakdown.archetype} pts archetype`,
    ...(sheet.pointsBreakdown.specialisms > 0
      ? [`${sheet.pointsBreakdown.specialisms} pts specialisms`]
      : []),
    ...(sheet.pointsBreakdown.abilities > 0
      ? [`${sheet.pointsBreakdown.abilities} pts abilities`]
      : []),
    ...(sheet.pointsBreakdown.weapons > 0
      ? [`${sheet.pointsBreakdown.weapons} pts weapons`]
      : []),
  ];

  return (
    <section className="cs-page" style={{ margin: "0 auto" }}>
      <header className="cs-header">
        <div className="cs-title">
          <div className="cs-points">{`${sheet.points} pts`}</div>
          <div className="cs-points-breakdown">
            {`(${pointsParts.join(" + ")})`}
          </div>
          <div className="cs-faction">{sheet.factionName}</div>
          <div className="cs-archetype">{sheet.archetypeName}</div>
          <div className="cs-name">{`Models: ${sheet.modelCount}`}</div>
          {sheet.name ? <div className="cs-archetype">{sheet.name}</div> : null}
        </div>

        <div className="cs-profile">
          <Stat label="M" value={`${p.move}"`} />
          <Stat label="T" value={`${p.toughness}`} />
          <Stat label="Sv" value={`${p.save}+`} />
          <Stat label="W" value={`${p.wounds}`} />
          <Stat label="Ld" value={`${p.leadership}+`} />
          <Stat label="OC" value={`${p.objectiveControl}`} />
          <Stat label="Inv" value={p.invuln ? `${p.invuln}+` : "—"} />
        </div>
      </header>

      <div className="cs-body">
        <div className="cs-left">
          {sheet.archetypeAbilities.map((ability) => (
            <Block key={`${ability.title}:${ability.text}`} title={ability.title}>
              {ability.text}
            </Block>
          ))}
          {sheet.leaderUnits && sheet.leaderUnits.length > 0 && (
            <Block title="Leader">
              <ul className="cs-inline-list">
                {sheet.leaderUnits.map((unit) => (
                  <li key={unit}>{unit}</li>
                ))}
              </ul>
            </Block>
          )}
        </div>

        <div className="cs-right">
          {sheet.specialisms.map((specialism) => (
            <Block key={specialism.id} title={specialism.name}>
              {specialism.text}
            </Block>
          ))}
          {sheet.abilities.map((ability) => (
            <Block key={ability.id} title={ability.name}>
              {ability.text}
            </Block>
          ))}
          {sheet.notes ? <Block title="Notes">{sheet.notes}</Block> : null}
          {sheet.keywords && sheet.keywords.length > 0 && (
            <Block title="Faction Keywords">
              <ul className="cs-inline-list">
                {sheet.factionKeywords.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </Block>
          )}
          {sheet.keywords.length ? (
            <Block title="Keywords">
              <ul className="cs-inline-list">
                {sheet.keywords.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </Block>
          ) : null}
        </div>
      </div>

      <div className="cs-weapons-full">
        <Block title="Weapons">
          <div className="cs-weapon-groups">
            <WeaponTable
              title="Ranged"
              weapons={sheet.weapons.filter((w) => w.type === "ranged")}
              quantities={sheet.weaponQuantities}
            />
            <WeaponTable
              title="Pistols"
              weapons={sheet.weapons.filter((w) => w.type === "pistol")}
              quantities={sheet.weaponQuantities}
            />
            <WeaponTable
              title="Melee"
              weapons={sheet.weapons.filter((w) => w.type === "melee")}
              quantities={sheet.weaponQuantities}
            />
          </div>
        </Block>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="cs-stat">
      <div className="cs-stat-label">{label}</div>
      <div className="cs-stat-value">{value}</div>
    </div>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="cs-block">
      <div className="cs-block-title">{title}</div>
      <div className="cs-block-content">{children}</div>
    </section>
  );
}

type WeaponRow = {
  id: string;
  name: string;
  group?: string;
  type: "ranged" | "pistol" | "melee";
  range?: string;
  attacks: string;
  skill?: string;
  strength: string;
  ap: string;
  damage: string;
  keywords?: string[];
};

function getWeaponQuantityKey(weapon: WeaponRow) {
  const groupName = weapon.group?.trim() || weapon.name.trim();
  return `${weapon.type}:${groupName.toLowerCase()}`;
}

function WeaponTable({
  title,
  weapons,
  quantities,
}: {
  title: string;
  weapons: readonly WeaponRow[];
  quantities: Record<string, number>;
}) {
  if (!weapons.length) return null;

  const weaponStatRows: ReadonlyArray<{ label: string; key: keyof WeaponRow }> = [
    { label: "Range", key: "range" },
    { label: "A", key: "attacks" },
    { label: "Skill", key: "skill" },
    { label: "S", key: "strength" },
    { label: "AP", key: "ap" },
    { label: "D", key: "damage" },
  ];

  return (
    <div className="cs-weapon-table-wrap">
      <div className="cs-weapon-table-title">{title}</div>

      <table className="cs-weapon-table cs-weapon-table-desktop">
        <thead>
          <tr>
            <th>Weapon</th>
            <th>Range</th>
            <th>A</th>
            <th>Skill</th>
            <th>S</th>
            <th>AP</th>
            <th>D</th>
            <th>Keywords</th>
          </tr>
        </thead>
        <tbody>
          {weapons.map((w) => {
            const quantity = quantities[getWeaponQuantityKey(w)] ?? 1;
            return (
              <tr key={w.id}>
                <td className="cs-weapon-name">
                  {quantity > 1 ? `${w.name} x${quantity}` : w.name}
                </td>
                <td>{w.range ?? (w.type === "melee" ? "Melee" : "—")}</td>
                <td>{w.attacks}</td>
                <td>{w.skill ?? "—"}</td>
                <td>{w.strength}</td>
                <td>{w.ap}</td>
                <td>{w.damage}</td>
                <td className="cs-weapon-kw">
                  {(w.keywords ?? []).join(", ") || "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="cs-weapon-cards" aria-label={`${title} weapons`}>
        {weapons.map((w) => {
          const quantity = quantities[getWeaponQuantityKey(w)] ?? 1;
          return (
            <article key={w.id} className="cs-weapon-card">
              <div className="cs-weapon-card-name">
                {quantity > 1 ? `${w.name} x${quantity}` : w.name}
              </div>
              <dl className="cs-weapon-card-stats">
                {weaponStatRows.map((row) => {
                  const value =
                    row.key === "range"
                      ? w.range ?? (w.type === "melee" ? "Melee" : "—")
                      : (w[row.key] ?? "—");

                  return (
                    <div key={row.label} className="cs-weapon-card-stat">
                      <dt>{row.label}</dt>
                      <dd>{value}</dd>
                    </div>
                  );
                })}
              </dl>
              <div className="cs-weapon-card-keywords">
                {(w.keywords ?? []).join(", ") || "—"}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
