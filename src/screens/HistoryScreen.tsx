import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SectionCard } from "../components/SectionCard";
import { StatChip } from "../components/StatChip";
import { AppColors, useTheme } from "../theme";
import { Machine, WorkoutFeeling, WorkoutSession } from "../types";
import { estimateSessionCalories } from "../utils/calories";
import { triggerTapHaptic } from "../utils/haptics";

type HistoryScreenProps = {
  exportValue: string;
  sessions: WorkoutSession[];
  getMachine: (machineId: string) => Machine | undefined;
  onDeleteEntry: (entryId: string) => void;
  onImportHistory: (rawValue: string) => boolean;
};

export function HistoryScreen({
  exportValue,
  sessions,
  getMachine,
  onDeleteEntry,
  onImportHistory
}: HistoryScreenProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [isExportOpen, setIsExportOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [importText, setImportText] = React.useState("");
  const [importError, setImportError] = React.useState("");
  const totalEntries = sessions.reduce(
    (count, session) => count + session.entries.length,
    0
  );
  const totalCalories = sessions.reduce(
    (sum, session) => sum + estimateSessionCalories(session, getMachine),
    0
  );
  const latestTrainingLabel = sessions[0]
    ? new Date(sessions[0].workoutDate).toLocaleDateString("sk-SK")
    : "-";
  const machineCounts = sessions.reduce<Record<string, number>>((counts, session) => {
    session.entries.forEach((entry) => {
      counts[entry.machineId] = (counts[entry.machineId] ?? 0) + 1;
    });

    return counts;
  }, {});
  const usedMachineIds = Object.keys(machineCounts);
  const mostUsedMachineId = [...usedMachineIds].sort(
    (a, b) => (machineCounts[b] ?? 0) - (machineCounts[a] ?? 0)
  )[0];
  const mostUsedMachine = mostUsedMachineId ? getMachine(mostUsedMachineId) : undefined;
  const groupCounts = sessions.reduce<Record<string, number>>((counts, session) => {
    session.entries.forEach((entry) => {
      const group = getMachine(entry.machineId)?.muscleGroup ?? "Ine";
      counts[group] = (counts[group] ?? 0) + 1;
    });

    return counts;
  }, {});
  const maxGroupCount = Math.max(1, ...Object.values(groupCounts));
  const groupRows = Object.entries(groupCounts).sort((a, b) => b[1] - a[1]);
  const progressRows = usedMachineIds
    .map((machineId) => {
      const weightedEntries = sessions
        .flatMap((session) => session.entries)
        .filter((entry) => entry.machineId === machineId && typeof entry.weightKg === "number")
        .sort(
          (a, b) =>
            new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
        );

      if (weightedEntries.length < 2) {
        return null;
      }

      const first = weightedEntries[0].weightKg ?? 0;
      const latest = weightedEntries[weightedEntries.length - 1].weightKg ?? 0;

      return {
        machineId,
        name: getMachine(machineId)?.displayNameSk ?? machineId,
        delta: latest - first
      };
    })
    .filter(
      (row): row is { machineId: string; name: string; delta: number } => row !== null
    )
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5) as Array<{ machineId: string; name: string; delta: number }>;
  const maxProgressDelta = Math.max(
    1,
    ...progressRows.map((row) => Math.abs(row.delta))
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Historia treningov</Text>
      <Text style={styles.subtitle}>
        Prehlad po jednotlivych dnoch. Neskor sem vieme pridat filtre, grafy a export.
      </Text>

      <View style={styles.overviewGrid}>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Treningy</Text>
          <Text style={styles.overviewValue}>{sessions.length}</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Zapisy</Text>
          <Text style={styles.overviewValue}>{totalEntries}</Text>
        </View>
        <View style={styles.overviewCard}>
          <Text style={styles.overviewLabel}>Kcal</Text>
          <Text style={styles.overviewValue}>~{totalCalories}</Text>
        </View>
      </View>

      <View style={styles.latestCard}>
        <Text style={styles.latestLabel}>Posledny trening</Text>
        <Text style={styles.latestValue}>{latestTrainingLabel}</Text>
      </View>

      <SectionCard
        title="Celkovy progres"
        subtitle="Rychly prehlad toho, co v treningoch realne robis najcastejsie."
      >
        <View style={styles.row}>
          <StatChip label="Pouzite stroje" value={String(usedMachineIds.length)} />
          <StatChip
            label="Najcastejsi"
            value={mostUsedMachine ? mostUsedMachine.displayNameSk : "-"}
          />
        </View>
        {groupRows.length > 0 ? (
          <View style={styles.groupChart}>
            {groupRows.map(([group, count]) => (
              <View key={group} style={styles.groupRow}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupName}>{group}</Text>
                  <Text style={styles.groupCount}>{count}x</Text>
                </View>
                <View style={styles.groupTrack}>
                  <View
                    style={[
                      styles.groupFill,
                      { width: `${Math.max(8, (count / maxGroupCount) * 100)}%` }
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyChartText}>
            Este tu nie su data. Po par treningoch sa tu ukaze, co drvis najviac.
          </Text>
        )}
        {progressRows.length > 0 ? (
          <View style={styles.progressSummary}>
            <Text style={styles.progressSummaryTitle}>Top progres podla vahy</Text>
            {progressRows.map((row) => (
              <View key={row.machineId} style={styles.groupRow}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupName}>{row.name}</Text>
                  <Text
                    style={[
                      styles.groupCount,
                      row.delta >= 0 ? styles.progressPositive : styles.progressNegative
                    ]}
                  >
                    {row.delta >= 0 ? "+" : ""}
                    {row.delta} kg
                  </Text>
                </View>
                <View style={styles.groupTrack}>
                  <View
                    style={[
                      styles.groupFill,
                      row.delta < 0 ? styles.progressFillNegative : null,
                      { width: `${Math.max(8, (Math.abs(row.delta) / maxProgressDelta) * 100)}%` }
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </SectionCard>

      <View style={styles.backupRow}>
        <Pressable
          onPress={() => {
            triggerTapHaptic();
            setIsExportOpen(true);
          }}
          style={styles.backupButton}
        >
          <Text style={styles.backupButtonText}>Export historie</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            triggerTapHaptic();
            setImportError("");
            setIsImportOpen(true);
          }}
          style={styles.backupButton}
        >
          <Text style={styles.backupButtonText}>Import historie</Text>
        </Pressable>
      </View>

      {sessions.map((session) => {
        const calories = estimateSessionCalories(session, getMachine);

        return (
          <SectionCard
            key={session.id}
            title={new Date(session.workoutDate).toLocaleDateString("sk-SK")}
            subtitle={session.focus}
          >
            <View style={styles.sessionHeader}>
              <View style={styles.focusBadge}>
                <Text style={styles.focusBadgeText}>{session.focus}</Text>
              </View>
              <View style={styles.row}>
                <StatChip label="Kcal" value={`~${calories}`} />
                <StatChip label="Cviky" value={String(session.entries.length)} />
              </View>
            </View>
            <Text style={styles.summary}>{session.coachSummary}</Text>
            <View style={styles.entries}>
              {session.entries.map((entry, entryIndex) => {
                const machine = getMachine(entry.machineId);
                const isCardio = machine?.muscleGroup === "Kardio";
                const isRoutine =
                  isCardio &&
                  typeof entry.durationMin === "number" &&
                  typeof entry.speedKph !== "number";
                const primaryMeta = isCardio
                  ? `${entry.durationMin ?? 0} min`
                  : `${entry.weightKg ?? 0} kg`;
                const secondaryMeta = isRoutine
                  ? "treningova rutina"
                  : isCardio
                  ? `${entry.speedKph ?? 0} km/h - sklon ${entry.inclinePercent ?? 0} %`
                  : `${entry.sets ?? 0} serie - ${entry.reps ?? 0} opakovani`;

                return (
                  <View key={entry.id} style={styles.entry}>
                    <View style={styles.entryNumber}>
                      <Text style={styles.entryNumberText}>{entryIndex + 1}</Text>
                    </View>
                    <View style={styles.entryContent}>
                      <View style={styles.entryHeader}>
                        <Text style={styles.entryTitle}>
                          {machine?.displayNameSk ?? entry.machineId}
                        </Text>
                        <Text style={styles.entryTime}>
                          {new Date(entry.completedAt).toLocaleTimeString("sk-SK", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </Text>
                      </View>
                      <View style={styles.entryMetaRow}>
                        <View style={styles.entryPill}>
                          <Text style={styles.entryPillText}>{primaryMeta}</Text>
                        </View>
                        <View style={styles.entryPillSoft}>
                          <Text style={styles.entryPillSoftText}>{secondaryMeta}</Text>
                        </View>
                      </View>
                      {entry.feeling ? (
                        <Text style={styles.entryMeta}>
                          Pocit: {translateFeeling(entry.feeling)}
                        </Text>
                      ) : null}
                      {entry.note ? <Text style={styles.entryNote}>{entry.note}</Text> : null}
                      <Pressable
                        onPress={() => {
                          triggerTapHaptic();
                          onDeleteEntry(entry.id);
                        }}
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteButtonText}>Zmazat zapis</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </SectionCard>
        );
      })}

      <Modal
        visible={isExportOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsExportOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Export historie</Text>
            <Text style={styles.modalSubtitle}>
              Skopiruj tento text a uloz si ho mimo appky.
            </Text>
            <TextInput
              value={exportValue}
              multiline
              selectTextOnFocus
              style={styles.backupInput}
            />
            <Pressable
              onPress={() => setIsExportOpen(false)}
              style={[styles.modalButton, styles.modalButtonSolo]}
            >
              <Text style={styles.modalButtonText}>Zavriet</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isImportOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsImportOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Import historie</Text>
            <Text style={styles.modalSubtitle}>
              Vloz sem predtym ulozeny export. Aktualna historia sa prepise.
            </Text>
            <TextInput
              value={importText}
              onChangeText={(value) => {
                setImportText(value);
                setImportError("");
              }}
              multiline
              placeholder="Sem vloz JSON export historie"
              placeholderTextColor={colors.textMuted}
              style={styles.backupInput}
            />
            {importError ? <Text style={styles.importError}>{importError}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setIsImportOpen(false)}
                style={styles.modalButtonSecondary}
              >
                <Text style={styles.modalButtonSecondaryText}>Zrusit</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!importText.trim()) {
                    setImportError("Najprv vloz export historie.");
                    return;
                  }

                  const wasImported = onImportHistory(importText);

                  if (wasImported) {
                    setImportText("");
                    setIsImportOpen(false);
                    return;
                  }

                  setImportError("Import sa nepodaril. Skontroluj, ci je vlozeny cely text.");
                }}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Importovat</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
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
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap"
  },
  overviewGrid: {
    flexDirection: "row",
    gap: 10
  },
  overviewCard: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 18,
    padding: 14
  },
  overviewLabel: {
    color: colors.page,
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.82
  },
  overviewValue: {
    marginTop: 6,
    color: colors.page,
    fontSize: 22,
    fontWeight: "900"
  },
  latestCard: {
    backgroundColor: colors.highlightSoft,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  latestLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  latestValue: {
    marginTop: 4,
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  backupRow: {
    flexDirection: "row",
    gap: 10
  },
  backupButton: {
    flex: 1,
    backgroundColor: colors.surfaceStrong,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: "center"
  },
  backupButtonText: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 13
  },
  groupChart: {
    marginTop: 16,
    gap: 12
  },
  groupRow: {
    gap: 6
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  groupName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  groupCount: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "800"
  },
  groupTrack: {
    height: 12,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: colors.accentSoft
  },
  groupFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.highlight
  },
  emptyChartText: {
    marginTop: 12,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21
  },
  progressSummary: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
    gap: 12
  },
  progressSummaryTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  progressPositive: {
    color: colors.success
  },
  progressNegative: {
    color: colors.highlight
  },
  progressFillNegative: {
    backgroundColor: colors.highlight
  },
  sessionHeader: {
    gap: 12
  },
  focusBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.highlight,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  focusBadgeText: {
    color: "#fff8ee",
    fontSize: 12,
    fontWeight: "900"
  },
  summary: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 22,
    color: colors.text
  },
  entries: {
    marginTop: 14,
    gap: 12
  },
  entry: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.accentSoft,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  entryNumber: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.highlight
  },
  entryNumberText: {
    color: "#fff8ee",
    fontWeight: "900"
  },
  entryContent: {
    flex: 1
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  entryTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text
  },
  entryTime: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textMuted
  },
  entryMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10
  },
  entryPill: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7
  },
  entryPillText: {
    color: colors.page,
    fontSize: 12,
    fontWeight: "900"
  },
  entryPillSoft: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border
  },
  entryPillSoftText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800"
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
  },
  deleteButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: colors.highlightSoft,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  deleteButtonText: {
    color: colors.highlight,
    fontWeight: "800"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.62)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18
  },
  modalCard: {
    width: "100%",
    maxHeight: "86%",
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text
  },
  modalSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted
  },
  backupInput: {
    marginTop: 14,
    minHeight: 240,
    maxHeight: 360,
    textAlignVertical: "top",
    backgroundColor: colors.inputSurface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 12,
    lineHeight: 18
  },
  importError: {
    marginTop: 10,
    color: colors.highlight,
    fontSize: 13,
    fontWeight: "800"
  },
  modalActions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10
  },
  modalButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.highlight,
    borderRadius: 16,
    paddingVertical: 13
  },
  modalButtonText: {
    color: "#fff8ee",
    fontWeight: "900"
  },
  modalButtonSolo: {
    marginTop: 14
  },
  modalButtonSecondary: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 13
  },
  modalButtonSecondaryText: {
    color: colors.text,
    fontWeight: "900"
  }
  });
}

function translateFeeling(feeling: WorkoutFeeling) {
  if (feeling === "lahke") {
    return "lahke";
  }

  if (feeling === "akurat") {
    return "akurat";
  }

  if (feeling === "tazke") {
    return "tazke";
  }

  return "bolest";
}
