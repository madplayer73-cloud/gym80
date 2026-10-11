import { Machine, WorkoutEntry, WorkoutSession } from "../types";
import { exerciseContextKey } from "./personalData";

export type ProgressMetric = "weight" | "reps" | "volume";
export type TrendPoint = { date: string; weight?: number; reps?: number; volume?: number; sets: number; repsByWeight: Record<string, number> };
export type ExerciseTrend = { key: string; machine: Machine; context: string; loadType: string; points: TrendPoint[] };
export const dateKey = (value: string) => value.slice(0, 10);
export function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + days); return d.toLocaleDateString("sv-SE");
}
export function monthKey(date: string, offset = 0) {
  const d = new Date(`${dateKey(date)}T12:00:00`); d.setDate(1); d.setMonth(d.getMonth() + offset); return d.toLocaleDateString("sv-SE").slice(0, 7);
}
export function workingSets(entry: WorkoutEntry) {
  if (entry.setLogs?.length) return entry.setLogs.filter(s => s.completed && s.setType !== "warmup");
  return Array.from({ length: Math.min(100, Math.max(0, Math.floor(entry.sets ?? 0))) }, () => ({ weightKg: entry.weightKg, reps: entry.reps }));
}
export function buildExerciseTrends(sessions: WorkoutSession[], getMachine: (id: string) => Machine | undefined) {
  const groups = new Map<string, ExerciseTrend>();
  for (const session of sessions) for (const entry of session.entries) {
    const machine = getMachine(entry.machineId);
    if (!machine || machine.muscleGroup === "Kardio") continue;
    const sets = workingSets(entry); if (!sets.length) continue;
    const variant = machine.exerciseVariants?.find(v => v.id === entry.exerciseVariantId) ?? machine.exerciseVariants?.[0];
    const key = exerciseContextKey(entry, machine);
    const trend = groups.get(key) ?? { key, machine, context: [entry.exerciseVariantNameSk ?? variant?.nameSk, entry.accessoryNameSk ?? entry.accessoryId].filter(Boolean).join(" · "), loadType: variant?.loadType ?? "weighted", points: [] };
    const date = dateKey(session.workoutDate);
    let point = trend.points.find(p => p.date === date);
    if (!point) { point = { date, sets: 0, repsByWeight: {} }; trend.points.push(point); }
    for (const set of sets) {
      point.sets++;
      const reps = set.reps !== undefined && Number.isFinite(set.reps) && set.reps > 0 ? set.reps : undefined;
      if (reps !== undefined) point.reps = Math.max(point.reps ?? 0, reps);
      if (set.weightKg !== undefined && Number.isFinite(set.weightKg) && set.weightKg >= 0) {
        point.weight = point.weight === undefined ? set.weightKg : trend.loadType === "assisted" ? Math.min(point.weight, set.weightKg) : Math.max(point.weight, set.weightKg);
        if (reps !== undefined) {
          point.repsByWeight[String(set.weightKg)] = Math.max(point.repsByWeight[String(set.weightKg)] ?? 0, reps);
          if (trend.loadType === "weighted") point.volume = (point.volume ?? 0) + set.weightKg * reps;
        }
      }
    }
    groups.set(key, trend);
  }
  return [...groups.values()].map(t => ({ ...t, points: t.points.sort((a, b) => a.date.localeCompare(b.date)) }))
    .sort((a, b) => b.points[b.points.length - 1].date.localeCompare(a.points[a.points.length - 1].date));
}
export function summarizeSessions(sessions: WorkoutSession[], getMachine: (id: string) => Machine | undefined) {
  const groups: Record<string, number> = {}; let sets = 0, volume = 0, duration = 0, measured = 0;
  const active = sessions.filter(s => s.entries.length > 0);
  for (const session of active) {
    if (session.cleanDurationSec !== undefined && Number.isFinite(session.cleanDurationSec)) { duration += Math.max(0, session.cleanDurationSec); measured++; }
    for (const entry of session.entries) {
      const machine = getMachine(entry.machineId); if (!machine || machine.muscleGroup === "Kardio") continue;
      const working = workingSets(entry); sets += working.length;
      const variant = machine.exerciseVariants?.find(v => v.id === entry.exerciseVariantId) ?? machine.exerciseVariants?.[0];
      const group = variant?.muscleGroup ?? machine.muscleGroup;
      groups[group] = (groups[group] ?? 0) + working.length;
      if (!variant?.loadType || variant.loadType === "weighted") for (const set of working) {
        if (set.weightKg !== undefined && Number.isFinite(set.weightKg) && set.weightKg >= 0 &&
          set.reps !== undefined && Number.isFinite(set.reps) && set.reps > 0) volume += set.weightKg * set.reps;
      }
    }
  }
  return { workouts: new Set(active.map(s => dateKey(s.workoutDate))).size, sets, volume, duration, measured, unmeasured: active.length - measured, groups };
}
export function getRecords(trend: ExerciseTrend) {
  const records: Array<{ label: string; value: string; date: string }> = [];
  const weighted = trend.points.filter(p => p.weight !== undefined);
  if (weighted.length && trend.loadType !== "bodyweight") {
    const best = weighted.reduce((a,b) => (trend.loadType === "assisted" ? b.weight! < a.weight! : b.weight! > a.weight!) ? b : a);
    records.push({ label: trend.loadType === "assisted" ? "Najmenej dopomoci" : "Najvyššia váha", value: `${best.weight} kg`, date: best.date });
  }
  if (trend.loadType === "weighted") {
    const best = trend.points.filter(p => p.volume !== undefined).sort((a,b) => b.volume! - a.volume!)[0];
    if (best) records.push({ label: "Najlepší denný objem", value: `${Math.round(best.volume!)} kg·op.`, date: best.date });
  }
  const bestReps = trend.points.filter(p => p.reps !== undefined).sort((a,b) => b.reps! - a.reps!)[0];
  if (bestReps) records.push({ label: "Najviac opakovaní v sérii", value: `${bestReps.reps} op.`, date: bestReps.date });
  const weights = [...new Set(trend.points.flatMap(p => Object.keys(p.repsByWeight)))];
  for (const weight of weights) {
    const points = trend.points.filter(p => p.repsByWeight[weight] !== undefined);
    if (points.length < 2) continue;
    const first = points[0], best = points.reduce((a,b) => b.repsByWeight[weight] > a.repsByWeight[weight] ? b : a);
    if (best.repsByWeight[weight] > first.repsByWeight[weight]) records.push({ label: `Viac opakovaní pri ${weight} kg`, value: `${first.repsByWeight[weight]} → ${best.repsByWeight[weight]} op.`, date: best.date });
  }
  return records;
}
