import { WorkoutEntry } from "../types";

// Input must already be filtered to the same exercise, variant and accessory.
export function getPreviousWorkingSets(entries: WorkoutEntry[], today = new Date().toLocaleDateString("sv-SE")) {
  const previous = [...entries].filter(e => new Date(e.completedAt).toLocaleDateString("sv-SE") < today)
    .sort((a,b) => b.completedAt.localeCompare(a.completedAt))[0];
  if (!previous) return [];
  if (previous.setLogs?.length) return previous.setLogs.filter(s => s.completed && s.setType !== "warmup").sort((a,b) => a.setNumber-b.setNumber);
  return Array.from({length:Math.min(100,Math.max(0,Math.floor(previous.sets ?? 0)))}, () => ({weightKg:previous.weightKg,reps:previous.reps}));
}
