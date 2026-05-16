import { WorkoutEntry } from "../types";

export type ProgressionAdviceLevel = "success" | "warning" | "danger" | "info";

export type ProgressionAdvice = {
  level: ProgressionAdviceLevel;
  title: string;
  message: string;
};

function hasStrengthValues(entry?: Pick<WorkoutEntry, "weightKg" | "sets" | "reps">) {
  return Boolean(entry?.weightKg && entry?.sets && entry?.reps);
}

export function getEntryProgressionAdvice(
  entry?: Pick<WorkoutEntry, "weightKg" | "sets" | "reps" | "feeling">
): ProgressionAdvice | null {
  if (!entry) {
    return null;
  }

  if (!hasStrengthValues(entry)) {
    return null;
  }

  const weight = entry.weightKg ?? 0;
  const sets = entry.sets ?? 0;
  const reps = entry.reps ?? 0;
  const feeling = entry.feeling;

  if (feeling === "bolest") {
    return {
      level: "danger",
      title: "Pozor, bolest nie je progres",
      message:
        "Pri tomto stroji si oznacil bolest. Nabuduce uber vahu, skrat rozsah alebo stroj radsej vymen."
    };
  }

  if (reps <= 5 || (sets <= 3 && reps <= 6)) {
    return {
      level: "danger",
      title: "Uber vahu",
      message:
        `Toto je na rast svalov prilis tazke. Pri ${weight} kg si dal malo opakovani, skus uber a dostat sa aspon na 8 az 10.`
    };
  }

  if (feeling === "tazke" && reps < 8) {
    return {
      level: "warning",
      title: "Zatial nepridavaj",
      message:
        `Pri ${weight} kg to bolo tazke a opakovani bolo malo. Nabuduce radsej zopakuj alebo mierne uber.`
    };
  }

  if (sets >= 4 && reps >= 12 && feeling !== "tazke") {
    return {
      level: "success",
      title: "Pridaj vahu",
      message:
        `Pekne. ${sets} x ${reps} pri ${weight} kg znamena, ze nabuduce skus pridat 1.25 az 2.5 kg. Schwarzenegger sa robi postupne.`
    };
  }

  if (reps >= 8 && reps <= 11) {
    return {
      level: "info",
      title: "Drz tuto vahu",
      message:
        `Toto je dobry rozsah na svaly. Skus najprv dotiahnut opakovania k 12 a az potom pridavaj vahu.`
    };
  }

  return {
    level: "info",
    title: "Zapisuj dalej",
    message:
      "Este potrebujem par treningov, aby som vedel presnejsie povedat, ci pridat alebo ubrat."
  };
}

export function getPlannedProgressionAdvice({
  latestEntry,
  plannedWeightKg,
  plannedSets,
  plannedReps
}: {
  latestEntry?: Pick<WorkoutEntry, "weightKg" | "sets" | "reps" | "feeling">;
  plannedWeightKg?: number;
  plannedSets?: number;
  plannedReps?: number;
}): ProgressionAdvice | null {
  const latestAdvice = getEntryProgressionAdvice(latestEntry);

  if (!latestAdvice || !plannedWeightKg || !plannedSets || !plannedReps) {
    return latestAdvice;
  }

  const latestWeight = latestEntry?.weightKg ?? 0;

  if (latestAdvice.level === "success" && plannedWeightKg <= latestWeight) {
    return {
      level: "warning",
      title: "Skus pridat",
      message:
        `Minule si zvladol ${latestEntry?.sets ?? 0} x ${latestEntry?.reps ?? 0}. Ak chces rast, dnes skus ${latestWeight + 1.25} az ${latestWeight + 2.5} kg.`
    };
  }

  if (
    latestAdvice.level === "danger" &&
    plannedWeightKg >= latestWeight &&
    latestWeight > 0
  ) {
    return {
      level: "danger",
      title: "Hoho, uber",
      message:
        `Minule bola tato vaha prilis tazka. Dnes zacni radsej okolo ${Math.max(0, latestWeight - 2.5)} kg a ciel 8 az 10 opakovani.`
    };
  }

  if (plannedSets >= 4 && plannedReps >= 12 && plannedWeightKg > latestWeight) {
    return {
      level: "success",
      title: "Dobry plan na progres",
      message:
        "Toto dava logiku: mierne vyssia vaha a stale cielis na poctive opakovania."
    };
  }

  return latestAdvice;
}
