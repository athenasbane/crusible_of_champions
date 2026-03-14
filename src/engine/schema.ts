import { z } from "zod";
import type { BuiltSheet } from "../sheet/types";

export const ProfileSchema = z.object({
  move: z.number(),
  toughness: z.number(),
  save: z.number(),
  wounds: z.number(),
  leadership: z.number(),
  objectiveControl: z.number(),
  invuln: z.number().optional(),
});

export const ArchetypeAbilitiesSchema = z.object({
  title: z.string(),
  text: z.string(),
});

export const EffectSchema = z.union([
  z.object({
    kind: z.literal("set"),
    field: z.enum([
      "move",
      "toughness",
      "save",
      "wounds",
      "leadership",
      "objectiveControl",
      "invuln",
    ]),
    value: z.number(),
  }),
  z.object({
    kind: z.literal("remove"),
    field: z.enum(["keywords"]),
    value: z.string(),
  }),
  z.object({
    kind: z.literal("setLeadership"),
    value: z.array(z.string()),
  }),
  z.object({
    kind: z.literal("addKeywords"),
    value: z.array(z.string()),
  }),
  z.object({
    kind: z.literal("setLeaderUnits"),
    value: z.array(z.string()),
  }),
  z.object({
    kind: z.literal("addLeaderUnits"),
    value: z.array(z.string()),
  }),
  z.object({
    kind: z.literal("addWeapons"),
    value: z.array(z.string()),
  }),
  z.object({
    kind: z.literal("add"),
    field: z.enum([
      "move",
      "toughness",
      "save",
      "wounds",
      "leadership",
      "objectiveControl",
    ]),
    delta: z.number(),
  }),
]);

type BaseRequirement =
  | {
      kind: "archetypeIs";
      archetypeId: string;
    }
  | {
      kind: "hasChoice";
      groupId: string;
      optionId: string;
    }
  | {
      kind: "keywordHas";
      keyword: string;
    };

export type Requirement =
  | BaseRequirement
  | {
      kind: "oneOf";
      requirements: Requirement[];
    };

const BaseRequirementSchema = z.union([
  z.object({
    kind: z.literal("archetypeIs"),
    archetypeId: z.string(),
  }),
  z.object({
    kind: z.literal("hasChoice"),
    groupId: z.string(),
    optionId: z.string(),
  }),
  z.object({
    kind: z.literal("keywordHas"),
    keyword: z.string(),
  }),
]);

export const RequirementSchema: z.ZodType<Requirement> = z.lazy(() =>
  z.union([
    BaseRequirementSchema,
    z.object({
      kind: z.literal("oneOf"),
      requirements: z.array(RequirementSchema).min(1),
    }),
  ]),
);

export const WeaponSchema = z.object({
  id: z.string(),
  name: z.string(),
  group: z.string().optional(),
  type: z.enum(["ranged", "pistol", "melee"]),
  range: z.string(),
  attacks: z.string(),
  skill: z.string().optional(),
  strength: z.string(),
  ap: z.string(),
  damage: z.string(),
  keywords: z.array(z.string()),
  points: z.number().optional(),
  requirements: z.array(RequirementSchema).optional(),
  effects: z.array(EffectSchema).optional(),
});

export const ChoiceOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  text: z.string(),
  requirements: z.array(RequirementSchema).optional(),
  effects: z.array(EffectSchema).optional(),
  points: z.number(),
  keywords: z.array(z.string()).optional(),
});

export const ChoiceGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  pick: z.number(),
  options: z.array(ChoiceOptionSchema),
});

export const LoadoutRulesSchema = z.object({
  caps: z.object({
    ranged: z.number(),
    pistol: z.number(),
    melee: z.number(),
  }),
  mins: z.object({
    melee: z.number(),
  }),
});

export const ArchetypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  abilitiesText: z.array(ArchetypeAbilitiesSchema),
  profile: ProfileSchema,
  points: z.number(),
  modelCount: z.number(),
  loadout: LoadoutRulesSchema.optional(),
  weaponSelectionRules: z
    .object({
      guideTitle: z.string().optional(),
      guideLines: z.array(z.string()).optional(),
      allowedGroups: z.array(z.string()).optional(),
      groupCaps: z.record(z.string(), z.number()).optional(),
      slots: z
        .array(
          z.object({
            id: z.string(),
            title: z.string(),
            min: z.number(),
            max: z.number(),
            disabledWhenAnyOptionsSelected: z.array(z.string()).optional(),
            options: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                groups: z.array(z.string()).min(1),
              }),
            ),
          }),
        )
        .optional(),
    })
    .optional(),
  abilityPick: z.number().optional(),
  leaderUnits: z.array(z.string()),
  keywords: z.array(z.string()),
  factionKeywords: z.array(z.string()),
});

export const FactionSchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultLoadout: LoadoutRulesSchema,
  archetypes: z.array(ArchetypeSchema),
  specialisms: z.union([
    ChoiceGroupSchema,
    z.object({
      partA: ChoiceGroupSchema,
      partB: ChoiceGroupSchema,
    }),
  ]),
  abilities: ChoiceGroupSchema,
  weapons: z.array(WeaponSchema),
});

export type BuildInput = {
  archetypeId: string;
  specialismIds: string[];
  abilityIds: string[];
  weaponIds: string[];
  name?: string;
  notes?: string;
};

export type BuildResult =
  | { type: "error"; errors: string[] }
  | { type: "success"; sheet: BuiltSheet };

export type FactionRules = z.infer<typeof FactionSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type Effect = z.infer<typeof EffectSchema>;
export type Weapon = z.infer<typeof WeaponSchema>;
export type ChoiceOption = z.infer<typeof ChoiceOptionSchema>;
export type ChoiceGroup = z.infer<typeof ChoiceGroupSchema>;
export type Archetype = z.infer<typeof ArchetypeSchema>;
export type LoadoutRules = z.infer<typeof LoadoutRulesSchema>;
