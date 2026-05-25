import {
  ExerciseDifficulty,
  ExerciseType,
  FatigueCost,
  Machine,
  MovementPattern,
  ReadinessCheck,
  ReadinessPain,
  MuscleGroup,
  RomBias,
  UserExerciseProfile,
  WorkoutFocus,
  WorkoutSession
} from "../types";

type TrainerMachineMeta = {
  subgroup: string;
  exerciseType: ExerciseType;
  difficulty: ExerciseDifficulty;
  estimatedTimeMinutes: number;
  recommendedRestMinSec: number;
  recommendedRestMaxSec: number;
  movementPattern: MovementPattern;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  fatigueCost: FatigueCost;
  romBias: RomBias;
  defaultRepMin: number;
  defaultRepMax: number;
  microloadStepKg: number;
  tempoHint: string;
};

export type ReadinessBand = "vysoka" | "stredna" | "nizka";

export type WeeklyTrainingState = {
  hardSetsByMuscle: Record<string, number>;
  hardSetsByPattern: Record<string, number>;
  exposureCountPerExercise: Record<string, number>;
  axialFatigueScore: number;
  daysSinceLastLoadedPattern: Record<string, number>;
  topNeeds: string[];
};

export type TrainerHistoryStats = {
  totalSessions: number;
  frequentMachines: Machine[];
  occasionalMachines: Machine[];
  neverUsedMachines: Machine[];
  averageWorkoutDurationMin: number;
  averageExercisesPerWorkout: number;
  exercisesPer60Min: number;
  commonMuscleGroupCombination: string;
  weeklyState: WeeklyTrainingState;
};

export type PlannedExercise = {
  order: number;
  machine: Machine;
  muscleGroup: MuscleGroup;
  subgroup: string;
  exerciseType: ExerciseType;
  difficulty: ExerciseDifficulty;
  estimatedTimeMinutes: number;
  sets: number;
  reps: number;
  recommendedRestMinSec: number;
  recommendedRestMaxSec: number;
  userAverageRestSec?: number;
  note?: string;
  whyRest: string;
  isDiscovery: boolean;
  movementPattern: MovementPattern;
  primaryMuscles: string[];
  targetRepMin: number;
  targetRepMax: number;
  selectionReason: string;
  tempoHint: string;
  confidenceScore: number;
  confidenceLabel: string;
  safetyNote?: string;
};

export type TrainerWorkoutPlan = {
  targetDurationMinutes: number;
  estimatedDurationMinutes: number;
  goal: "rast svalov";
  strategy: string;
  focus: WorkoutFocus;
  stats: TrainerHistoryStats;
  readinessBand: ReadinessBand;
  readinessScore: number;
  readinessSummary: string;
  safetyNotes: string[];
  exercises: PlannedExercise[];
};

const upperGroups: MuscleGroup[] = ["Hrudnik", "Ramena", "Ruky", "Triceps", "Chrbat"];
const lowerGroups: MuscleGroup[] = ["Nohy", "Brucho"];
const trackedMuscles = [
  "hrudnik",
  "chrbat",
  "ramena",
  "biceps",
  "triceps",
  "predne stehna",
  "zadne stehna",
  "zadok",
  "lytka",
  "brucho",
  "spodny chrbat"
];

export const defaultReadiness: ReadinessCheck = {
  energia: 3,
  spanok: "priemerny",
  svalovica: "ziadna",
  bolest: "nie",
  cielDna: "normal"
};

function getMachineUseCounts(sessions: WorkoutSession[]) {
  const counts = new Map<string, number>();

  sessions.forEach((session) => {
    session.entries.forEach((entry) => {
      counts.set(entry.machineId, (counts.get(entry.machineId) ?? 0) + 1);
    });
  });

  return counts;
}

function getLastUsedMap(sessions: WorkoutSession[]) {
  const lastUsed = new Map<string, string>();

  sessions.forEach((session) => {
    session.entries.forEach((entry) => {
      if (!lastUsed.has(entry.machineId)) {
        lastUsed.set(entry.machineId, entry.completedAt);
      }
    });
  });

  return lastUsed;
}

function getMachineMap(machines: Machine[]) {
  return new Map(machines.map((machine) => [machine.id, machine]));
}

function getMachineSearchText(machine: Machine) {
  return `${machine.id} ${machine.displayNameSk} ${machine.modelName} ${machine.descriptionSk} ${machine.category}`.toLowerCase();
}

function inferMovementPattern(machine: Machine): MovementPattern {
  if (machine.movementPattern) {
    return machine.movementPattern;
  }

  const text = getMachineSearchText(machine);

  if (machine.muscleGroup === "Kardio") {
    return "cardio";
  }

  if (text.includes("triceps")) {
    return "elbowExtension";
  }

  if (text.includes("biceps") || text.includes("scott")) {
    return "elbowFlexion";
  }

  if (text.includes("lytka") || text.includes("calf")) {
    return "calf";
  }

  if (machine.muscleGroup === "Brucho" || text.includes("bruch")) {
    return text.includes("zaklon") || text.includes("hyper") ? "coreExtension" : "coreFlexion";
  }

  if (
    text.includes("zakop") ||
    text.includes("hip thrust") ||
    text.includes("hyper") ||
    text.includes("zadnu cast stehien")
  ) {
    return "hipDominant";
  }

  if (
    text.includes("leg press") ||
    text.includes("tlak nohami") ||
    text.includes("drep") ||
    text.includes("predkop") ||
    text.includes("stehien")
  ) {
    return "kneeDominant";
  }

  if (machine.muscleGroup === "Hrudnik") {
    return "horizontalPush";
  }

  if (machine.muscleGroup === "Ramena") {
    return "verticalPush";
  }

  if (text.includes("stahovanie") || text.includes("zhyby") || text.includes("pulldown")) {
    return "verticalPull";
  }

  if (machine.muscleGroup === "Chrbat") {
    return "horizontalPull";
  }

  return "fullBody";
}

function inferPrimaryMuscles(machine: Machine, subgroup: string) {
  if (machine.primaryMuscles?.length) {
    return machine.primaryMuscles;
  }

  if (machine.muscleGroup === "Hrudnik") {
    return ["hrudnik"];
  }

  if (machine.muscleGroup === "Ramena") {
    return ["ramena"];
  }

  if (machine.muscleGroup === "Chrbat") {
    return subgroup === "spodny chrbat" ? ["spodny chrbat"] : ["chrbat"];
  }

  if (machine.muscleGroup === "Ruky") {
    return ["biceps"];
  }

  if (machine.muscleGroup === "Triceps") {
    return ["triceps"];
  }

  if (machine.muscleGroup === "Brucho") {
    return ["brucho"];
  }

  if (subgroup.includes("lytka")) {
    return ["lytka"];
  }

  if (subgroup.includes("zadok")) {
    return ["zadok"];
  }

  if (subgroup.includes("zadne")) {
    return ["zadne stehna"];
  }

  if (subgroup.includes("predne")) {
    return ["predne stehna"];
  }

  return [machine.muscleGroup.toLowerCase()];
}

function inferSecondaryMuscles(machine: Machine, movementPattern: MovementPattern) {
  if (machine.secondaryMuscles?.length) {
    return machine.secondaryMuscles;
  }

  if (movementPattern === "horizontalPush") {
    return ["predne ramena", "triceps"];
  }

  if (movementPattern === "verticalPush") {
    return ["triceps"];
  }

  if (movementPattern === "horizontalPull" || movementPattern === "verticalPull") {
    return ["zadne ramena", "biceps"];
  }

  if (movementPattern === "kneeDominant") {
    return ["zadok"];
  }

  if (movementPattern === "hipDominant") {
    return ["zadok", "spodny chrbat"];
  }

  return [];
}

function inferFatigueCost(machine: Machine, difficulty: ExerciseDifficulty): FatigueCost {
  if (machine.fatigueCost) {
    return machine.fatigueCost;
  }

  const pattern = inferMovementPattern(machine);

  if (difficulty === "hard" || pattern === "kneeDominant" || pattern === "hipDominant") {
    return "high";
  }

  if (difficulty === "easy" || pattern === "elbowFlexion" || pattern === "elbowExtension" || pattern === "calf") {
    return "low";
  }

  return "medium";
}

function inferRomBias(machine: Machine): RomBias {
  if (machine.romBias) {
    return machine.romBias;
  }

  const text = getMachineSearchText(machine);

  if (text.includes("rozpaz") || text.includes("predkop") || text.includes("zakop") || text.includes("curl")) {
    return "longLength";
  }

  return "neutral";
}

function inferRepZone(machine: Machine, exerciseType: ExerciseType, difficulty: ExerciseDifficulty) {
  if (machine.defaultRepMin && machine.defaultRepMax) {
    return { min: machine.defaultRepMin, max: machine.defaultRepMax };
  }

  if (exerciseType === "core" || exerciseType === "isolation") {
    return { min: 10, max: 15 };
  }

  if (difficulty === "hard") {
    return { min: 6, max: 10 };
  }

  return { min: 8, max: 12 };
}

function inferMicroloadStep(machine: Machine, exerciseType: ExerciseType) {
  if (machine.microloadStepKg) {
    return machine.microloadStepKg;
  }

  if (exerciseType === "isolation" || exerciseType === "core") {
    return 1.25;
  }

  return 2.5;
}

function inferTempoHint(machine: Machine, exerciseType: ExerciseType) {
  if (machine.tempoHint) {
    return machine.tempoHint;
  }

  if (exerciseType === "cardio") {
    return "Drz plynule tempo, bez nahanania ega.";
  }

  if (exerciseType === "core" || exerciseType === "isolation") {
    return "Kontroluj pohyb, 2 az 3 sekundy dole a bez hadzania vahy.";
  }

  return "Pevny stred tela, kontrolovany rozsah a ziadne trhanie.";
}

function inferMachineMeta(machine: Machine): TrainerMachineMeta {
  const subgroup = machine.subgroup ?? inferSubgroup(machine);
  const exerciseType = machine.exerciseType ?? inferExerciseType(machine);
  const difficulty = machine.difficulty ?? inferDifficulty(machine);
  const movementPattern = inferMovementPattern(machine);
  const repZone = inferRepZone(machine, exerciseType, difficulty);
  const rest = inferRestRange(machine, exerciseType, difficulty);

  if (machine.recommendedRestMinSec && machine.recommendedRestMaxSec) {
    return {
      subgroup,
      exerciseType,
      difficulty,
      estimatedTimeMinutes: machine.estimatedTimeMinutes ?? inferEstimatedTime(machine),
      recommendedRestMinSec: machine.recommendedRestMinSec,
      recommendedRestMaxSec: machine.recommendedRestMaxSec,
      movementPattern,
      primaryMuscles: inferPrimaryMuscles(machine, subgroup),
      secondaryMuscles: inferSecondaryMuscles(machine, movementPattern),
      fatigueCost: inferFatigueCost(machine, difficulty),
      romBias: inferRomBias(machine),
      defaultRepMin: repZone.min,
      defaultRepMax: repZone.max,
      microloadStepKg: inferMicroloadStep(machine, exerciseType),
      tempoHint: inferTempoHint(machine, exerciseType)
    };
  }

  return {
    subgroup,
    exerciseType,
    difficulty,
    estimatedTimeMinutes: machine.estimatedTimeMinutes ?? inferEstimatedTime(machine),
    recommendedRestMinSec: rest.min,
    recommendedRestMaxSec: rest.max,
    movementPattern,
    primaryMuscles: inferPrimaryMuscles(machine, subgroup),
    secondaryMuscles: inferSecondaryMuscles(machine, movementPattern),
    fatigueCost: inferFatigueCost(machine, difficulty),
    romBias: inferRomBias(machine),
    defaultRepMin: repZone.min,
    defaultRepMax: repZone.max,
    microloadStepKg: inferMicroloadStep(machine, exerciseType),
    tempoHint: inferTempoHint(machine, exerciseType)
  };
}

export function scoreReadiness(readiness: ReadinessCheck = defaultReadiness) {
  const energyScore = readiness.energia - 3;
  const sleepScore =
    readiness.spanok === "dobry" ? 1 : readiness.spanok === "slaby" ? -2 : 0;
  const sorenessScore =
    readiness.svalovica === "silna" ? -2 : readiness.svalovica === "mierna" ? -1 : 0;
  const painScore = readiness.bolest === "nie" ? 0 : -3;
  const goalScore =
    readiness.cielDna === "silovy"
      ? 1
      : readiness.cielDna === "lahky" || readiness.cielDna === "udrzat_rytmus"
        ? -1
        : 0;

  return energyScore + sleepScore + sorenessScore + painScore + goalScore;
}

export function getReadinessBand(score: number): ReadinessBand {
  if (score >= 2) {
    return "vysoka";
  }

  if (score <= -2) {
    return "nizka";
  }

  return "stredna";
}

function translateReadinessBand(band: ReadinessBand) {
  if (band === "vysoka") {
    return "vysoka pripravenost";
  }

  if (band === "nizka") {
    return "nizsia pripravenost";
  }

  return "stredna pripravenost";
}

function buildReadinessSummary(readiness: ReadinessCheck, band: ReadinessBand) {
  if (band === "vysoka") {
    return "Dnes vyzeras pripravene. Plan moze byt plny a progres moze byt trochu odvaznejsi.";
  }

  const reasons: string[] = [];

  if (readiness.energia <= 2) {
    reasons.push("energia je nizsia");
  }

  if (readiness.spanok === "slaby") {
    reasons.push("spanok nebol idealny");
  }

  if (readiness.svalovica === "silna") {
    reasons.push("svalovica je silna");
  }

  if (readiness.bolest !== "nie") {
    reasons.push(`hlasena bolest: ${readiness.bolest}`);
  }

  if (readiness.cielDna === "lahky") {
    reasons.push("dnes chces lahsi den");
  }

  if (band === "nizka") {
    return `Dnes ideme rozumne: ${reasons.join(", ") || "telo pyta opatrnost"}. Skracujem plan a netlacim agresivnu progresiu.`;
  }

  return `Dnes je to stred: ${reasons.join(", ") || "standardny den"}. Plan ostava normalny, ale bez hrdinstva cez bolest.`;
}

function getMachineRiskJoints(machine: Machine, meta: TrainerMachineMeta): ReadinessPain[] {
  const risks: ReadinessPain[] = [];

  if (machine.jointStress?.knees === "high" || meta.movementPattern === "kneeDominant") {
    risks.push("koleno");
  }

  if (
    machine.jointStress?.shoulders === "high" ||
    meta.movementPattern === "horizontalPush" ||
    meta.movementPattern === "verticalPush"
  ) {
    risks.push("rameno");
  }

  if (
    machine.jointStress?.lowerBack === "high" ||
    meta.movementPattern === "hipDominant" ||
    meta.movementPattern === "coreExtension"
  ) {
    risks.push("chrbat");
  }

  return risks;
}

function getRecentPainCountsByJoint(
  sessions: WorkoutSession[],
  machinesById: Map<string, Machine>
) {
  const counts: Record<string, number> = {};

  sessions
    .filter((session) => isWithinLastDays(session.workoutDate, 14))
    .forEach((session) => {
      session.entries.forEach((entry) => {
        if (entry.feeling !== "bolest" && !entry.painLocation) {
          return;
        }

        const explicitJoint = entry.painLocation && entry.painLocation !== "nie"
          ? entry.painLocation
          : undefined;
        const machine = machinesById.get(entry.machineId);
        const inferredJoints = machine
          ? getMachineRiskJoints(machine, inferMachineMeta(machine))
          : [];
        const joints = explicitJoint ? [explicitJoint] : inferredJoints;

        joints.forEach((joint) => {
          counts[joint] = (counts[joint] ?? 0) + 1;
        });
      });
    });

  return counts;
}

function getSafetyPenalty({
  machine,
  meta,
  readiness,
  recentPainByJoint
}: {
  machine: Machine;
  meta: TrainerMachineMeta;
  readiness: ReadinessCheck;
  recentPainByJoint: Record<string, number>;
}) {
  const riskJoints = getMachineRiskJoints(machine, meta);
  let penalty = 0;

  if (readiness.bolest !== "nie" && riskJoints.includes(readiness.bolest)) {
    penalty += 28;
  }

  riskJoints.forEach((joint) => {
    const count = recentPainByJoint[joint] ?? 0;

    if (count >= 2) {
      penalty += 24;
    } else if (count === 1) {
      penalty += 10;
    }
  });

  return penalty;
}

function buildSafetyNote({
  machine,
  meta,
  readiness,
  recentPainByJoint
}: {
  machine: Machine;
  meta: TrainerMachineMeta;
  readiness: ReadinessCheck;
  recentPainByJoint: Record<string, number>;
}) {
  const riskJoints = getMachineRiskJoints(machine, meta);
  const activeJoint = readiness.bolest !== "nie" && riskJoints.includes(readiness.bolest)
    ? readiness.bolest
    : undefined;
  const repeatedJoint = riskJoints.find((joint) => (recentPainByJoint[joint] ?? 0) >= 2);

  if (activeJoint) {
    return `Pozor na ${activeJoint}. Dnes radsej mensia vaha, cista technika a bez bolesti.`;
  }

  if (repeatedJoint) {
    return `V historii sa opakuje ${repeatedJoint}. Ak sa ozve, cvik vymen alebo uber rozsah.`;
  }

  if (meta.fatigueCost === "high") {
    return "Tazsi cvik. Nechaj si rezervu a nerob z prvej serie finale Ligy majstrov.";
  }

  return undefined;
}

function inferSubgroup(machine: Machine) {
  const text = `${machine.id} ${machine.displayNameSk} ${machine.descriptionSk}`.toLowerCase();

  if (text.includes("leg-press") || text.includes("tlak nohami") || text.includes("predkop")) {
    return "predne stehna";
  }

  if (text.includes("zakop") || text.includes("hamstring")) {
    return "zadne stehna";
  }

  if (text.includes("lytka") || text.includes("calf")) {
    return "lytka";
  }

  if (text.includes("hip") || text.includes("zadok") || text.includes("glute")) {
    return "zadok";
  }

  if (machine.muscleGroup === "Brucho") {
    return "brucho";
  }

  if (machine.muscleGroup === "Hrudnik") {
    return "hrudnik";
  }

  if (machine.muscleGroup === "Chrbat") {
    return "chrbat";
  }

  if (machine.muscleGroup === "Ramena") {
    return "ramena";
  }

  if (machine.muscleGroup === "Ruky" || machine.muscleGroup === "Triceps") {
    return machine.muscleGroup === "Triceps" ? "triceps" : "biceps";
  }

  if (machine.muscleGroup === "Kardio") {
    return "kardio";
  }

  return "cele telo";
}

function inferExerciseType(machine: Machine): ExerciseType {
  const text = `${machine.id} ${machine.displayNameSk} ${machine.category}`.toLowerCase();

  if (machine.muscleGroup === "Kardio") {
    return "cardio";
  }

  if (machine.muscleGroup === "Brucho") {
    return "core";
  }

  if (
    text.includes("biceps") ||
    text.includes("triceps") ||
    text.includes("lytka") ||
    text.includes("predkop") ||
    text.includes("zakop")
  ) {
    return "isolation";
  }

  return "compound";
}

function inferDifficulty(machine: Machine): ExerciseDifficulty {
  const text = `${machine.id} ${machine.displayNameSk} ${machine.descriptionSk}`.toLowerCase();

  if (
    text.includes("leg press") ||
    text.includes("tlak nohami") ||
    text.includes("drep") ||
    text.includes("smith") ||
    text.includes("hip thrust")
  ) {
    return "hard";
  }

  if (machine.muscleGroup === "Brucho" || machine.muscleGroup === "Ruky" || machine.muscleGroup === "Triceps") {
    return "easy";
  }

  return "medium";
}

function inferEstimatedTime(machine: Machine) {
  const metaType = machine.exerciseType ?? inferExerciseType(machine);
  const difficulty = machine.difficulty ?? inferDifficulty(machine);

  if (metaType === "cardio") {
    return 12;
  }

  if (metaType === "core" || difficulty === "easy") {
    return 6;
  }

  if (difficulty === "hard") {
    return 10;
  }

  return 8;
}

function inferRestRange(
  machine: Machine,
  exerciseType: ExerciseType,
  difficulty: ExerciseDifficulty
) {
  if (exerciseType === "cardio" || exerciseType === "mobility") {
    return { min: 0, max: 0 };
  }

  if (
    exerciseType === "core" ||
    machine.muscleGroup === "Ruky" ||
    machine.muscleGroup === "Triceps" ||
    inferSubgroup(machine) === "lytka"
  ) {
    return { min: 30, max: 60 };
  }

  if (difficulty === "hard") {
    return { min: 90, max: 150 };
  }

  return { min: 60, max: 90 };
}

function estimateSessionDuration(session: WorkoutSession, machinesById: Map<string, Machine>) {
  return session.entries.reduce((sum, entry) => {
    if (entry.durationMin) {
      return sum + entry.durationMin;
    }

    const machine = machinesById.get(entry.machineId);
    return sum + (machine ? inferMachineMeta(machine).estimatedTimeMinutes : 8);
  }, 0);
}

function formatCombination(groups: MuscleGroup[]) {
  if (groups.length === 0) {
    return "zatial bez dat";
  }

  return groups.join(" + ").toLowerCase();
}

function getSessionCombination(session: WorkoutSession, machinesById: Map<string, Machine>) {
  const groups = Array.from(
    new Set(
      session.entries
        .map((entry) => machinesById.get(entry.machineId)?.muscleGroup)
        .filter(Boolean) as MuscleGroup[]
    )
  );

  return formatCombination(groups);
}

function isWithinLastDays(dateIso: string, days: number) {
  const time = new Date(dateIso).getTime();

  if (Number.isNaN(time)) {
    return false;
  }

  return Date.now() - time <= days * 24 * 60 * 60 * 1000;
}

function addToRecord(record: Record<string, number>, key: string, value: number) {
  record[key] = (record[key] ?? 0) + value;
}

function getLatestPatternDates(
  sessions: WorkoutSession[],
  machinesById: Map<string, Machine>
) {
  const latestPatternDates = new Map<MovementPattern, number>();

  sessions.forEach((session) => {
    session.entries.forEach((entry) => {
      const machine = machinesById.get(entry.machineId);

      if (!machine) {
        return;
      }

      const completedAt = new Date(entry.completedAt).getTime();

      if (Number.isNaN(completedAt)) {
        return;
      }

      const pattern = inferMachineMeta(machine).movementPattern;
      const previous = latestPatternDates.get(pattern) ?? 0;

      if (completedAt > previous) {
        latestPatternDates.set(pattern, completedAt);
      }
    });
  });

  return latestPatternDates;
}

export function buildWeeklyTrainingState(
  sessions: WorkoutSession[],
  machines: Machine[]
): WeeklyTrainingState {
  const machinesById = getMachineMap(machines);
  const hardSetsByMuscle: Record<string, number> = {};
  const hardSetsByPattern: Record<string, number> = {};
  const exposureCountPerExercise: Record<string, number> = {};
  let axialFatigueScore = 0;

  sessions
    .filter((session) => isWithinLastDays(session.workoutDate, 7))
    .forEach((session) => {
      session.entries.forEach((entry) => {
        const machine = machinesById.get(entry.machineId);

        if (!machine) {
          return;
        }

        const meta = inferMachineMeta(machine);
        const hardSets = entry.sets ?? (entry.durationMin ? 1 : 0);

        if (hardSets <= 0) {
          return;
        }

        meta.primaryMuscles.forEach((muscle) => addToRecord(hardSetsByMuscle, muscle, hardSets));
        addToRecord(hardSetsByPattern, meta.movementPattern, hardSets);
        addToRecord(exposureCountPerExercise, machine.id, 1);

        if (meta.fatigueCost === "high") {
          axialFatigueScore += hardSets * 2;
        } else if (meta.fatigueCost === "medium") {
          axialFatigueScore += hardSets;
        }
      });
    });

  const latestPatternDates = getLatestPatternDates(sessions, machinesById);
  const daysSinceLastLoadedPattern: Record<string, number> = {};

  latestPatternDates.forEach((time, pattern) => {
    daysSinceLastLoadedPattern[pattern] = Math.max(
      0,
      Math.floor((Date.now() - time) / (24 * 60 * 60 * 1000))
    );
  });

  const topNeeds = trackedMuscles
    .map((muscle) => [muscle, hardSetsByMuscle[muscle] ?? 0] as const)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 4)
    .map(([muscle]) => muscle);

  return {
    hardSetsByMuscle,
    hardSetsByPattern,
    exposureCountPerExercise,
    axialFatigueScore,
    daysSinceLastLoadedPattern,
    topNeeds
  };
}

export function analyzeTrainerHistory(
  sessions: WorkoutSession[],
  machines: Machine[]
): TrainerHistoryStats {
  const machinesById = getMachineMap(machines);
  const weeklyState = buildWeeklyTrainingState(sessions, machines);
  const useCounts = getMachineUseCounts(sessions);
  const sessionDurations = sessions.map((session) =>
    estimateSessionDuration(session, machinesById)
  );
  const averageWorkoutDurationMin = sessionDurations.length
    ? Math.round(sessionDurations.reduce((sum, value) => sum + value, 0) / sessionDurations.length)
    : 60;
  const averageExercisesPerWorkout = sessions.length
    ? Math.round(
        (sessions.reduce((sum, session) => sum + session.entries.length, 0) / sessions.length) *
          10
      ) / 10
    : 6;
  const exercisesPer60Min =
    averageWorkoutDurationMin > 0
      ? Math.round((averageExercisesPerWorkout / averageWorkoutDurationMin) * 60 * 10) / 10
      : 6;
  const combinationCounts = new Map<string, number>();

  sessions.forEach((session) => {
    const combination = getSessionCombination(session, machinesById);
    combinationCounts.set(combination, (combinationCounts.get(combination) ?? 0) + 1);
  });

  const commonMuscleGroupCombination =
    [...combinationCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "zatial bez dat";

  return {
    totalSessions: sessions.length,
    frequentMachines: machines.filter((machine) => (useCounts.get(machine.id) ?? 0) >= 3),
    occasionalMachines: machines.filter((machine) => {
      const count = useCounts.get(machine.id) ?? 0;
      return count > 0 && count < 3;
    }),
    neverUsedMachines: machines.filter((machine) => !useCounts.has(machine.id)),
    averageWorkoutDurationMin,
    averageExercisesPerWorkout,
    exercisesPer60Min,
    commonMuscleGroupCombination,
    weeklyState
  };
}

function getFocusFromSession(session: WorkoutSession, machinesById: Map<string, Machine>) {
  const groups = session.entries
    .map((entry) => machinesById.get(entry.machineId)?.muscleGroup)
    .filter(Boolean) as MuscleGroup[];
  const upperCount = groups.filter((group) => upperGroups.includes(group)).length;
  const lowerCount = groups.filter((group) => lowerGroups.includes(group)).length;

  if (lowerCount > upperCount) {
    return "Spodok tela";
  }

  if (upperCount > lowerCount) {
    return "Vrch tela";
  }

  return session.focus;
}

function chooseFocus(sessions: WorkoutSession[], machinesById: Map<string, Machine>) {
  const latest = sessions[0];

  if (!latest) {
    return "Vrch tela";
  }

  return getFocusFromSession(latest, machinesById) === "Spodok tela"
    ? "Vrch tela"
    : "Spodok tela";
}

function getBucketsForFocus(focus: WorkoutFocus) {
  if (focus === "Spodok tela") {
    return [
      { groups: ["Nohy"] as MuscleGroup[], subgroup: "predne stehna" },
      { groups: ["Brucho"] as MuscleGroup[] },
      { groups: ["Nohy"] as MuscleGroup[], subgroup: "zadne stehna" },
      { groups: ["Nohy"] as MuscleGroup[], subgroup: "lytka" },
      { groups: ["Brucho"] as MuscleGroup[] },
      { groups: ["Nohy"] as MuscleGroup[], subgroup: "zadok" },
      { groups: ["Nohy"] as MuscleGroup[] }
    ];
  }

  return [
    { groups: ["Hrudnik"] as MuscleGroup[] },
    { groups: ["Ramena"] as MuscleGroup[] },
    { groups: ["Ruky", "Triceps"] as MuscleGroup[] },
    { groups: ["Chrbat"] as MuscleGroup[] },
    { groups: ["Hrudnik"] as MuscleGroup[] },
    { groups: ["Ramena"] as MuscleGroup[] },
    { groups: ["Chrbat"] as MuscleGroup[] }
  ];
}

function hasRecentPainFlag(sessions: WorkoutSession[], machineId: string) {
  return sessions
    .flatMap((session) => session.entries)
    .filter((entry) => entry.machineId === machineId)
    .slice(0, 2)
    .some((entry) => entry.feeling === "bolest");
}

function getWeeklyNeedScore(meta: TrainerMachineMeta, weeklyState: WeeklyTrainingState) {
  const muscleNeed = meta.primaryMuscles.reduce((sum, muscle) => {
    const currentSets = weeklyState.hardSetsByMuscle[muscle] ?? 0;
    return sum + Math.max(0, 10 - currentSets);
  }, 0);
  const patternSets = weeklyState.hardSetsByPattern[meta.movementPattern] ?? 0;

  return muscleNeed + Math.max(0, 6 - patternSets);
}

function getCandidateScore(
  machine: Machine,
  useCounts: Map<string, number>,
  lastUsed: Map<string, string>,
  selectedIds: Set<string>,
  weeklyState: WeeklyTrainingState,
  sessions: WorkoutSession[],
  userExerciseProfiles: Record<string, UserExerciseProfile> | undefined,
  readiness: ReadinessCheck,
  readinessBand: ReadinessBand,
  recentPainByJoint: Record<string, number>,
  previousSelected?: Machine
) {
  if (selectedIds.has(machine.id)) {
    return -9999;
  }

  const profile = userExerciseProfiles?.[machine.id];

  if (profile?.doNotRecommend) {
    return -9999;
  }

  if (profile?.blockedUntil) {
    const blockedUntilTime = new Date(profile.blockedUntil).getTime();

    if (!Number.isNaN(blockedUntilTime) && blockedUntilTime > Date.now()) {
      return -9999;
    }
  }

  const count = useCounts.get(machine.id) ?? 0;
  const meta = inferMachineMeta(machine);
  const familiarityScore = Math.min(count, 4) * 2;
  const discoveryScore = count <= 1 ? 4 : 0;
  const profileScore =
    (profile?.isFavorite ? 4 : 0) + (profile?.growthPriority ?? 0) * 5;
  const weeklyNeedScore = getWeeklyNeedScore(meta, weeklyState);
  const readinessCompatibilityScore =
    readinessBand === "vysoka" && meta.fatigueCost === "high"
      ? 4
      : readinessBand === "nizka" && meta.fatigueCost === "high"
        ? -12
        : 0;
  const recencyBonus = lastUsed.has(machine.id) ? 0 : 2;
  const painPenalty = hasRecentPainFlag(sessions, machine.id) ? 12 : 0;
  const safetyPenalty = getSafetyPenalty({
    machine,
    meta,
    readiness,
    recentPainByJoint
  });
  const kneePenalty =
    machine.jointStress?.knees === "high" || meta.movementPattern === "kneeDominant"
      ? 1
      : 0;
  const previousMeta = previousSelected ? inferMachineMeta(previousSelected) : null;
  const fatiguePenalty =
    previousMeta?.fatigueCost === "high" && meta.fatigueCost === "high" ? 6 : 0;
  const redundancyPenalty =
    previousMeta?.movementPattern === meta.movementPattern ? 4 : 0;

  return (
    weeklyNeedScore +
    familiarityScore +
    discoveryScore +
    profileScore +
    readinessCompatibilityScore +
    recencyBonus -
    painPenalty -
    safetyPenalty -
    kneePenalty -
    fatiguePenalty -
    redundancyPenalty
  );
}

function pickMachine({
  machines,
  groups,
  subgroup,
  useCounts,
  lastUsed,
  selectedIds,
  preferDiscovery,
  weeklyState,
  sessions,
  userExerciseProfiles,
  readiness,
  readinessBand,
  recentPainByJoint,
  previousSelected
}: {
  machines: Machine[];
  groups: MuscleGroup[];
  subgroup?: string;
  useCounts: Map<string, number>;
  lastUsed: Map<string, string>;
  selectedIds: Set<string>;
  preferDiscovery: boolean;
  weeklyState: WeeklyTrainingState;
  sessions: WorkoutSession[];
  userExerciseProfiles?: Record<string, UserExerciseProfile>;
  readiness: ReadinessCheck;
  readinessBand: ReadinessBand;
  recentPainByJoint: Record<string, number>;
  previousSelected?: Machine;
}) {
  let candidates = machines.filter((machine) => groups.includes(machine.muscleGroup));

  if (subgroup) {
    const subgroupMatches = candidates.filter(
      (machine) => inferMachineMeta(machine).subgroup === subgroup
    );

    if (subgroupMatches.length > 0) {
      candidates = subgroupMatches;
    }
  }

  if (preferDiscovery) {
    const discovery = candidates.filter((machine) => (useCounts.get(machine.id) ?? 0) <= 1);

    if (discovery.length > 0) {
      candidates = discovery;
    }
  }

  return [...candidates].sort(
    (a, b) =>
      getCandidateScore(
        b,
        useCounts,
        lastUsed,
        selectedIds,
        weeklyState,
        sessions,
        userExerciseProfiles,
        readiness,
        readinessBand,
        recentPainByJoint,
        previousSelected
      ) -
      getCandidateScore(
        a,
        useCounts,
        lastUsed,
        selectedIds,
        weeklyState,
        sessions,
        userExerciseProfiles,
        readiness,
        readinessBand,
        recentPainByJoint,
        previousSelected
      )
  )[0];
}

function getExerciseCount(
  targetDurationMinutes: number,
  warmupMin: number,
  cooldownMin: number,
  stats: TrainerHistoryStats,
  readinessBand: ReadinessBand
) {
  const trainingMinutes = Math.max(20, targetDurationMinutes - warmupMin - cooldownMin);
  const historyBasedCount = stats.totalSessions > 0
    ? Math.round((stats.exercisesPer60Min / 60) * trainingMinutes)
    : Math.round(trainingMinutes / 8);

  const readinessAdjustment =
    readinessBand === "vysoka" ? 1 : readinessBand === "nizka" ? -2 : 0;

  return Math.min(9, Math.max(3, historyBasedCount + readinessAdjustment));
}

function getAverageRestForMachine(sessions: WorkoutSession[], machineId: string) {
  const rests = sessions.flatMap((session) =>
    session.entries
      .filter((entry) => entry.machineId === machineId && typeof entry.restSeconds === "number")
      .map((entry) => entry.restSeconds ?? 0)
  );

  if (rests.length === 0) {
    return undefined;
  }

  return Math.round(rests.reduce((sum, value) => sum + value, 0) / rests.length);
}

function buildRestNote(userAverageRestSec: number | undefined, min: number, max: number) {
  if (!userAverageRestSec) {
    return undefined;
  }

  if (userAverageRestSec < min) {
    return "Trenujes vo vyssom tempe.";
  }

  if (userAverageRestSec > max) {
    return "Davas dlhsie pauzy, co moze pomoct pri tazkych seriach.";
  }

  return "Tvoja prestavka je v odporucanom rozsahu.";
}

function buildWhyRest(meta: TrainerMachineMeta) {
  if (meta.recommendedRestMaxSec <= 60) {
    return "Kratka prestavka staci pri mensich izolovanych cvikoch a drzi trening v tempe.";
  }

  if (meta.recommendedRestMinSec >= 90) {
    return "Dlhsia prestavka pomaha udrzat silu pri narocnych cvikoch a podporuje kvalitne serie.";
  }

  return "Stredna prestavka dava dobry pomer medzi vykonom, napumpovanim a rastom svalov.";
}

function buildSelectionReason({
  machine,
  meta,
  useCount,
  weeklyState,
  isDiscovery
}: {
  machine: Machine;
  meta: TrainerMachineMeta;
  useCount: number;
  weeklyState: WeeklyTrainingState;
  isDiscovery: boolean;
}) {
  const primary = meta.primaryMuscles[0] ?? machine.muscleGroup.toLowerCase();
  const weeklySets = weeklyState.hardSetsByMuscle[primary] ?? 0;

  if (isDiscovery) {
    return `Novy alebo malo pouzivany stroj. Doda impulz pre ${primary}, aby telo nezaspalo pri rutine.`;
  }

  if (weeklySets < 6) {
    return `Tento tyzden ma ${primary} zatial len ${weeklySets} tvrdych serii, preto ho trener doplna.`;
  }

  if (useCount >= 3) {
    return "Poznam ho z tvojej historie, preto je dobry kandidat na kontrolovany progres.";
  }

  return "Zapada do dnesneho poradia a pomaha vyvazit zataz v treningu.";
}

export function getMachineTrainingGuidance(machine: Machine) {
  const meta = inferMachineMeta(machine);

  return {
    ...meta,
    goal: "rast svalov" as const,
    whyRest: buildWhyRest(meta)
  };
}

function buildStrategy(focus: WorkoutFocus, hasDiscovery: boolean) {
  const base = focus === "Spodok tela"
    ? "nohy + brucho, striedanie tazsich a lahsich cvikov"
    : "vrch tela, hrudnik + ramena + ruky + chrbat";

  return hasDiscovery ? `${base}, pridany aj novy alebo menej pouzivany stroj` : base;
}

export function generateTrainerPlan({
  sessions,
  machines,
  targetDurationMinutes,
  warmupMin,
  cooldownMin,
  preferredFocus,
  readiness = defaultReadiness,
  userExerciseProfiles
}: {
  sessions: WorkoutSession[];
  machines: Machine[];
  targetDurationMinutes: number;
  warmupMin: number;
  cooldownMin: number;
  preferredFocus?: WorkoutFocus;
  readiness?: ReadinessCheck;
  userExerciseProfiles?: Record<string, UserExerciseProfile>;
}): TrainerWorkoutPlan {
  const machinesById = getMachineMap(machines);
  const focus = preferredFocus ?? chooseFocus(sessions, machinesById);
  const stats = analyzeTrainerHistory(sessions, machines);
  const useCounts = getMachineUseCounts(sessions);
  const lastUsed = getLastUsedMap(sessions);
  const readinessScore = scoreReadiness(readiness);
  const readinessBand = getReadinessBand(readinessScore);
  const recentPainByJoint = getRecentPainCountsByJoint(sessions, machinesById);
  const selectedIds = new Set<string>();
  const exerciseCount = getExerciseCount(
    targetDurationMinutes,
    warmupMin,
    cooldownMin,
    stats,
    readinessBand
  );
  const buckets = getBucketsForFocus(focus);
  const selected: Machine[] = [];

  for (let index = 0; selected.length < exerciseCount; index += 1) {
    const bucket = buckets[index % buckets.length];
    const shouldDiscover =
      selected.length === Math.max(1, Math.floor(exerciseCount * 0.7)) ||
      (selected.length === exerciseCount - 1 && selected.every((machine) => (useCounts.get(machine.id) ?? 0) > 1));
    const picked = pickMachine({
      machines,
      groups: bucket.groups,
      subgroup: bucket.subgroup,
      useCounts,
      lastUsed,
      selectedIds,
      preferDiscovery: shouldDiscover,
      weeklyState: stats.weeklyState,
      sessions,
      userExerciseProfiles,
      readiness,
      readinessBand,
      recentPainByJoint,
      previousSelected: selected[selected.length - 1]
    });

    if (!picked) {
      break;
    }

    selectedIds.add(picked.id);
    selected.push(picked);
  }

  const exercises = selected.map((machine, index) => {
    const meta = inferMachineMeta(machine);
    const userAverageRestSec = getAverageRestForMachine(sessions, machine.id);
    const isLowReadiness = readinessBand === "nizka";
    const sets = Math.max(
      2,
      (meta.exerciseType === "core" ? 3 : 4) -
        (isLowReadiness && meta.fatigueCost !== "low" ? 1 : 0)
    );
    const reps = isLowReadiness
      ? Math.max(meta.defaultRepMin, Math.min(meta.defaultRepMax, meta.defaultRepMin + 1))
      : meta.difficulty === "hard"
        ? meta.defaultRepMin
        : meta.defaultRepMax;
    const safetyNote = buildSafetyNote({
      machine,
      meta,
      readiness,
      recentPainByJoint
    });
    const confidenceScore = Math.max(
      20,
      Math.min(
        95,
        45 +
          Math.min(useCounts.get(machine.id) ?? 0, 4) * 8 +
          (lastUsed.has(machine.id) ? 12 : 0) +
          (readinessBand === "vysoka" ? 8 : readinessBand === "nizka" ? -12 : 0) -
          (safetyNote ? 12 : 0)
      )
    );

    return {
      order: index + 1,
      machine,
      muscleGroup: machine.muscleGroup,
      subgroup: meta.subgroup,
      exerciseType: meta.exerciseType,
      difficulty: meta.difficulty,
      estimatedTimeMinutes: meta.estimatedTimeMinutes,
      sets,
      reps,
      recommendedRestMinSec: meta.recommendedRestMinSec,
      recommendedRestMaxSec: meta.recommendedRestMaxSec,
      userAverageRestSec,
      note: buildRestNote(
        userAverageRestSec,
        meta.recommendedRestMinSec,
        meta.recommendedRestMaxSec
      ),
      whyRest: buildWhyRest(meta),
      isDiscovery: (useCounts.get(machine.id) ?? 0) <= 1,
      movementPattern: meta.movementPattern,
      primaryMuscles: meta.primaryMuscles,
      targetRepMin: meta.defaultRepMin,
      targetRepMax: meta.defaultRepMax,
      selectionReason: buildSelectionReason({
        machine,
        meta,
        useCount: useCounts.get(machine.id) ?? 0,
        weeklyState: stats.weeklyState,
        isDiscovery: (useCounts.get(machine.id) ?? 0) <= 1
      }),
      tempoHint: meta.tempoHint,
      confidenceScore,
      confidenceLabel:
        confidenceScore >= 75
          ? "vysoka istota"
          : confidenceScore >= 45
            ? "stredna istota"
            : "nizka istota",
      safetyNote
    };
  });
  const estimatedDurationMinutes =
    warmupMin +
    cooldownMin +
    exercises.reduce((sum, exercise) => sum + exercise.estimatedTimeMinutes, 0);

  return {
    targetDurationMinutes,
    estimatedDurationMinutes,
    goal: "rast svalov",
    strategy: buildStrategy(focus, exercises.some((exercise) => exercise.isDiscovery)),
    focus,
    stats,
    readinessBand,
    readinessScore,
    readinessSummary: buildReadinessSummary(readiness, readinessBand),
    safetyNotes: [
      `Pripravenost: ${translateReadinessBand(readinessBand)} (${readinessScore})`,
      ...Array.from(
        new Set(exercises.map((exercise) => exercise.safetyNote).filter(Boolean) as string[])
      )
    ],
    exercises
  };
}
