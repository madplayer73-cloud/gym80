import { Machine, WorkoutEntry } from "../types";

function getStrengthVolume(entry: WorkoutEntry) {
  if (!entry.weightKg || !entry.sets || !entry.reps) {
    return 0;
  }

  return entry.weightKg * entry.sets * entry.reps;
}

function getCardioScore(entry: WorkoutEntry) {
  if (!entry.durationMin) {
    return 0;
  }

  return entry.durationMin * (entry.speedKph ?? 4) * (1 + (entry.inclinePercent ?? 0) / 20);
}

export function buildMotivationMessage({
  machine,
  entry,
  previousEntry
}: {
  machine?: Machine;
  entry: WorkoutEntry;
  previousEntry?: WorkoutEntry;
}) {
  if (entry.feeling === "bolest") {
    return "Bolest nie je hrdinstvo. Uber, drz techniku a nech kolena/chrbat nepisu staznost.";
  }

  if (!previousEntry) {
    return "Prvy zapis je doma. Teraz uz mame z coho robit svalovu matematiku :)";
  }

  const isCardio = machine?.muscleGroup === "Kardio";
  const currentScore = isCardio ? getCardioScore(entry) : getStrengthVolume(entry);
  const previousScore = isCardio ? getCardioScore(previousEntry) : getStrengthVolume(previousEntry);

  if (!currentScore || !previousScore) {
    return "Ulozene. Dalsi zapis uz trener porovna a zacne mudrovat :)";
  }

  const changeRatio = (currentScore - previousScore) / previousScore;
  const currentRepsTotal = (entry.sets ?? 0) * (entry.reps ?? 0);
  const previousRepsTotal = (previousEntry.sets ?? 0) * (previousEntry.reps ?? 0);

  if (changeRatio >= 0.18) {
    return "Velky progres! Schwarzenegger by prikyvol. Nabuduce opatrne, ale smelo :)";
  }

  if (changeRatio >= 0.05 || currentRepsTotal > previousRepsTotal) {
    return "Pekny progres! Toto uz vonia po svaloch. Este par takych zapisov a tricko zacne protestovat :)";
  }

  if (changeRatio <= -0.18) {
    return "Dnes slabsie? Nie si padavka, len telo hlasilo servis. Nabuduce skus lepsiu techniku a rozumnu vahu.";
  }

  if (changeRatio < -0.05) {
    return "Trochu si ubral. Ak technika drzi, skus este jedno poctive opakovanie. Svaly nech nemaju dovolenku :)";
  }

  return "Stabilny vykon. Pekne drzis uroven, teraz hladame maly krok hore.";
}
