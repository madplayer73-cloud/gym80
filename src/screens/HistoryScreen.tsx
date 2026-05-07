import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SectionCard } from "../components/SectionCard";
import { colors } from "../theme";
import { Machine, WorkoutSession } from "../types";

type HistoryScreenProps = {
  sessions: WorkoutSession[];
  getMachine: (machineId: string) => Machine | undefined;
};

export function HistoryScreen({ sessions, getMachine }: HistoryScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Historia treningov</Text>
      <Text style={styles.subtitle}>
        Prehlad po jednotlivych dnoch. Neskor sem vieme pridat filtre, grafy a export.
      </Text>

      {sessions.map((session) => (
        <SectionCard
          key={session.id}
          title={new Date(session.workoutDate).toLocaleDateString("sk-SK")}
          subtitle={session.focus}
        >
          <Text style={styles.summary}>{session.coachSummary}</Text>
          <View style={styles.entries}>
            {session.entries.map((entry) => {
              const machine = getMachine(entry.machineId);

              return (
                <View key={entry.id} style={styles.entry}>
                  <Text style={styles.entryTitle}>
                    {machine?.modelName ?? entry.machineId}
                  </Text>
                  <Text style={styles.entryMeta}>
                    {entry.weightKg} kg • {entry.sets} serie • {entry.reps} opakovani
                  </Text>
                  {entry.note ? <Text style={styles.entryNote}>{entry.note}</Text> : null}
                </View>
              );
            })}
          </View>
        </SectionCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 32
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted
  },
  summary: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.text
  },
  entries: {
    marginTop: 14,
    gap: 12
  },
  entry: {
    backgroundColor: "#fff4de",
    borderRadius: 18,
    padding: 14
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text
  },
  entryMeta: {
    marginTop: 4,
    fontSize: 14,
    color: colors.textMuted
  },
  entryNote: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text
  }
});
