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

export type Machine = {
  id: string;
  brand: "Gym80" | "Volne vahy";
  modelName: string;
  displayNameSk: string;
  category: string;
  muscleGroup: MuscleGroup;
  imageHint: string;
  descriptionSk: string;
  imageAsset?: string;
  setupNoteLabel?: string;
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
  feeling?: WorkoutFeeling;
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
