import { MachineDraft } from "../types";

export function parseMachineDrafts(raw: string | null): Record<string, MachineDraft> {
  if (!raw) return {};
  const parsed = JSON.parse(raw);
  const strings = ["weightKg", "sets", "reps", "durationMin", "speedKph", "inclinePercent", "restSeconds", "note", "updatedAt"];
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || !Object.entries(parsed).every(([key, value]) => {
    const draft = value as MachineDraft;
    return draft && strings.every((field) => typeof (draft as any)[field] === "string") &&
      (draft.variantId === null || typeof draft.variantId === "string") &&
      (draft.accessoryId === null || typeof draft.accessoryId === "string") &&
      key === JSON.stringify([draft.variantId, draft.accessoryId]) &&
      ["lahke", "akurat", "tazke", "bolest"].includes(draft.feeling) &&
      ["nie", "koleno", "rameno", "chrbat", "ine"].includes(draft.painLocation) &&
      ["cista", "prijatelna", "zla"].includes(draft.techniqueQuality) &&
      Number.isFinite(draft.rpe) && Number.isFinite(draft.painLevel) &&
      Array.isArray(draft.setLogs) && draft.setLogs.every((log) => log && typeof log.id === "string" && typeof log.completed === "boolean" && Number.isFinite(log.setNumber));
  })) throw new Error("Invalid machine draft; original data preserved");
  return parsed;
}
