import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SectionCard } from "../components/SectionCard";
import { StatChip } from "../components/StatChip";
import { Tag } from "../components/Tag";
import { colors } from "../theme";
import { Machine, WorkoutEntry } from "../types";

type MachineDetailEntry = WorkoutEntry & {
  workoutDate: string;
  workoutFocus: string;
  machine?: Machine;
};

type MachineDetailScreenProps = {
  machine: Machine;
  entries: MachineDetailEntry[];
  onBack: () => void;
};

export function MachineDetailScreen({
  machine,
  entries,
  onBack
}: MachineDetailScreenProps) {
  const latestEntry = entries[0];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backLabel}>Spat na stroje</Text>
      </Pressable>

      <View style={styles.hero}>
        <Text style={styles.title}>{machine.modelName}</Text>
        <Text style={styles.subtitle}>
          {machine.brand} • {machine.category}
        </Text>
        <View style={styles.row}>
          <Tag label={machine.muscleGroup} />
        </View>
      </View>

      <SectionCard
        title="Posledny vykon"
        subtitle="Pri fotke stroja sa prave tento blok ukaze ako prvy."
      >
        {latestEntry ? (
          <>
            <View style={styles.statsRow}>
              <StatChip label="Vaha" value={`${latestEntry.weightKg} kg`} />
              <StatChip label="Serie x op." value={`${latestEntry.sets} x ${latestEntry.reps}`} />
            </View>
            <Text style={styles.dateLabel}>
              Naposledy: {new Date(latestEntry.completedAt).toLocaleString("sk-SK")}
            </Text>
            <Text style={styles.note}>{latestEntry.note ?? "Bez poznamky."}</Text>
          </>
        ) : (
          <Text style={styles.note}>Na tomto stroji este nie je ziadny zapis.</Text>
        )}
      </SectionCard>

      <SectionCard title="Historia" subtitle="Chronologicky prehlad vsetkych zaznamov na tomto stroji.">
        <View style={styles.timeline}>
          {entries.map((entry) => (
            <View key={entry.id} style={styles.timelineItem}>
              <Text style={styles.timelineDate}>
                {new Date(entry.completedAt).toLocaleString("sk-SK")}
              </Text>
              <Text style={styles.timelineText}>
                {entry.weightKg} kg • {entry.sets} serie • {entry.reps} opakovani
              </Text>
              {entry.note ? <Text style={styles.timelineText}>{entry.note}</Text> : null}
            </View>
          ))}
        </View>
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 32
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: "#f3e4ca",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999
  },
  backLabel: {
    color: colors.accentDeep,
    fontWeight: "700"
  },
  hero: {
    gap: 8
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: colors.text
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted
  },
  row: {
    flexDirection: "row"
  },
  statsRow: {
    flexDirection: "row",
    gap: 10
  },
  dateLabel: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textMuted
  },
  note: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text
  },
  timeline: {
    gap: 12
  },
  timelineItem: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    paddingLeft: 12,
    gap: 4
  },
  timelineDate: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text
  },
  timelineText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted
  }
});
