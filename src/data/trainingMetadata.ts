import { Machine, MovementPattern } from "../types";

// Classify by the exercise itself, never by secondary muscles in its description.
export function withTrainingMetadata(machine: Machine): Machine {
  const id = machine.id;
  const lowerBack = ["seated-straight-arm-pulldown", "back-extension-machine", "hyperextension-bench"].includes(id);
  const hamstrings = ["leg-curl-seated", "lying-leg-curl-machine"].includes(id);
  const abduction = ["torso-rotation-squat", "seated-abduction-machine"].includes(id);
  const adduction = id === "seated-adduction-machine";
  const calves = id.includes("calf");
  const hip = id === "hip-thrust-machine";
  const verticalPull = ["assisted-pull-up-dip", "bodyweight-station", "bodyweight-core-station", "lat-pulldown-selectorized", "seated-lat-pulldown", "seated-bar-pulldown"].includes(id);
  let pattern: MovementPattern = "fullBody";
  let muscles: string[] = [];
  const group = machine.exerciseVariants?.[0]?.muscleGroup ?? machine.muscleGroup;
  let subgroup = group.toLowerCase();
  let isolation = false;
  if (lowerBack) { pattern = "coreExtension"; muscles = ["spodny chrbat"]; subgroup = "spodny chrbat"; }
  else if (machine.muscleGroup === "Hrudnik") { pattern = "horizontalPush"; muscles = ["hrudnik"]; isolation = id === "seated-chest-fly"; }
  else if (group === "Chrbat") { pattern = verticalPull ? "verticalPull" : "horizontalPull"; muscles = ["chrbat"]; }
  else if (machine.muscleGroup === "Ramena") { pattern = "verticalPush"; muscles = ["ramena"]; }
  else if (machine.muscleGroup === "Ruky") { pattern = "elbowFlexion"; muscles = ["biceps"]; subgroup = "biceps"; isolation = true; }
  else if (machine.muscleGroup === "Triceps") { pattern = "elbowExtension"; muscles = ["triceps"]; isolation = true; }
  else if (group === "Brucho") { pattern = "coreFlexion"; muscles = ["brucho"]; }
  else if (group === "Triceps") { pattern = "elbowExtension"; muscles = ["triceps"]; isolation = true; }
  else if (machine.muscleGroup === "Kardio") { pattern = "cardio"; muscles = []; }
  else if (machine.muscleGroup === "Nohy") {
    pattern = calves ? "calf" : hamstrings || hip || abduction || adduction ? "hipDominant" : "kneeDominant";
    subgroup = calves ? "lytka" : hamstrings ? "zadne stehna" : hip || abduction ? "zadok" : adduction ? "vnutorne stehna" : "predne stehna";
    muscles = [subgroup]; isolation = calves || hamstrings || abduction || adduction || id === "leg-extension-seated";
  }
  const exerciseType = lowerBack || machine.muscleGroup === "Brucho" ? "core" : pattern === "cardio" ? "cardio" : isolation ? "isolation" : "compound";
  return {
    ...machine,
    movementPattern: machine.movementPattern ?? pattern,
    primaryMuscles: machine.primaryMuscles ?? muscles,
    subgroup: machine.subgroup ?? subgroup,
    exerciseType: machine.exerciseType ?? exerciseType,
    secondaryMuscles: machine.secondaryMuscles ?? (isolation ? [] : pattern === "horizontalPush" || pattern === "verticalPush" ? ["ramena", "triceps"] : pattern === "horizontalPull" || pattern === "verticalPull" ? ["biceps"] : pattern === "kneeDominant" ? ["zadok"] : []),
    fatigueCost: machine.fatigueCost ?? (isolation || exerciseType === "core" ? "low" : "medium"),
    defaultRepMin: machine.defaultRepMin ?? (isolation || exerciseType === "core" ? 10 : 8),
    defaultRepMax: machine.defaultRepMax ?? (isolation || exerciseType === "core" ? 15 : 12)
  };
}
