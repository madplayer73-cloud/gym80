import { PersonalData, WorkoutEntry, Machine } from "../types";

export const emptyPersonalData: PersonalData = { measurements: [], routines: [] };
export function isPersonalData(value: unknown): value is PersonalData {
  const data = value as PersonalData;
  return Boolean(data && Array.isArray(data.measurements) && Array.isArray(data.routines) &&
    data.measurements.every((item) => item && typeof item.id === "string" && typeof item.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && Number.isFinite(new Date(item.date).getTime()) && Number.isFinite(item.weightKg) && item.weightKg > 0 && item.weightKg <= 500 && (item.waistCm === undefined || Number.isFinite(item.waistCm) && item.waistCm > 0 && item.waistCm <= 300)) &&
    data.routines.every((item) => item && ["A", "B"].includes(item.id) && typeof item.name === "string" && Array.isArray(item.machineIds) && item.machineIds.every((id) => typeof id === "string")));
}
export function getBodyWeight(data: PersonalData, date = new Date().toISOString()) {
  const calendarDate = date.length === 10 ? date : new Date(date).toLocaleDateString("sv-SE");
  return [...data.measurements].filter((item) => item.date <= calendarDate)
    .sort((a, b) => b.date.localeCompare(a.date))[0]?.weightKg;
}
export function exerciseContextKey(entry: Pick<WorkoutEntry, "machineId" | "exerciseVariantId" | "accessoryId">, machine?: Machine) {
  return JSON.stringify([entry.machineId, entry.exerciseVariantId ?? machine?.exerciseVariants?.[0]?.id ?? null, entry.accessoryId ?? null]);
}
export function getProgressSummary(entries: WorkoutEntry[], machine: Machine) {
  const sorted = [...entries].sort((a, b) => a.completedAt.localeCompare(b.completedAt));
  const latest = sorted[sorted.length - 1];
  if (!latest) return null;
  const comparable = sorted.filter((item) => exerciseContextKey(item, machine) === exerciseContextKey(latest, machine));
  if (comparable.length < 2) return null;
  const first = comparable[0];
  const delta = (latest.weightKg ?? 0) - (first.weightKg ?? 0);
  const repsDelta = (latest.reps ?? 0) - (first.reps ?? 0);
  const variant = machine.exerciseVariants?.find((item) => item.id === latest.exerciseVariantId) ?? machine.exerciseVariants?.[0];
  const signed = (number: number) => `${number >= 0 ? "+" : ""}${Math.round(number * 100) / 100}`;
  return { delta, repsDelta, context: [latest.exerciseVariantNameSk, latest.accessoryNameSk].filter(Boolean).join(" · "),
    label: variant?.loadType === "bodyweight" ? `${signed(repsDelta)} op. pri vlastnej vahe`
      : variant?.loadType === "assisted" ? `${signed(delta)} kg dopomoci (menej = tazsie), ${signed(repsDelta)} op.`
        : `${signed(delta)} kg, ${signed(repsDelta)} op.${delta === 0 && repsDelta > 0 ? " pri rovnakej vahe" : ""}` };
}
