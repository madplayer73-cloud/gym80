import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Machine, WorkoutSession } from "../types";
import { buildDailySuggestion } from "../utils/trainingPlan";
import { colors } from "../theme";
import { SectionCard } from "../components/SectionCard";
import { StatChip } from "../components/StatChip";
import { Tag } from "../components/Tag";

type HomeScreenProps = {
  machines: Machine[];
  sessions: WorkoutSession[];
  onOpenMachine: (machine: Machine) => void;
};

export function HomeScreen({
  machines,
  sessions,
  onOpenMachine
}: HomeScreenProps) {
  const suggestion = buildDailySuggestion(sessions, machines);
  const lastSession = sessions[0];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Gym80 Tracker</Text>
        <Text style={styles.title}>Tvoj dalsi trening bez hladania v poznamkach.</Text>
        <Text style={styles.subtitle}>
          Fotka stroja, posledna vaha, nastavenie sedadla a AI navrh dna na jednom mieste.
        </Text>
      </View>

      <SectionCard title={suggestion.title} subtitle={suggestion.explanation}>
        <View style={styles.row}>
          <StatChip
            label="Posledny fokus"
            value={lastSession ? lastSession.focus : "Ziadny"}
          />
          <StatChip label="Dalsi fokus" value={suggestion.focus} />
        </View>
        <View style={styles.machineStack}>
          {suggestion.highlightedMachines.slice(0, 3).map((machine) => (
            <Pressable
              key={machine.id}
              onPress={() => onOpenMachine(machine)}
              style={styles.machineCard}
            >
              <View style={styles.machineArt}>
                <Text style={styles.machineArtText}>{machine.imageHint}</Text>
              </View>
              <View style={styles.machineMeta}>
                <Tag label={machine.muscleGroup} />
                <Text style={styles.machineName}>{machine.modelName}</Text>
                <Text style={styles.machineCategory}>{machine.category}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        title="AI poznamka"
        subtitle="Prva verzia vyhodnocuje historiu jednoducho. Neskor sem vieme dopojit plnu AI konzultaciu."
      >
        <Text style={styles.aiNote}>
          {lastSession
            ? lastSession.coachSummary
            : "Po prvom treningu tu appka zobrazi suhrn zataze a navrh dalsieho dna."}
        </Text>
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
  hero: {
    paddingTop: 12,
    gap: 8
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: colors.accentDeep,
    fontWeight: "700",
    fontSize: 12
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    color: colors.text
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
    maxWidth: 340
  },
  row: {
    flexDirection: "row",
    gap: 10
  },
  machineStack: {
    marginTop: 16,
    gap: 12
  },
  machineCard: {
    backgroundColor: "#fff4de",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ead1a8"
  },
  machineArt: {
    padding: 18,
    minHeight: 88,
    justifyContent: "flex-end",
    backgroundColor: colors.surfaceStrong
  },
  machineArtText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.accentDeep,
    fontWeight: "600"
  },
  machineMeta: {
    padding: 16,
    gap: 8
  },
  machineName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  },
  machineCategory: {
    fontSize: 14,
    color: colors.textMuted
  },
  aiNote: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.text
  }
});
