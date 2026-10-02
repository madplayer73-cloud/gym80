export type WorkoutClock = {
  phase: "warmup" | "running" | "paused" | "finished";
  elapsedSec: number;
  startedAt?: number;
  workoutDate: string;
};

export function getWorkoutElapsed(clock: WorkoutClock, now = Date.now()) {
  return Math.max(0, Math.floor(clock.elapsedSec +
    (clock.phase === "running" && clock.startedAt !== undefined ? Math.max(0, now - clock.startedAt) / 1000 : 0)));
}

export function transitionWorkoutClock(clock: WorkoutClock, phase: WorkoutClock["phase"], now = Date.now()): WorkoutClock {
  if (clock.phase === phase) return clock;
  return { ...clock, phase, elapsedSec: getWorkoutElapsed(clock, now), startedAt: phase === "running" ? now : undefined };
}

export function formatWorkoutTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor(safe / 60) % 60;
  const secs = safe % 60;
  return `${hours ? `${hours}:` : ""}${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
