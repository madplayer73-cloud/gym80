import { Machine, WorkoutSession, WorkoutFocus } from "../types";

type DailySuggestion = {
  focus: WorkoutFocus;
  title: string;
  explanation: string;
  highlightedMachines: Machine[];
};

const rotation: Record<WorkoutFocus, WorkoutFocus> = {
  "Upper Body": "Lower Body",
  "Lower Body": "Upper Body",
  Core: "Recovery",
  Recovery: "Upper Body"
};

export function buildDailySuggestion(
  sessions: WorkoutSession[],
  machines: Machine[]
): DailySuggestion {
  const latestSession = sessions[0];
  const nextFocus = latestSession ? rotation[latestSession.focus] : "Upper Body";

  const highlightedMachines = machines.filter((machine) => {
    if (nextFocus === "Upper Body") {
      return ["Back", "Shoulders", "Arms", "Chest"].includes(machine.muscleGroup);
    }

    if (nextFocus === "Lower Body") {
      return machine.muscleGroup === "Legs" || machine.muscleGroup === "Core";
    }

    return machine.muscleGroup === "Core";
  });

  const explanation =
    latestSession?.focus === "Lower Body"
      ? "Posledný tréning bol zameraný na nohy a stred tela, takže dnešný návrh presúva záťaž na vrch tela."
      : "Aplikácia rotuje partie podľa poslednej zaznamenanej záťaže, aby si sa nevracal na tú istú ťažkú partiu príliš skoro.";

  return {
    focus: nextFocus,
    title:
      nextFocus === "Upper Body"
        ? "Dnes: vrchná časť tela"
        : nextFocus === "Lower Body"
          ? "Dnes: nohy a core"
          : "Dnes: ľahší deň",
    explanation,
    highlightedMachines
  };
}
