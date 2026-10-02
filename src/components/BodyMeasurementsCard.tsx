import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { BodyMeasurement } from "../types";
import { useTheme } from "../theme";

export function BodyMeasurementsCard({ measurements, onSave }: { measurements: BodyMeasurement[]; onSave: (entry: BodyMeasurement) => void }) {
  const { colors } = useTheme();
  const [weight, setWeight] = React.useState("");
  const [waist, setWaist] = React.useState("");
  const [date, setDate] = React.useState(() => new Date().toLocaleDateString("sv-SE"));
  const [message, setMessage] = React.useState("");
  const rows = [...measurements].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  const min = rows.length ? Math.floor(Math.min(...rows.map((item) => item.weightKg))) - 1 : 0;
  const max = rows.length ? Math.ceil(Math.max(...rows.map((item) => item.weightKg))) + 1 : 1;
  const save = () => {
    const kg = Number(weight.replace(",", ".")), cm = waist.trim() ? Number(waist.replace(",", ".")) : undefined;
    const parsedDate = new Date(`${date}T12:00:00`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsedDate.getTime()) || parsedDate.toLocaleDateString("sv-SE") !== date || date > new Date().toLocaleDateString("sv-SE") || !Number.isFinite(kg) || kg <= 0 || kg > 500 || (cm !== undefined && (!Number.isFinite(cm) || cm <= 0 || cm > 300))) {
      setMessage("Skontroluj datum, hmotnost v kg a volitelny pas v cm."); return;
    }
    onSave({ id: `body-${date}`, date, weightKg: kg, waistCm: cm });
    setWeight(""); setWaist(""); setMessage("Meranie ulozene. Opakovany zapis na rovnaky datum aktualizuje hodnotu.");
  };
  return <View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 16, gap: 10 }}>
    <Text style={{ color: colors.text, fontSize: 20, fontWeight: "700" }}>Moja telesna hmotnost</Text>
    <Text style={{ color: colors.textMuted }}>Sleduj zmenu v case. Pas je volitelny. Kalorie pouziju hmotnost platnu pre datum treningu, nie pevnych 70 kg.</Text>
    {([["Datum (RRRR-MM-DD)", date, setDate], ["Hmotnost v kg", weight, setWeight], ["Obvod pasa v cm (volitelny)", waist, setWaist]] as const).map(([label, value, setter]) => <View key={label}>
      <Text style={{ color: colors.textMuted }}>{label}</Text>
      <TextInput accessibilityLabel={label} value={value} onChangeText={setter} keyboardType={label.startsWith("Datum") ? "default" : "decimal-pad"} style={{ backgroundColor: colors.inputSurface, color: colors.text, padding: 12, borderRadius: 10 }} />
    </View>)}
    <Pressable accessibilityRole="button" onPress={save}><Text style={{ color: colors.highlight, fontWeight: "700", paddingVertical: 12 }}>Ulozit meranie</Text></Pressable>
    {message ? <Text accessibilityRole="alert" style={{ color: colors.textMuted }}>{message}</Text> : null}
    {rows.length ? <Text style={{ color: colors.textMuted }}>Poslednych {rows.length} merani · rozsah grafu {min}–{max} kg (nie od nuly)</Text> : null}
    {rows.slice().reverse().map((item) => <View key={item.id} style={{ gap: 4 }}>
      <Text style={{ color: colors.text }}>{item.date}: {item.weightKg} kg{item.waistCm ? ` · pas ${item.waistCm} cm` : ""}</Text>
      <View style={{ height: 6, backgroundColor: colors.accentSoft, borderRadius: 4 }}><View style={{ height: 6, borderRadius: 4, backgroundColor: colors.highlight, width: `${Math.max(8, (item.weightKg - min) / (max - min || 1) * 100)}%` }} /></View>
    </View>)}
    {!rows.length ? <Text style={{ color: colors.textMuted }}>Zatial bez merani.</Text> : null}
  </View>;
}
