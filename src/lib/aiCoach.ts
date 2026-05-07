import { Machine, WorkoutSession } from "../types";
import { buildDailySuggestion } from "../utils/trainingPlan";

export type CoachRecommendation = {
  headline: string;
  summary: string;
  machineIds: string[];
};

export async function getCoachRecommendation(
  sessions: WorkoutSession[],
  machines: Machine[]
): Promise<CoachRecommendation> {
  const suggestion = buildDailySuggestion(sessions, machines);

  return {
    headline: suggestion.title,
    summary: suggestion.explanation,
    machineIds: suggestion.highlightedMachines.map((machine) => machine.id)
  };
}

// Future OpenAI adapter:
// - pass recent workout history
// - ask for next training split and progression
// - keep recommendation structure stable for the UI
