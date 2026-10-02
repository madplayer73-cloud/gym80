import { Machine, WorkoutEntry } from "../types";

export function getRememberedAccessory(machine: Machine, entries: WorkoutEntry[], variantId?: string | null) {
  const defaultVariant = machine.exerciseVariants?.[0]?.id;
  const latest = entries.filter((entry) => entry.machineId === machine.id &&
    (entry.exerciseVariantId ?? defaultVariant ?? null) === (variantId ?? defaultVariant ?? null))
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
  return latest?.accessoryId && machine.accessoryIds?.includes(latest.accessoryId) ? latest.accessoryId : null;
}
