import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SectionCard } from "../components/SectionCard";
import { Tag } from "../components/Tag";
import { colors } from "../theme";
import { Machine } from "../types";

type MachinesScreenProps = {
  machines: Machine[];
  onOpenMachine: (machine: Machine) => void;
};

export function MachinesScreen({
  machines,
  onOpenMachine
}: MachinesScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Stroje v databaze</Text>
      <Text style={styles.subtitle}>
        Toto je zaklad pre neskorsie rozpoznavanie z fotky. Kazdy stroj uz ma svoju historiu a poznamky.
      </Text>

      {machines.map((machine) => (
        <Pressable key={machine.id} onPress={() => onOpenMachine(machine)}>
          <SectionCard
            title={machine.modelName}
            subtitle={`${machine.brand} • ${machine.category}`}
          >
            <View style={styles.row}>
              <Tag label={machine.muscleGroup} />
            </View>
            <Text style={styles.hintLabel}>Vizualny hint pre foto-match</Text>
            <Text style={styles.hintValue}>{machine.imageHint}</Text>
            {machine.setupNoteLabel ? (
              <>
                <Text style={styles.hintLabel}>Poznamka k nastaveniu</Text>
                <Text style={styles.hintValue}>{machine.setupNoteLabel}</Text>
              </>
            ) : null}
          </SectionCard>
        </Pressable>
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
  row: {
    flexDirection: "row"
  },
  hintLabel: {
    marginTop: 14,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.textMuted
  },
  hintValue: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 21,
    color: colors.text
  }
});
