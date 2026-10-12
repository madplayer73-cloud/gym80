import { BodyMeasurement } from "../types";

export const bodyMetrics = [
  { key: "weightKg", label: "Hmotnosť", unit: "kg", max: 500 },
  { key: "waistCm", label: "Obvod pása", unit: "cm", max: 300 },
  { key: "bmi", label: "BMI", unit: "", max: 150 },
  { key: "bodyFatPercent", label: "Telesný tuk", unit: "%", max: 100 },
  { key: "muscleMassKg", label: "Svalstvo", unit: "kg", max: 500 },
  { key: "waterPercent", label: "Voda", unit: "%", max: 100 },
  { key: "visceralFat", label: "Viscerálny tuk", unit: "index", max: 100 },
  { key: "basalMetabolismKcal", label: "Bazálny metabolizmus", unit: "kcal/deň", max: 10000 },
  { key: "proteinPercent", label: "Bielkoviny", unit: "%", max: 100 },
  { key: "boneMassKg", label: "Kostná hmota", unit: "kg", max: 50 },
  { key: "bodyAge", label: "Telesný vek", unit: "rokov", max: 150 },
  { key: "bodyScore", label: "Skóre tela", unit: "bodov", max: 100 },
  { key: "idealWeightKg", label: "Ideálna váha podľa zariadenia", unit: "kg", max: 500 },
] as const;
export type BodyMetricKey = typeof bodyMetrics[number]["key"];

export function isBodyMeasurement(value: unknown): value is BodyMeasurement {
  if (!value || typeof value !== "object") return false;
  const entry = value as BodyMeasurement;
  const parsed = new Date(`${entry.date}T12:00:00`);
  return typeof entry.id === "string" && typeof entry.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)
    && Number.isFinite(parsed.getTime()) && parsed.toLocaleDateString("sv-SE") === entry.date
    && Number.isFinite(entry.weightKg) && entry.weightKg > 0
    && bodyMetrics.every(metric => entry[metric.key] === undefined ? metric.key !== "weightKg"
      : Number.isFinite(entry[metric.key]) && entry[metric.key]! >= 0 && entry[metric.key]! <= metric.max);
}

// Reminder is due from Sunday 09:00 in Bratislava until a measurement for that week is saved.
export function isBodyMeasurementDue(measurements: BodyMeasurement[], now = new Date()) {
  const parts = new Intl.DateTimeFormat("sv-SE", {timeZone:"Europe/Bratislava",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"}).formatToParts(now);
  const part = (type:string) => parts.find(p=>p.type===type)!.value;
  const calendar = new Date(`${part("year")}-${part("month")}-${part("day")}T12:00:00Z`);
  const daysFromSunday = calendar.getUTCDay();
  calendar.setUTCDate(calendar.getUTCDate() - daysFromSunday - (daysFromSunday === 0 && Number(part("hour")) < 9 ? 7 : 0));
  const dueDate = calendar.toISOString().slice(0,10);
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  return !measurements.some(m=>m.date >= dueDate && m.date <= today);
}
