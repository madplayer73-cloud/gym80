import { Machine, TrainingSetLog, WorkoutEntry } from "../types";
import { workingSets } from "./progressAnalytics";

// Caller supplies history for the same exercise, variant and accessory only.
export function getLiveSetRecord(set: TrainingSetLog, history: WorkoutEntry[], current: TrainingSetLog[], machine: Machine, loadType = "weighted") {
  const clean = (item: { painLevel?: number; techniqueQuality?: string }) => (item.painLevel ?? 0) === 0 && item.techniqueQuality !== "zla";
  if (!set.completed || set.setType === "warmup" || !clean(set) || !Number.isFinite(set.reps) || (set.reps ?? 0) <= 0) return null;
  const previous = history.filter(clean).flatMap<Partial<TrainingSetLog>>(workingSets).filter(clean);
  const baseline = [...previous, ...current.filter(item => item.id !== set.id && item.completed && item.setType !== "warmup" && clean(item))]
    .filter(item => Number.isFinite(item.reps) && (item.reps ?? 0) > 0);
  if (!previous.length || !baseline.length) return null; // First log establishes a baseline, not a record.
  if (loadType === "bodyweight") return (set.reps ?? 0) > Math.max(...baseline.map(item => item.reps ?? 0)) ? `Nový rekord: ${set.reps} opakovaní!` : null;
  if (!Number.isFinite(set.weightKg) || (set.weightKg ?? 0) <= 0) return null;
  const weighted = baseline.filter(item => Number.isFinite(item.weightKg) && (item.weightKg ?? 0) > 0);
  if (!weighted.length) return null;
  const bestWeight = loadType === "assisted" ? Math.min(...weighted.map(item => item.weightKg!)) : Math.max(...weighted.map(item => item.weightKg!));
  const newWeight = loadType === "assisted" ? set.weightKg! < bestWeight : set.weightKg! > bestWeight;
  const sameWeight = weighted.filter(item => item.weightKg === set.weightKg);
  const newReps = sameWeight.length > 0 && set.reps! > Math.max(...sameWeight.map(item => item.reps ?? 0));
  if (!newWeight && !newReps) return null;
  const unit = machine.equipment === "dumbbell" ? " kg na jednoručku" : loadType === "assisted" ? " kg dopomoci" : " kg";
  return `Nový rekord: ${set.weightKg}${unit} × ${set.reps} op.!`;
}
