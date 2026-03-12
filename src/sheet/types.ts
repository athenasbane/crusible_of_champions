import type { Profile, Weapon, ChoiceOption } from "../engine/schema";

export type BuiltSheet = {
  factionName: string;
  archetypeName: string;
  archetypeAbilities: { title: string; text: string }[];
  modelCount: number;
  name?: string;
  leaderUnits?: string[];
  profile: Profile;

  specialisms: ChoiceOption[];
  abilities: ChoiceOption[];
  factionKeywords: string[];
  keywords: string[];
  weapons: Weapon[];
  weaponQuantities: Record<string, number>;
  points: number;
  pointsBreakdown: {
    archetype: number;
    specialisms: number;
    abilities: number;
    weapons: number;
  };
  notes?: string;
};
