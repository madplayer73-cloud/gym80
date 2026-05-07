import { Machine, WorkoutSession } from "../types";

export const mockMachines: Machine[] = [
  {
    id: "pure-kraft-seated-row-dual",
    brand: "Gym80",
    modelName: "Pure Kraft Seated Row Dual",
    category: "Plate Loaded",
    muscleGroup: "Back",
    imageHint: "Black row machine with chest support",
    setupNoteLabel: "Seat height"
  },
  {
    id: "pure-kraft-shoulder-press-dual",
    brand: "Gym80",
    modelName: "Pure Kraft Shoulder Press Dual",
    category: "Plate Loaded",
    muscleGroup: "Shoulders",
    imageHint: "Inclined seated press with dual arms",
    setupNoteLabel: "Back pad position"
  },
  {
    id: "pure-kraft-squat-machine",
    brand: "Gym80",
    modelName: "Pure Kraft Squat Machine",
    category: "Plate Loaded",
    muscleGroup: "Legs",
    imageHint: "Angled squat platform with shoulder pads",
    setupNoteLabel: "Foot stance"
  },
  {
    id: "selectorized-abdominal",
    brand: "Gym80",
    modelName: "Abdominal Machine",
    category: "Selectorized",
    muscleGroup: "Core",
    imageHint: "Seated crunch machine with chest pad",
    setupNoteLabel: "Seat depth"
  }
];

export const mockWorkoutSessions: WorkoutSession[] = [
  {
    id: "session-2026-05-05",
    workoutDate: "2026-05-05T18:30:00+02:00",
    focus: "Lower Body",
    coachSummary:
      "Last session was legs-dominant with solid intensity. Today the AI should avoid another heavy lower body day.",
    entries: [
      {
        id: "entry-squat-1",
        machineId: "pure-kraft-squat-machine",
        weightKg: 90,
        sets: 4,
        reps: 10,
        note: "Wide stance felt stronger.",
        completedAt: "2026-05-05T18:42:00+02:00"
      },
      {
        id: "entry-core-1",
        machineId: "selectorized-abdominal",
        weightKg: 40,
        sets: 3,
        reps: 15,
        note: "Seat depth at mark 3.",
        completedAt: "2026-05-05T19:05:00+02:00"
      }
    ]
  },
  {
    id: "session-2026-05-02",
    workoutDate: "2026-05-02T17:50:00+02:00",
    focus: "Upper Body",
    coachSummary:
      "Push and pull balance was good. Shoulder press can progress slightly if recovery is fine.",
    entries: [
      {
        id: "entry-row-1",
        machineId: "pure-kraft-seated-row-dual",
        weightKg: 55,
        sets: 4,
        reps: 12,
        note: "Seat height 4.",
        completedAt: "2026-05-02T18:05:00+02:00"
      },
      {
        id: "entry-shoulder-1",
        machineId: "pure-kraft-shoulder-press-dual",
        weightKg: 35,
        sets: 4,
        reps: 10,
        note: "Back pad one click lower.",
        completedAt: "2026-05-02T18:28:00+02:00"
      }
    ]
  }
];
