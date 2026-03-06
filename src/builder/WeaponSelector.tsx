import type { BuildInput, FactionRules } from "../engine/schema";
import { countWeapons, getEffectiveLoadoutRules } from "../engine/validateWeapons";
import { getWeaponRequirementStatus } from "../engine/weaponRequirements";
import { groupWeapons } from "../engine/weaponGrouping";

export type WeaponSelectorProps = {
  input: BuildInput;
  toggleWeapon: (id: string) => void;
  faction: FactionRules;
};

export const WeaponSelector = ({
  input,
  toggleWeapon,
  faction,
}: WeaponSelectorProps) => {
  const loadoutRules = getEffectiveLoadoutRules(faction, input.archetypeId);
  const selectedWeapons = faction.weapons.filter((w) => input.weaponIds.includes(w.id));
  const counts = countWeapons(selectedWeapons);

  const rangedWeapons = faction.weapons.filter((w) => w.type === "ranged");
  const pistolWeapons = faction.weapons.filter((w) => w.type === "pistol");
  const meleeWeapons = faction.weapons.filter((w) => w.type === "melee");

  const renderWeaponSection = (
    title: string,
    weapons: FactionRules["weapons"],
  ) => (
    <div style={{ marginBottom: 12 }}>
      <h3 style={{ marginBottom: 10 }}>{title}</h3>
      {groupWeapons(weapons).map((group) => {
        const selected = group.weapons.some((weapon) => input.weaponIds.includes(weapon.id));
        const requirementStatus = getWeaponRequirementStatus(group.weapons[0], input, faction);
        const overTypeCap =
          !selected && counts[group.type] >= loadoutRules.caps[group.type];
        const disabled = !selected && (!requirementStatus.met || overTypeCap);
        const unavailableReasons = [
          ...requirementStatus.unmet,
          ...(overTypeCap ?
            [`${group.type[0].toUpperCase()}${group.type.slice(1)} cap reached`] :
            []),
        ];

        return (
          <div
            key={group.key}
            className={`builder-option ${disabled ? "builder-option-disabled" : ""}`}
          >
            <label className="builder-option-label">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleWeapon(group.weapons[0].id)}
                disabled={disabled}
              />
              <span>
                <span className="builder-option-title">{group.name}</span>
              </span>
            </label>
            <div className="builder-option-meta">
              {group.weapons.map((weaponProfile) => (
                <div key={weaponProfile.id} className="builder-weapon-profile">
                  <strong className="builder-weapon-profile-name">{weaponProfile.name}</strong>
                  <div className="builder-weapon-stats">
                    <span className="builder-weapon-stat">
                      <span className="builder-weapon-stat-label">R</span>
                      <span className="builder-weapon-stat-value">{weaponProfile.range}</span>
                    </span>
                    <span className="builder-weapon-stat">
                      <span className="builder-weapon-stat-label">A</span>
                      <span className="builder-weapon-stat-value">{weaponProfile.attacks}</span>
                    </span>
                    <span className="builder-weapon-stat">
                      <span className="builder-weapon-stat-label">Skill</span>
                      <span className="builder-weapon-stat-value">{weaponProfile.skill ?? "—"}</span>
                    </span>
                    <span className="builder-weapon-stat">
                      <span className="builder-weapon-stat-label">S</span>
                      <span className="builder-weapon-stat-value">{weaponProfile.strength}</span>
                    </span>
                    <span className="builder-weapon-stat">
                      <span className="builder-weapon-stat-label">AP</span>
                      <span className="builder-weapon-stat-value">{weaponProfile.ap}</span>
                    </span>
                    <span className="builder-weapon-stat">
                      <span className="builder-weapon-stat-label">D</span>
                      <span className="builder-weapon-stat-value">{weaponProfile.damage}</span>
                    </span>
                  </div>
                  {weaponProfile.keywords && weaponProfile.keywords.length > 0 && (
                    <div>
                      <em>Special: {weaponProfile.keywords.join(", ")}</em>
                    </div>
                  )}
                </div>
              ))}
              {requirementStatus.labels.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <strong>Requires:</strong> {requirementStatus.labels.join(" + ")}
                </div>
              )}
              {unavailableReasons.length > 0 && (
                <div className="builder-option-warning">
                  Unavailable: {unavailableReasons.join(" and ")}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <section className="builder-section">
      <h2 className="builder-section-title">Weapons</h2>
      <p className="builder-help">
        Loadout limits: up to {loadoutRules.caps.ranged} ranged,{" "}
        {loadoutRules.caps.pistol} pistol, {loadoutRules.caps.melee} melee.
      </p>
      {renderWeaponSection("Ranged", rangedWeapons)}
      {renderWeaponSection("Pistol", pistolWeapons)}
      {renderWeaponSection("Melee", meleeWeapons)}
    </section>
  );
};
