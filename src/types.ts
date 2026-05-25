export type MuscleGroup =
  | "Hrudnik"
  | "Chrbat"
  | "Ramena"
  | "Ruky"
  | "Triceps"
  | "Nohy"
  | "Brucho"
  | "Kardio"
  | "Cele telo";

export type WorkoutFocus =
  | "Vrch tela"
  | "Spodok tela"
  | "Brucho"
  | "Oddych";

export type AppTab =
  | "home"
  | "machines"
  | "history"
  | "machine-detail"
  | "camera";

export type WorkoutFeeling = "lahke" | "akurat" | "tazke" | "bolest";

export type ReadinessEnergy = 1 | 2 | 3 | 4 | 5;

export type ReadinessSleep = "slaby" | "priemerny" | "dobry";

export type ReadinessSoreness = "ziadna" | "mierna" | "silna";

export type ReadinessPain = "nie" | "koleno" | "rameno" | "chrbat" | "ine";

export type ReadinessGoal = "normal" | "lahky" | "silovy" | "udrzat_rytmus";

export type ReadinessCheck = {
  energia: ReadinessEnergy;
  spanok: ReadinessSleep;
  svalovica: ReadinessSoreness;
  bolest: ReadinessPain;
  cielDna: ReadinessGoal;
};

export type ExerciseType =
  | "compound"
  | "isolation"
  | "core"
  | "cardio"
  | "mobility";

export type ExerciseDifficulty = "easy" | "medium" | "hard";

export type MovementPattern =
  | "horizontalPush"
  | "verticalPush"
  | "horizontalPull"
  | "verticalPull"
  | "kneeDominant"
  | "hipDominant"
  | "elbowFlexion"
  | "elbowExtension"
  | "calf"
  | "coreFlexion"
  | "coreExtension"
  | "cardio"
  | "fullBody";

export type FatigueCost = "low" | "medium" | "high";

export type RomBias = "longLength" | "neutral" | "shortened";

export type JointStressProfile = {
  knees?: "low" | "medium" | "high";
  shoulders?: "low" | "medium" | "high";
  lowerBack?: "low" | "medium" | "high";
};

export type Machine = {
  id: string;
  brand: "Gym80" | "Volne vahy" | "Trener";
  modelName: string;
  displayNameSk: string;
  category: string;
  muscleGroup: MuscleGroup;
  imageHint: string;
  descriptionSk: string;
  imageAsset?: string;
  setupNoteLabel?: string;
  subgroup?: string;
  exerciseType?: ExerciseType;
  difficulty?: ExerciseDifficulty;
  estimatedTimeMinutes?: number;
  goal?: "hypertrophy";
  recommendedRestMinSec?: number;
  recommendedRestMaxSec?: number;
  movementPattern?: MovementPattern;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  fatigueCost?: FatigueCost;
  jointStress?: JointStressProfile;
  romBias?: RomBias;
  defaultRepMin?: number;
  defaultRepMax?: number;
  microloadStepKg?: number;
  tempoHint?: string;
  alternatives?: string[];
  contraFlags?: string[];
};

export type WorkoutEntry = {
  id: string;
  machineId: string;
  weightKg?: number;
  sets?: number;
  reps?: number;
  durationMin?: number;
  speedKph?: number;
  inclinePercent?: number;
  restSeconds?: number;
  feeling?: WorkoutFeeling;
  rpe?: number;
  painLocation?: ReadinessPain;
  painLevel?: number;
  note?: string;
  completedAt: string;
};

export type WorkoutSession = {
  id: string;
  workoutDate: string;
  focus: WorkoutFocus;
  coachSummary: string;
  entries: WorkoutEntry[];
};
