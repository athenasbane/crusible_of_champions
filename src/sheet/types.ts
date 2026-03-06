import type { Profile, Weapon, ChoiceOption } from "../engine/schema";

export type BuiltSheet = {
  factionName: string;
  archetypeName: string;
  modelCount: number;
  name?: string;
  leaderUnits?: string[];
  profile: Profile;

  specialism?: ChoiceOption;
  abilities: ChoiceOption[];
  factionKeywords: string[];
  keywords: string[];
  weapons: Weapon[];
  points: number;
  notes?: string;
};
