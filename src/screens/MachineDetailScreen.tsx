import React from "react";
import {
  Image,
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
import { Tag } from "../components/Tag";
import { AppColors, useTheme } from "../theme";
import { Machine, WorkoutEntry, WorkoutFeeling } from "../types";
import { triggerSuccessHaptic, triggerTapHaptic } from "../utils/haptics";
import { getMachineImage } from "../utils/machineImages";
import {
  getEntryProgressionAdvice,
  getPlannedProgressionAdvice,
  getTrendProgressionAdvice,
  ProgressionAdviceLevel
} from "../utils/progressionAdvice";
import { getMachineTrainingGuidance } from "../utils/trainerPlanner";

type MachineDetailEntry = WorkoutEntry & {
  workoutDate: string;
  workoutFocus: string;
  machine?: Machine;
};

type MachineDetailScreenProps = {
  machine: Machine;
  entries: MachineDetailEntry[];
  onBack: () => void;
  onBackToPlan?: () => void;
  onSaveEntry: (input: {
    machineId: string;
    weightKg?: number;
    sets?: number;
    reps?: number;
    durationMin?: number;
    speedKph?: number;
    inclinePercent?: number;
    feeling?: WorkoutFeeling;
    note: string;
  }) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

const feelingOptions: Array<{ value: WorkoutFeeling; label: string }> = [
  { value: "lahke", label: "lahke" },
  { value: "akurat", label: "akurat" },
  { value: "tazke", label: "tazke" },
  { value: "bolest", label: "bolest" }
];

export function MachineDetailScreen({
  machine,
  entries,
  isFavorite,
  onBack,
  onBackToPlan,
  onSaveEntry,
  onToggleFavorite
}: MachineDetailScreenProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const isCardio = machine.muscleGroup === "Kardio";
  const latestEntry = entries[0];
  const machineImage = getMachineImage(machine.imageAsset);
  const weightEntries = entries.filter((entry) => typeof entry.weightKg === "number");
  const cardioEntries = entries.filter((entry) => typeof entry.durationMin === "number");
  const maxWeight = weightEntries.length
    ? Math.max(...weightEntries.map((entry) => entry.weightKg ?? 0))
    : 0;
  const nowMs = Date.now();
  const monthAgoMs = nowMs - 30 * 24 * 60 * 60 * 1000;
  const monthWeightEntries = weightEntries.filter(
    (entry) => new Date(entry.completedAt).getTime() >= monthAgoMs
  );
  const monthProgress =
    monthWeightEntries.length >= 2
      ? (monthWeightEntries[0].weightKg ?? 0) -
        (monthWeightEntries[monthWeightEntries.length - 1].weightKg ?? 0)
      : 0;
  const recentWeightBars = weightEntries.slice(0, 6).reverse();
  const maxRecentWeight = recentWeightBars.length
    ? Math.max(...recentWeightBars.map((entry) => entry.weightKg ?? 0))
    : 0;
  const maxCardioSpeed = cardioEntries.length
    ? Math.max(...cardioEntries.map((entry) => entry.speedKph ?? 0))
    : 0;
  const maxCardioDuration = cardioEntries.length
    ? Math.max(...cardioEntries.map((entry) => entry.durationMin ?? 0))
    : 0;
  const trainingGuidance = getMachineTrainingGuidance(machine);
  const restText =
    trainingGuidance.recommendedRestMaxSec === 0
      ? "podla potreby"
      : `${trainingGuidance.recommendedRestMinSec}-${trainingGuidance.recommendedRestMaxSec} sek`;

  const [isImageOpen, setIsImageOpen] = React.useState(false);
  const [isRestWhyOpen, setIsRestWhyOpen] = React.useState(false);
  const [weightKg, setWeightKg] = React.useState("");
  const [sets, setSets] = React.useState("4");
  const [reps, setReps] = React.useState("10");
  const [durationMin, setDurationMin] = React.useState("20");
  const [speedKph, setSpeedKph] = React.useState("6");
  const [inclinePercent, setInclinePercent] = React.useState("0");
  const [feeling, setFeeling] = React.useState<WorkoutFeeling>("akurat");
  const [note, setNote] = React.useState("");
  const latestProgressionAdvice = !isCardio
    ? getTrendProgressionAdvice(entries, machine) ?? getEntryProgressionAdvice(latestEntry)
    : null;
  const plannedProgressionAdvice = !isCardio
    ? getPlannedProgressionAdvice({
        latestEntry,
        trendAdvice: latestProgressionAdvice,
        plannedWeightKg: Number(weightKg),
        plannedSets: Number(sets),
        plannedReps: Number(reps)
      })
    : null;

  React.useEffect(() => {
    setWeightKg(latestEntry?.weightKg ? String(latestEntry.weightKg) : "");
    setSets(latestEntry?.sets ? String(latestEntry.sets) : "4");
    setReps(latestEntry?.reps ? String(latestEntry.reps) : "10");
    setDurationMin(latestEntry?.durationMin ? String(latestEntry.durationMin) : "20");
    setSpeedKph(latestEntry?.speedKph ? String(latestEntry.speedKph) : "6");
    setInclinePercent(
      latestEntry?.inclinePercent !== undefined
        ? String(latestEntry.inclinePercent)
        : "0"
    );
    setNote(latestEntry?.note ?? "");
    setFeeling(latestEntry?.feeling ?? "akurat");
  }, [latestEntry?.id, machine.id]);

  const adjustWeight = (delta: number) => {
    triggerTapHaptic();
    const current = Number(weightKg || "0");
    const next = Math.max(0, Math.round((current + delta) * 100) / 100);
    setWeightKg(next === 0 ? "" : String(next));
  };

  const handleSave = () => {
    if (isCardio) {
      const parsedDuration = Number(durationMin);
      const parsedSpeed = Number(speedKph);
      const parsedIncline = Number(inclinePercent);

      if (!parsedDuration || parsedSpeed < 0 || parsedIncline < 0) {
        return;
      }

      onSaveEntry({
        machineId: machine.id,
        durationMin: parsedDuration,
        speedKph: parsedSpeed,
        inclinePercent: parsedIncline,
        feeling,
        note
      });

      triggerSuccessHaptic();
      return;
    }

    const parsedWeight = Number(weightKg);
    const parsedSets = Number(sets);
    const parsedReps = Number(reps);

    if (!parsedWeight || !parsedSets || !parsedReps) {
      return;
    }

    onSaveEntry({
      machineId: machine.id,
      weightKg: parsedWeight,
      sets: parsedSets,
      reps: parsedReps,
      feeling,
      note
    });

    triggerSuccessHaptic();
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.topActions}>
        <Pressable
          onPress={() => {
            triggerTapHaptic();
            onBack();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backLabel}>Spat na stroje</Text>
        </Pressable>
        {onBackToPlan ? (
          <Pressable
            onPress={() => {
              triggerTapHaptic();
              onBackToPlan();
            }}
            style={styles.planBackButton}
          >
            <Text style={styles.planBackLabel}>Spat na cviky</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => {
            triggerTapHaptic();
            onToggleFavorite();
          }}
          style={[
            styles.favoriteButton,
            isFavorite ? styles.favoriteButtonActive : null
          ]}
        >
          <Text
            style={[
              styles.favoriteButtonText,
              isFavorite ? styles.favoriteButtonTextActive : null
            ]}
          >
            {isFavorite ? "* Oblubene" : "+ Oblubene"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.title}>{machine.displayNameSk}</Text>
        <Text style={styles.subtitle}>Znacka {machine.brand}</Text>

        {machineImage ? (
          <Pressable
            onPress={() => {
              triggerTapHaptic();
              setIsImageOpen(true);
            }}
          >
            <Image source={machineImage} style={styles.machineImage} resizeMode="cover" />
            <Text style={styles.imageHint}>Klikni na fotku pre vacsi nahlad</Text>
          </Pressable>
        ) : null}

        <View style={styles.row}>
          <Tag label={machine.muscleGroup} />
        </View>
        <Text style={styles.description}>{machine.descriptionSk}</Text>
      </View>

      <SectionCard
        title="Odporucana prestavka"
        subtitle="Orientacne odporucanie pre rast svalov pri tomto stroji."
      >
        <View style={styles.restBox}>
          <View style={styles.restGrid}>
            <View>
              <Text style={styles.restLabel}>Pauza medzi seriami</Text>
              <Text style={styles.restValue}>{restText}</Text>
            </View>
            <View>
              <Text style={styles.restLabel}>Ciel</Text>
              <Text style={styles.restValue}>rast svalov</Text>
            </View>
          </View>
          <Text style={styles.restSmallText}>
            Typ cviku: {translateExerciseType(trainingGuidance.exerciseType)} - narocnost:{" "}
            {translateDifficulty(trainingGuidance.difficulty)}
          </Text>
          <Text style={styles.restSmallText}>
            Cielove opakovania: {trainingGuidance.defaultRepMin}-{trainingGuidance.defaultRepMax} |
            hlavne svaly: {trainingGuidance.primaryMuscles.join(", ")}
          </Text>
          <Text style={styles.restSmallText}>Tempo: {trainingGuidance.tempoHint}</Text>
          <Pressable
            onPress={() => {
              triggerTapHaptic();
              setIsRestWhyOpen((current) => !current);
            }}
            style={styles.restWhyButton}
          >
            <Text style={styles.restWhyLabel}>
              {isRestWhyOpen ? "Skryt vysvetlenie" : "Preco takato prestavka?"}
            </Text>
          </Pressable>
          {isRestWhyOpen ? (
            <Text style={styles.restWhyText}>{trainingGuidance.whyRest}</Text>
          ) : null}
        </View>
      </SectionCard>

      <SectionCard
        title="Posledny vykon"
        subtitle="Pri fotke stroja sa prave tento blok ukaze ako prvy."
      >
        {latestEntry ? (
          <>
            <View style={styles.statsRow}>
              {isCardio ? (
                <>
                  <StatChip label="Cas" value={`${latestEntry.durationMin ?? 0} min`} />
                  <StatChip
                    label="Rychlost"
                    value={`${latestEntry.speedKph ?? 0} km/h`}
                  />
                  <StatChip
                    label="Sklon"
                    value={`${latestEntry.inclinePercent ?? 0} %`}
                  />
                </>
              ) : (
                <>
                  <StatChip label="Vaha" value={`${latestEntry.weightKg ?? 0} kg`} />
                  <StatChip
                    label="Serie x op."
                    value={`${latestEntry.sets ?? 0} x ${latestEntry.reps ?? 0}`}
                  />
                </>
              )}
            </View>
            <Text style={styles.dateLabel}>
              Naposledy: {new Date(latestEntry.completedAt).toLocaleString("sk-SK")}
            </Text>
            {latestEntry.feeling ? (
              <Text style={styles.note}>Pocit: {translateFeeling(latestEntry.feeling)}</Text>
            ) : null}
            <Text style={styles.note}>{latestEntry.note ?? "Bez poznamky."}</Text>
            {latestProgressionAdvice ? (
              <View
                style={[
                  styles.adviceCard,
                  getAdviceCardStyle(styles, latestProgressionAdvice.level)
                ]}
              >
                <Text style={styles.adviceTitle}>{latestProgressionAdvice.title}</Text>
                <Text style={styles.adviceText}>{latestProgressionAdvice.message}</Text>
                {latestProgressionAdvice.confidenceLabel ? (
                  <Text style={styles.adviceMeta}>
                    Istota: {latestProgressionAdvice.confidenceLabel}
                    {latestProgressionAdvice.confidenceScore
                      ? ` (${latestProgressionAdvice.confidenceScore}/100)`
                      : ""}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </>
        ) : (
          <Text style={styles.note}>Na tomto stroji este nie je ziadny zapis.</Text>
        )}
      </SectionCard>

      <SectionCard
        title="Statistiky progresu"
        subtitle={
          isCardio
            ? "Zakladny prehlad pre kardio zaznamy."
            : "Zakladny prehlad vahy a poctu treningov na tomto stroji."
        }
      >
        <View style={styles.statsRow}>
          {isCardio ? (
            <>
              <StatChip label="Posledny cas" value={`${latestEntry?.durationMin ?? 0} min`} />
              <StatChip label="Najrychlejsie" value={`${maxCardioSpeed} km/h`} />
              <StatChip label="Treningy" value={String(entries.length)} />
              <StatChip label="Najdlhsi cas" value={`${maxCardioDuration} min`} />
            </>
          ) : (
            <>
              <StatChip label="Posledna vaha" value={`${latestEntry?.weightKg ?? 0} kg`} />
              <StatChip label="Najvyssia vaha" value={`${maxWeight} kg`} />
              <StatChip label="Treningy" value={String(entries.length)} />
              <StatChip
                label="Progres 30 dni"
                value={`${monthProgress >= 0 ? "+" : ""}${monthProgress} kg`}
              />
            </>
          )}
        </View>

        {!isCardio && recentWeightBars.length > 0 ? (
          <View style={styles.progressChart}>
            {recentWeightBars.map((entry) => {
              const height = maxRecentWeight
                ? Math.max(18, ((entry.weightKg ?? 0) / maxRecentWeight) * 92)
                : 18;

              return (
                <View key={entry.id} style={styles.progressBarWrap}>
                  <View style={[styles.progressBar, { height }]} />
                  <Text style={styles.progressBarLabel}>{entry.weightKg ?? 0}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Dnesny vykon"
        subtitle={
          isCardio
            ? "Pri kardiu zapisuj cas, rychlost a sklon namiesto vahy."
            : "Vahu vies prevziat z posledneho treningu alebo ju hned rucne upravit."
        }
      >
        {isCardio ? (
          <View style={styles.inlineFields}>
            <View style={styles.inlineField}>
              <Text style={styles.fieldLabel}>Cas v min</Text>
              <TextInput
                value={durationMin}
                onChangeText={setDurationMin}
                keyboardType="number-pad"
                style={styles.smallInput}
              />
            </View>
            <View style={styles.inlineField}>
              <Text style={styles.fieldLabel}>Rychlost km/h</Text>
              <TextInput
                value={speedKph}
                onChangeText={setSpeedKph}
                keyboardType="decimal-pad"
                style={styles.smallInput}
              />
            </View>
            <View style={styles.inlineField}>
              <Text style={styles.fieldLabel}>Sklon %</Text>
              <TextInput
                value={inclinePercent}
                onChangeText={setInclinePercent}
                keyboardType="decimal-pad"
                style={styles.smallInput}
              />
            </View>
          </View>
        ) : (
          <>
            {plannedProgressionAdvice ? (
              <View
                style={[
                  styles.adviceCard,
                  getAdviceCardStyle(styles, plannedProgressionAdvice.level)
                ]}
              >
            <Text style={styles.adviceTitle}>{plannedProgressionAdvice.title}</Text>
            <Text style={styles.adviceText}>{plannedProgressionAdvice.message}</Text>
            {plannedProgressionAdvice.confidenceLabel ? (
              <Text style={styles.adviceMeta}>
                Istota: {plannedProgressionAdvice.confidenceLabel}
                {plannedProgressionAdvice.confidenceScore
                  ? ` (${plannedProgressionAdvice.confidenceScore}/100)`
                  : ""}
              </Text>
            ) : null}
          </View>
        ) : null}
            <Text style={styles.fieldLabel}>Navrhovana vaha</Text>
            <View style={styles.weightAdjustRow}>
              <Pressable onPress={() => adjustWeight(-2.5)} style={styles.adjustButton}>
                <Text style={styles.adjustButtonLabel}>-2.5</Text>
              </Pressable>
              <Pressable onPress={() => adjustWeight(-1.25)} style={styles.adjustButton}>
                <Text style={styles.adjustButtonLabel}>-1.25</Text>
              </Pressable>
              <TextInput
                value={weightKg}
                onChangeText={setWeightKg}
                keyboardType="decimal-pad"
                placeholder="Zadaj kg"
                placeholderTextColor={colors.textMuted}
                style={styles.weightInput}
              />
              <Pressable onPress={() => adjustWeight(1.25)} style={styles.adjustButton}>
                <Text style={styles.adjustButtonLabel}>+1.25</Text>
              </Pressable>
              <Pressable onPress={() => adjustWeight(2.5)} style={styles.adjustButton}>
                <Text style={styles.adjustButtonLabel}>+2.5</Text>
              </Pressable>
            </View>

            <View style={styles.inlineFields}>
              <View style={styles.inlineField}>
                <Text style={styles.fieldLabel}>Serie</Text>
                <TextInput
                  value={sets}
                  onChangeText={setSets}
                  keyboardType="number-pad"
                  style={styles.smallInput}
                />
              </View>
              <View style={styles.inlineField}>
                <Text style={styles.fieldLabel}>Opakovania</Text>
                <TextInput
                  value={reps}
                  onChangeText={setReps}
                  keyboardType="number-pad"
                  style={styles.smallInput}
                />
              </View>
            </View>
          </>
        )}

        <Text style={styles.fieldLabel}>Pocit zo serie</Text>
        <View style={styles.feelingRow}>
          {feelingOptions.map((option) => {
            const isActive = feeling === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  triggerTapHaptic();
                  setFeeling(option.value);
                }}
                style={[styles.feelingButton, isActive ? styles.feelingButtonActive : null]}
              >
                <Text
                  style={[
                    styles.feelingButtonText,
                    isActive ? styles.feelingButtonTextActive : null
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Poznamka</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={
            machine.setupNoteLabel
              ? `${translateSetupLabel(machine.setupNoteLabel)}, pocit alebo uprava`
              : "Poznamka k stroju alebo vykonu"
          }
          placeholderTextColor={colors.textMuted}
          multiline
          style={styles.noteInput}
        />

        <Pressable
          onPress={() => {
            triggerTapHaptic();
            handleSave();
          }}
          style={styles.saveButton}
        >
          <Text style={styles.saveButtonLabel}>Ulozit dnesny vykon</Text>
        </Pressable>
      </SectionCard>

      <SectionCard
        title="Historia"
        subtitle="Chronologicky prehlad vsetkych zaznamov na tomto stroji."
      >
        <View style={styles.timeline}>
          {entries.map((entry) => (
            <View key={entry.id} style={styles.timelineItem}>
              <Text style={styles.timelineDate}>
                {new Date(entry.completedAt).toLocaleString("sk-SK")}
              </Text>
              <Text style={styles.timelineText}>
                {isCardio
                  ? `${entry.durationMin ?? 0} min - ${entry.speedKph ?? 0} km/h - ${entry.inclinePercent ?? 0} %`
                  : `${entry.weightKg ?? 0} kg - ${entry.sets ?? 0} serie - ${entry.reps ?? 0} opakovani`}
              </Text>
              {entry.feeling ? (
                <Text style={styles.timelineText}>
                  Pocit: {translateFeeling(entry.feeling)}
                </Text>
              ) : null}
              {entry.note ? <Text style={styles.timelineText}>{entry.note}</Text> : null}
            </View>
          ))}
        </View>
      </SectionCard>

      <Modal
        visible={isImageOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsImageOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalCloseButton}
            onPress={() => {
              triggerTapHaptic();
              setIsImageOpen(false);
            }}
          >
            <Text style={styles.modalCloseLabel}>Zavriet</Text>
          </Pressable>
          {machineImage ? (
            <Image source={machineImage} style={styles.modalImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>
    </ScrollView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 32
  },
  topActions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap"
  },
  backButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 3
  },
  backLabel: {
    color: "#fff8ee",
    fontWeight: "700"
  },
  planBackButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(47, 122, 87, 0.16)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.success
  },
  planBackLabel: {
    color: colors.success,
    fontWeight: "900"
  },
  favoriteButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.highlightSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border
  },
  favoriteButtonActive: {
    backgroundColor: colors.highlight,
    borderColor: colors.highlight
  },
  favoriteButtonText: {
    color: colors.highlight,
    fontWeight: "900"
  },
  favoriteButtonTextActive: {
    color: "#fff8ee"
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
  machineImage: {
    width: "100%",
    height: 220,
    borderRadius: 22,
    marginTop: 8
  },
  imageHint: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textMuted
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text
  },
  row: {
    flexDirection: "row"
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8
  },
  weightAdjustRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center"
  },
  adjustButton: {
    backgroundColor: colors.highlightSoft,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12
  },
  adjustButtonLabel: {
    color: colors.highlight,
    fontWeight: "800"
  },
  weightInput: {
    flexGrow: 1,
    minWidth: 110,
    backgroundColor: colors.inputSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  },
  inlineFields: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8
  },
  inlineField: {
    flex: 1
  },
  feelingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10
  },
  feelingButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.highlightSoft
  },
  feelingButtonActive: {
    backgroundColor: colors.highlight
  },
  feelingButtonText: {
    color: colors.highlight,
    fontWeight: "800"
  },
  feelingButtonTextActive: {
    color: "#fff8ee"
  },
  smallInput: {
    backgroundColor: colors.inputSurface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  },
  noteInput: {
    minHeight: 96,
    textAlignVertical: "top",
    backgroundColor: colors.inputSurface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text
  },
  saveButton: {
    marginTop: 18,
    backgroundColor: colors.highlight,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff8ee"
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap"
  },
  progressChart: {
    marginTop: 18,
    height: 128,
    borderRadius: 18,
    backgroundColor: colors.highlightSoft,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10
  },
  progressBarWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6
  },
  progressBar: {
    width: "100%",
    maxWidth: 28,
    borderRadius: 999,
    backgroundColor: colors.highlight
  },
  progressBarLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted
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
  adviceCard: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  adviceCardSuccess: {
    backgroundColor: "rgba(47, 122, 87, 0.16)",
    borderColor: colors.success
  },
  adviceCardWarning: {
    backgroundColor: "rgba(217, 108, 31, 0.18)",
    borderColor: colors.highlight
  },
  adviceCardDanger: {
    backgroundColor: "rgba(172, 44, 44, 0.18)",
    borderColor: "#c74747"
  },
  adviceCardInfo: {
    backgroundColor: colors.highlightSoft,
    borderColor: colors.border
  },
  adviceTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 5
  },
  adviceText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21
  },
  adviceMeta: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  restBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: "rgba(47, 122, 87, 0.14)",
    padding: 14,
    gap: 8
  },
  restGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap"
  },
  restLabel: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  restValue: {
    marginTop: 4,
    color: colors.text,
    fontSize: 17,
    fontWeight: "900"
  },
  restSmallText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19
  },
  restWhyButton: {
    alignSelf: "flex-start",
    marginTop: 2
  },
  restWhyLabel: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "900"
  },
  restWhyText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19
  },
  timeline: {
    gap: 12
  },
  timelineItem: {
    borderLeftWidth: 3,
    borderLeftColor: colors.highlight,
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
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    justifyContent: "center",
    paddingHorizontal: 16
  },
  modalCloseButton: {
    position: "absolute",
    top: 52,
    right: 18,
    zIndex: 2,
    backgroundColor: "#fff8ee",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  modalCloseLabel: {
    color: colors.accentDeep,
    fontWeight: "800"
  },
  modalImage: {
    width: "100%",
    height: "72%"
  }
  });
}

function translateSetupLabel(label: string) {
  if (label === "Seat height") {
    return "vyska sedadla";
  }

  if (label === "Back pad position") {
    return "poloha operadla";
  }

  if (label === "Bench position") {
    return "poloha lavicky";
  }

  if (label === "Chest pad height") {
    return "vyska hrudnej opierky";
  }

  if (label === "Foot stance") {
    return "postavenie chodidiel";
  }

  if (label === "Seat depth") {
    return "hlbka sedadla";
  }

  if (label === "Backrest angle") {
    return "uhol operadla";
  }

  if (label === "Cardio") {
    return "cas, rychlost a sklon";
  }

  if (label === "Free weights") {
    return "konkretny cvik, vaha a pocit";
  }

  return label.toLowerCase();
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

function translateExerciseType(type: string) {
  if (type === "compound") {
    return "zakladny";
  }

  if (type === "isolation") {
    return "izolovany";
  }

  if (type === "core") {
    return "brucho/stred tela";
  }

  if (type === "cardio") {
    return "kardio";
  }

  return "mobilita";
}

function translateDifficulty(difficulty: string) {
  if (difficulty === "hard") {
    return "tazsi";
  }

  if (difficulty === "easy") {
    return "lahsi";
  }

  return "stredna";
}

function getAdviceCardStyle(
  styles: ReturnType<typeof createStyles>,
  level: ProgressionAdviceLevel
) {
  if (level === "success") {
    return styles.adviceCardSuccess;
  }

  if (level === "warning") {
    return styles.adviceCardWarning;
  }

  if (level === "danger") {
    return styles.adviceCardDanger;
  }

  return styles.adviceCardInfo;
}
