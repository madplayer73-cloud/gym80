import { TrainingSetLog } from "../types";

/** A top-level edit explicitly applies to every unfinished set, even a manually edited one. */
export function applySetTarget(logs: TrainingSetLog[], field: "weightKg" | "reps", raw: string) {
  const text = raw.trim().replace(",", ".");
  if (text && !/^\d+(\.\d*)?$/.test(text)) return logs;
  const value = text ? Number(text) : undefined;
  if (value !== undefined && (!Number.isFinite(value) || value < 0 ||
    (field === "reps" && (!Number.isInteger(value) || value < 1)))) return logs;
  return logs.map(log => {
    if (log.completed || (field === "reps" && log.setType === "warmup")) return log;
    const target = field === "weightKg" && log.setType === "warmup"
      ? value === undefined ? undefined : log.targetPercent === undefined ? log.weightKg : Math.round(value * log.targetPercent / 10) / 10
      : value;
    return { ...log, [field]: target, manualOverride: false };
  });
}
