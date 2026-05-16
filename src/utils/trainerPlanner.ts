import {
  ExerciseDifficulty,
  ExerciseType,
  Machine,
  MuscleGroup,
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
};

export type TrainerWorkoutPlan = {
  targetDurationMinutes: number;
  estimatedDurationMinutes: number;
  goal: "rast svalov";
  strategy: string;
  focus: WorkoutFocus;
  stats: TrainerHistoryStats;
  exercises: PlannedExercise[];
};

const upperGroups: MuscleGroup[] = ["Hrudnik", "Ramena", "Ruky", "Triceps", "Chrbat"];
const lowerGroups: MuscleGroup[] = ["Nohy", "Brucho"];

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

function inferMachineMeta(machine: Machine): TrainerMachineMeta {
  if (machine.recommendedRestMinSec && machine.recommendedRestMaxSec) {
    return {
      subgroup: machine.subgroup ?? inferSubgroup(machine),
      exerciseType: machine.exerciseType ?? inferExerciseType(machine),
      difficulty: machine.difficulty ?? inferDifficulty(machine),
      estimatedTimeMinutes: machine.estimatedTimeMinutes ?? inferEstimatedTime(machine),
      recommendedRestMinSec: machine.recommendedRestMinSec,
      recommendedRestMaxSec: machine.recommendedRestMaxSec
    };
  }

  const exerciseType = machine.exerciseType ?? inferExerciseType(machine);
  const difficulty = machine.difficulty ?? inferDifficulty(machine);
  const rest = inferRestRange(machine, exerciseType, difficulty);

  return {
    subgroup: machine.subgroup ?? inferSubgroup(machine),
    exerciseType,
    difficulty,
    estimatedTimeMinutes: machine.estimatedTimeMinutes ?? inferEstimatedTime(machine),
    recommendedRestMinSec: rest.min,
    recommendedRestMaxSec: rest.max
  };
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

export function analyzeTrainerHistory(
  sessions: WorkoutSession[],
  machines: Machine[]
): TrainerHistoryStats {
  const machinesById = getMachineMap(machines);
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
    commonMuscleGroupCombination
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

function getCandidateScore(
  machine: Machine,
  useCounts: Map<string, number>,
  lastUsed: Map<string, string>,
  selectedIds: Set<string>
) {
  if (selectedIds.has(machine.id)) {
    return -9999;
  }

  const count = useCounts.get(machine.id) ?? 0;
  const recencyPenalty = lastUsed.has(machine.id) ? 0 : 2;
  return count * 3 + recencyPenalty;
}

function pickMachine({
  machines,
  groups,
  subgroup,
  useCounts,
  lastUsed,
  selectedIds,
  preferDiscovery
}: {
  machines: Machine[];
  groups: MuscleGroup[];
  subgroup?: string;
  useCounts: Map<string, number>;
  lastUsed: Map<string, string>;
  selectedIds: Set<string>;
  preferDiscovery: boolean;
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
      getCandidateScore(b, useCounts, lastUsed, selectedIds) -
      getCandidateScore(a, useCounts, lastUsed, selectedIds)
  )[0];
}

function getExerciseCount(
  targetDurationMinutes: number,
  warmupMin: number,
  cooldownMin: number,
  stats: TrainerHistoryStats
) {
  const trainingMinutes = Math.max(20, targetDurationMinutes - warmupMin - cooldownMin);
  const historyBasedCount = stats.totalSessions > 0
    ? Math.round((stats.exercisesPer60Min / 60) * trainingMinutes)
    : Math.round(trainingMinutes / 8);

  return Math.min(9, Math.max(3, historyBasedCount));
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
  preferredFocus
}: {
  sessions: WorkoutSession[];
  machines: Machine[];
  targetDurationMinutes: number;
  warmupMin: number;
  cooldownMin: number;
  preferredFocus?: WorkoutFocus;
}): TrainerWorkoutPlan {
  const machinesById = getMachineMap(machines);
  const focus = preferredFocus ?? chooseFocus(sessions, machinesById);
  const stats = analyzeTrainerHistory(sessions, machines);
  const useCounts = getMachineUseCounts(sessions);
  const lastUsed = getLastUsedMap(sessions);
  const selectedIds = new Set<string>();
  const exerciseCount = getExerciseCount(
    targetDurationMinutes,
    warmupMin,
    cooldownMin,
    stats
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
      preferDiscovery: shouldDiscover
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

    return {
      order: index + 1,
      machine,
      muscleGroup: machine.muscleGroup,
      subgroup: meta.subgroup,
      exerciseType: meta.exerciseType,
      difficulty: meta.difficulty,
      estimatedTimeMinutes: meta.estimatedTimeMinutes,
      sets: meta.exerciseType === "core" ? 3 : 4,
      reps: meta.exerciseType === "core" ? 12 : meta.difficulty === "hard" ? 10 : 12,
      recommendedRestMinSec: meta.recommendedRestMinSec,
      recommendedRestMaxSec: meta.recommendedRestMaxSec,
      userAverageRestSec,
      note: buildRestNote(
        userAverageRestSec,
        meta.recommendedRestMinSec,
        meta.recommendedRestMaxSec
      ),
      whyRest: buildWhyRest(meta),
      isDiscovery: (useCounts.get(machine.id) ?? 0) <= 1
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
    exercises
  };
}
