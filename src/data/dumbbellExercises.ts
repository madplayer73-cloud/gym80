import { Machine } from "../types";

// Separate IDs keep each grip's history, drafts and progress independent.
export const dumbbellExercises: Machine[] = [
  {
    id: "free-weights-dumbbell-reverse-curl",
    modelName: "Reverse Grip Curls",
    referenceAssets: ["1000026569.jpg", "1000026570.jpg"],
    displayNameSk: "Bicepsový zdvih nadhmatom s jednoručkami",
    descriptionSk: "Zdvihy s dlaňami smerujúcimi nadol (nadhmat). Samostatný zápis pre tento úchop.",
    primaryMuscles: ["predlaktia", "biceps"],
    subgroup: "predlaktia"
  },
  {
    id: "free-weights-dumbbell-alternating-hammer-curl",
    modelName: "Alternating Hammer Curls",
    referenceAssets: ["1000026571.jpg", "1000026572.jpg"],
    referencePhotoTop: 444,
    displayNameSk: "Striedavé kladivové zdvihy s jednoručkami",
    descriptionSk: "Striedavé zdvihy s neutrálnym úchopom, dlaňami smerujúcimi k telu. Opakovania zapisuj za každú ruku, nie ako súčet oboch rúk.",
    primaryMuscles: ["biceps", "predlaktia"],
    subgroup: "biceps"
  },
  {
    id: "free-weights-dumbbell-rotational-curl",
    modelName: "Rotational Curls",
    referenceAssets: ["1000026573.jpg", "1000026574.jpg"],
    displayNameSk: "Bicepsové zdvihy s otáčaním jednoručiek",
    descriptionSk: "Zdvihy oboma rukami naraz s otáčaním úchopu z neutrálneho do podhmatu. Samostatný zápis, oddelený od striedavého variantu, kladivových zdvihov aj nadhmatu.",
    primaryMuscles: ["biceps"],
    subgroup: "biceps"
  },
  {
    id: "free-weights-dumbbell-alternating-rotational-curl",
    modelName: "Alternating Rotational Curls",
    referenceAssets: ["1000026575.jpg", "1000026576.jpg"],
    referencePhotoTop: 444,
    displayNameSk: "Striedavé bicepsové zdvihy s otáčaním jednoručiek",
    descriptionSk: "Striedavé zdvihy s otáčaním úchopu z neutrálneho do podhmatu. Opakovania zapisuj na jednu ruku, nie ako súčet oboch rúk. História je oddelená od zdvihov oboma rukami naraz.",
    primaryMuscles: ["biceps"],
    subgroup: "biceps"
  },
  {
    id: "free-weights-dumbbell-hammer-curl",
    modelName: "Hammer Grip Curls",
    referenceAssets: ["1000026577.jpg", "1000026578.jpg"],
    displayNameSk: "Kladivové zdvihy s jednoručkami oboma rukami naraz",
    descriptionSk: "Zdvihy oboma rukami súčasne s neutrálnym úchopom, dlaňami smerujúcimi k telu. Jeden spoločný zdvih je jedno opakovanie na každú ruku. História je oddelená od striedavých kladivových zdvihov.",
    primaryMuscles: ["biceps", "predlaktia"],
    subgroup: "biceps"
  },
  {
    id: "free-weights-dumbbell-bicep-curl",
    modelName: "Bicep Curls",
    referenceAssets: ["1000026579.jpg", "1000026580.jpg"],
    displayNameSk: "Bicepsové zdvihy podhmatom s jednoručkami",
    descriptionSk: "Klasické zdvihy oboma rukami naraz s podhmatom, dlaňami smerujúcimi nahor. Jeden spoločný zdvih je jedno opakovanie na každú ruku. Samostatný zápis, oddelený od zdvihov s otáčaním úchopu, nadhmatom aj kladivových zdvihov.",
    primaryMuscles: ["biceps"],
    subgroup: "biceps"
  }
].map(exercise => ({
  ...exercise,
  brand: "Volne vahy",
  category: "Jednoručky",
  muscleGroup: "Ruky",
  equipment: "dumbbell",
  imageHint: exercise.modelName,
  movementPattern: "elbowFlexion",
  exerciseType: "isolation",
  secondaryMuscles: [],
  fatigueCost: "low"
}));
