import { useState } from "react";
import type { WeaponSectionView, WeaponSlotGuideView } from "./hooks/useWeaponOptions";

export type WeaponSelectorProps = {
  sections: WeaponSectionView[];
  slotGuide?: {
    guideTitle?: string;
    guideLines?: string[];
    slots: WeaponSlotGuideView[];
  };
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
  onSelectSlotOption: (slotId: string, optionId: string) => void;
};

export const WeaponSelector = ({
  sections,
  slotGuide,
  loadoutRules,
  onChangeWeaponQuantity,
  onSelectSlotOption,
}: WeaponSelectorProps) => {
  const [openSection, setOpenSection] = useState(sections[0]?.title ?? "Ranged");

  return (
    <section className="builder-section">
      <h2 className="builder-section-title">Weapons</h2>
      <p className="builder-help">
        Loadout limits: up to {loadoutRules.caps.ranged} ranged,{" "}
        {loadoutRules.caps.pistol} pistol, {loadoutRules.caps.melee} melee.
      </p>
      {slotGuide?.slots && slotGuide.slots.length > 0 && (
        <div className="builder-weapon-guide">
          <h3 className="builder-weapon-guide-title">
            {slotGuide.guideTitle ?? "Loadout Steps"}
          </h3>
          {slotGuide.guideLines && slotGuide.guideLines.length > 0 && (
            <div className="builder-weapon-guide-copy">
              {slotGuide.guideLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          )}
          {slotGuide.slots.map((slot, index) => {
            const statusLabel = slot.required
              ? `Select ${slot.min}-${slot.max}`
              : `Optional (${slot.min}-${slot.max})`;
            const complete =
              !slot.required ||
              (slot.selectedCount >= slot.min && slot.selectedCount <= slot.max);

            return (
              <div
                key={slot.id}
                className={`builder-weapon-guide-slot ${complete ? "builder-weapon-guide-slot-complete" : ""}`}
              >
                <div className="builder-weapon-guide-slot-header">
                  <strong>{`Step ${index + 1}`}</strong>
                  <span>{`${slot.selectedCount} selected`}</span>
                </div>
                <div className="builder-weapon-guide-slot-status">{slot.title}</div>
                <div className="builder-weapon-guide-slot-status">{statusLabel}</div>
                <div className="builder-weapon-guide-options">
                  {slot.options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => onSelectSlotOption(slot.id, option.id)}
                      disabled={option.disabled}
                      className={`builder-weapon-guide-option ${
                        option.selected
                          ? "builder-weapon-guide-option-selected"
                          : option.disabled
                            ? "builder-weapon-guide-option-disabled"
                            : ""
                      }`}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
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
