export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Arms"
  | "Legs"
  | "Core";

export type WorkoutFocus =
  | "Upper Body"
  | "Lower Body"
  | "Core"
  | "Recovery";

export type AppTab = "home" | "machines" | "history" | "machine-detail";

export type Machine = {
  id: string;
  brand: "Gym80";
  modelName: string;
  category: string;
  muscleGroup: MuscleGroup;
  imageHint: string;
  setupNoteLabel?: string;
};

export type WorkoutEntry = {
  id: string;
  machineId: string;
  weightKg: number;
  sets: number;
  reps: number;
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
