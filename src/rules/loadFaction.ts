import { FactionSchema } from "../engine/schema";
import type { FactionRules } from "../engine/schema";

export function loadFaction(data: unknown): FactionRules {
  return FactionSchema.parse(data);
}
