import { Machine, WorkoutEntry, WorkoutSession } from "../types";

export function estimateWorkoutCalories(minutes: number, bodyWeightKg?: number) {
  return Number.isFinite(bodyWeightKg) && bodyWeightKg! > 0 && Number.isFinite(minutes) ? Math.round(3.8 * 3.5 * bodyWeightKg! * Math.max(0, minutes) / 200) : null;
}

function getStrengthMinutes(entry: WorkoutEntry) {
  const sets = entry.sets ?? 4;
  return Math.max(6, sets * 2.5);
}

function getCardioMet(entry: WorkoutEntry) {
  const speed = entry.speedKph ?? 5;
  const incline = entry.inclinePercent ?? 0;

  if (speed >= 8) {
    return 8 + incline * 0.15;
  }

  if (speed >= 6) {
    return 5.5 + incline * 0.12;
  }

  return 3.5 + incline * 0.1;
}

function estimateEntryCalories(entry: WorkoutEntry, bodyWeightKg: number, machine?: Machine) {
  const isCardio = machine?.muscleGroup === "Kardio";
  const minutes = isCardio ? entry.durationMin ?? 20 : getStrengthMinutes(entry);
  const met = isCardio ? getCardioMet(entry) : 3.8;

  return (met * 3.5 * bodyWeightKg * minutes) / 200;
}

export function estimateSessionCalories(
  session: WorkoutSession,
  getMachine: (machineId: string) => Machine | undefined,
  bodyWeightKg?: number
) {
  if (!bodyWeightKg || !Number.isFinite(bodyWeightKg) || bodyWeightKg <= 0) return null;
  const entries = session.entries.filter((entry) => entry.machineId !== "routine-warmup");
  if (typeof session.cleanDurationSec === "number") {
    const cardioEntries = entries.filter((entry) => getMachine(entry.machineId)?.muscleGroup === "Kardio");
    const countedCardioMin = cardioEntries.reduce((sum, entry) => sum + (entry.durationMin ?? 0), 0);
    const strengthMinutes = entries.some((entry) => getMachine(entry.machineId)?.muscleGroup !== "Kardio")
      ? Math.max(0, session.cleanDurationSec / 60 - countedCardioMin) : 0;
    return Math.round(3.8 * 3.5 * bodyWeightKg * strengthMinutes / 200 +
      cardioEntries.reduce((sum, entry) => sum + estimateEntryCalories(entry, bodyWeightKg, getMachine(entry.machineId)), 0));
  }
  const total = entries.reduce((sum, entry) => {
    return sum + estimateEntryCalories(entry, bodyWeightKg, getMachine(entry.machineId));
  }, 0);

  return Math.round(total);
}
