import { Machine, WorkoutEntry, WorkoutSession } from "../types";

const USER_WEIGHT_KG = 70;

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

function estimateEntryCalories(entry: WorkoutEntry, machine?: Machine) {
  const isCardio = machine?.muscleGroup === "Kardio";
  const minutes = isCardio ? entry.durationMin ?? 20 : getStrengthMinutes(entry);
  const met = isCardio ? getCardioMet(entry) : 3.8;

  return (met * 3.5 * USER_WEIGHT_KG * minutes) / 200;
}

export function estimateSessionCalories(
  session: WorkoutSession,
  getMachine: (machineId: string) => Machine | undefined
) {
  const total = session.entries.reduce((sum, entry) => {
    return sum + estimateEntryCalories(entry, getMachine(entry.machineId));
  }, 0);

  return Math.round(total);
}
