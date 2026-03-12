import { useState } from "react";
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
  onChangeWeaponQuantity: (id: string, delta: 1 | -1) => void;
};

export const WeaponSelector = ({
  sections,
  loadoutRules,
  onChangeWeaponQuantity,
}: WeaponSelectorProps) => {
  const [openSection, setOpenSection] = useState(sections[0]?.title ?? "Ranged");

  return (
    <section className="builder-section">
      <h2 className="builder-section-title">Weapons</h2>
      <p className="builder-help">
        Loadout limits: up to {loadoutRules.caps.ranged} ranged,{" "}
        {loadoutRules.caps.pistol} pistol, {loadoutRules.caps.melee} melee.
      </p>
      {sections.map((section) => (
        <div key={section.title} className="builder-accordion-item">
          {(() => {
            const selectedCount = section.groups.reduce(
              (sum, group) => sum + group.quantity,
              0,
            );

            return (
          <button
            type="button"
            className="builder-accordion-trigger"
            onClick={() =>
              setOpenSection((current) =>
                current === section.title ? "" : section.title,
              )
            }
            aria-expanded={openSection === section.title}
          >
            <span>{`${section.title} (${selectedCount})`}</span>
            <span>{openSection === section.title ? "−" : "+"}</span>
          </button>
            );
          })()}

          {openSection === section.title && (
            <div className="builder-accordion-content">
              {section.groups.map((group) => (
                <div
                  key={group.key}
                  className={`builder-option ${!group.canAdd && !group.canRemove ? "builder-option-disabled" : ""}`}
                >
                  <div className="builder-option-label builder-option-label-quantity">
                    <span className="builder-option-title">
                      {group.name}
                      {group.points > 0 ? ` (+${group.points}pts)` : null}
                    </span>
                    <div className="builder-qty-controls">
                      <button
                        type="button"
                        onClick={() => onChangeWeaponQuantity(group.weapons[0].id, -1)}
                        disabled={!group.canRemove}
                      >
                        -
                      </button>
                      <span className="builder-qty-value">{group.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onChangeWeaponQuantity(group.weapons[0].id, 1)}
                        disabled={!group.canAdd}
                      >
                        +
                      </button>
                    </div>
                  </div>
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
          )}
        </div>
      ))}
    </section>
  );
};
