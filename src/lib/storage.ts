import { Machine, WorkoutSession } from "../types";
import { mockMachines, mockWorkoutSessions } from "../data/mockData";

export type AppRepository = {
  listMachines: () => Promise<Machine[]>;
  listWorkoutSessions: () => Promise<WorkoutSession[]>;
};

export const mockRepository: AppRepository = {
  async listMachines() {
    return mockMachines;
  },
  async listWorkoutSessions() {
    return mockWorkoutSessions;
  }
};

// Future adapter:
// export const supabaseRepository: AppRepository = { ... }
