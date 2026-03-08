import type { WeaponSectionView } from "./hooks/useWeaponOptions";

export type WeaponSelectorProps = {
  sections: WeaponSectionView[];
  loadoutRules: {
    caps: {
      ranged: number;
      pistol: number;
      melee: number;
    };
    mins: {
      melee: number;
    };
  };
  onToggleWeapon: (id: string) => void;
};

export const WeaponSelector = ({
  sections,
  loadoutRules,
  onToggleWeapon,
}: WeaponSelectorProps) => {
  return (
    <section className="builder-section">
      <h2 className="builder-section-title">Weapons</h2>
      <p className="builder-help">
        Loadout limits: up to {loadoutRules.caps.ranged} ranged,{" "}
        {loadoutRules.caps.pistol} pistol, {loadoutRules.caps.melee} melee.
      </p>
      {sections.map((section) => (
        <div key={section.title} style={{ marginBottom: 12 }}>
          <h3 style={{ marginBottom: 10 }}>{section.title}</h3>
          {section.groups.map((group) => (
            <div
              key={group.key}
              className={`builder-option ${group.disabled ? "builder-option-disabled" : ""}`}
            >
              <label className="builder-option-label">
                <input
                  type="checkbox"
                  checked={group.selected}
                  onChange={() => onToggleWeapon(group.weapons[0].id)}
                  disabled={group.disabled}
                />
                <span>
                  <span className="builder-option-title">
                    {group.name}
                    {group.points > 0 ? ` (+${group.points}pts)` : null}
                  </span>
                </span>
              </label>
              <div className="builder-option-meta">
                {group.weapons.map((weaponProfile, _, weapons) => (
                  <div key={weaponProfile.id} className="builder-weapon-profile">
                    {weapons.length > 1 ? (
                      <strong className="builder-weapon-profile-name">
                        {weaponProfile.name}
                      </strong>
                    ) : null}
                    <div className="builder-weapon-stats">
                      <span className="builder-weapon-stat">
                        <span className="builder-weapon-stat-label">R</span>
                        <span className="builder-weapon-stat-value">
                          {weaponProfile.range}
                        </span>
                      </span>
                      <span className="builder-weapon-stat">
                        <span className="builder-weapon-stat-label">A</span>
                        <span className="builder-weapon-stat-value">
                          {weaponProfile.attacks}
                        </span>
                      </span>
                      <span className="builder-weapon-stat">
                        <span className="builder-weapon-stat-label">Skill</span>
                        <span className="builder-weapon-stat-value">
                          {weaponProfile.skill ?? "—"}
                        </span>
                      </span>
                      <span className="builder-weapon-stat">
                        <span className="builder-weapon-stat-label">S</span>
                        <span className="builder-weapon-stat-value">
                          {weaponProfile.strength}
                        </span>
                      </span>
                      <span className="builder-weapon-stat">
                        <span className="builder-weapon-stat-label">AP</span>
                        <span className="builder-weapon-stat-value">
                          {weaponProfile.ap}
                        </span>
                      </span>
                      <span className="builder-weapon-stat">
                        <span className="builder-weapon-stat-label">D</span>
                        <span className="builder-weapon-stat-value">
                          {weaponProfile.damage}
                        </span>
                      </span>
                    </div>
                    {weaponProfile.keywords && weaponProfile.keywords.length > 0 && (
                      <div>
                        <em>Special: {weaponProfile.keywords.join(", ")}</em>
                      </div>
                    )}
                  </div>
                ))}
                {group.requirementLabels.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <strong>Requires:</strong> {group.requirementLabels.join(" + ")}
                  </div>
                )}
                {group.unavailableReasons.length > 0 && (
                  <div className="builder-option-warning">
                    Unavailable: {group.unavailableReasons.join(" and ")}
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
