import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme";
import { WorkoutSession } from "../types";
import { formatWorkoutTime, getWorkoutElapsed, WorkoutClock } from "../utils/workoutClock";

export function WorkoutClockBar({ clock, onChangePhase, onFinish }: {
  clock: WorkoutClock;
  onChangePhase: (phase: "running" | "paused") => void;
  onFinish: (feedback: NonNullable<WorkoutSession["workoutFeedback"]>) => void;
}) {
  const { colors } = useTheme();
  const [now, setNow] = React.useState(Date.now());
  const [showFinish, setShowFinish] = React.useState(false);
  React.useEffect(() => {
    setNow(Date.now());
    if (clock.phase !== "running") return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [clock]);
  const textStyle = { color: colors.text };
  const running = clock.phase === "running";
  return (
    <>
      <View style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.timeBlock}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Bez rozcvicky{clock.phase === "paused" ? " · pauza" : ""}</Text>
          <Text accessibilityLabel="Cas treningu bez rozcvicky" style={[styles.time, textStyle]}>{formatWorkoutTime(getWorkoutElapsed(clock, now))}</Text>
        </View>
        {clock.phase !== "finished" ? (
          <>
            <Pressable accessibilityRole="button" onPress={() => onChangePhase(running ? "paused" : "running")}
              style={[styles.action, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.actionText, textStyle]}>{running ? "Pauza" : clock.phase === "warmup" ? "Zacat bez rozcvicky" : "Pokracovat"}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setShowFinish(true)} style={styles.action}>
              <Text style={[styles.actionText, { color: colors.highlight }]}>Ukoncit</Text>
            </Pressable>
          </>
        ) : <Text style={[styles.actionText, { color: colors.success }]}>Dokoncene</Text>}
      </View>
      <Modal visible={showFinish} transparent animationType="fade" onRequestClose={() => setShowFinish(false)}>
        <View style={styles.overlay}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.title, textStyle]}>Ako sa ti dnes cvicilo?</Text>
            <Text style={[styles.description, { color: colors.textMuted }]}>Ukoncis casovac. Cisty cas zahrna pauzy medzi seriami, nie rozcvicku ani rucne pozastavenie. Hodnotenie pomoze dalsiemu navrhu; neulozene serie sa automaticky nezapisu.</Text>
            {([
              ["lahky", "Lahky"], ["akurat", "Akurat"], ["prilis_tazky", "Prilis tazky"]
            ] as const).map(([value, label]) => (
              <Pressable key={value} accessibilityRole="button" onPress={() => { onFinish(value); setShowFinish(false); }}
                style={[styles.feedback, { backgroundColor: colors.accentSoft }]}>
                <Text style={[styles.actionText, textStyle]}>{label}</Text>
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" onPress={() => setShowFinish(false)} style={styles.action}>
              <Text style={[styles.actionText, { color: colors.textMuted }]}>Este cvicim</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1 },
  timeBlock: { flex: 1, minWidth: 88 },
  label: { fontSize: 11 },
  time: { fontSize: 22, lineHeight: 26, fontWeight: "700", fontVariant: ["tabular-nums"] },
  action: { paddingHorizontal: 10, minHeight: 44, justifyContent: "center", borderRadius: 12, maxWidth: 142 },
  actionText: { fontSize: 13, fontWeight: "700" },
  overlay: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "rgba(0,0,0,0.5)" },
  card: { width: "100%", maxWidth: 420, padding: 22, borderWidth: 1, borderRadius: 22, gap: 12 },
  title: { fontSize: 22, fontWeight: "700" },
  description: { fontSize: 14, lineHeight: 21 },
  feedback: { minHeight: 48, padding: 14, borderRadius: 12 }
});
