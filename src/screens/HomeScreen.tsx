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
import { AppColors, useTheme } from "../theme";
import { Machine, WorkoutSession } from "../types";
import { estimateSessionCalories } from "../utils/calories";
import { triggerTapHaptic } from "../utils/haptics";
import { generateTrainerPlan, PlannedExercise } from "../utils/trainerPlanner";
import { buildDailySuggestion } from "../utils/trainingPlan";

type HomeScreenProps = {
  machines: Machine[];
  sessions: WorkoutSession[];
  onOpenMachine: (machine: Machine) => void;
};

const durationOptions = [60, 90, 120];
const warmupOptions = [5, 8, 10, 15];
const cooldownOptions = [3, 5, 8, 10];

export function HomeScreen({
  machines,
  sessions,
  onOpenMachine
}: HomeScreenProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [durationMin, setDurationMin] = React.useState(60);
  const [warmupMin, setWarmupMin] = React.useState(8);
  const [cooldownMin, setCooldownMin] = React.useState(5);
  const suggestion = buildDailySuggestion(
    sessions,
    machines,
    durationMin,
    warmupMin,
    cooldownMin
  );
  const trainerPlan = generateTrainerPlan({
    sessions,
    machines,
    targetDurationMinutes: durationMin,
    warmupMin,
    cooldownMin,
    preferredFocus: suggestion.focus
  });
  const lastSession = sessions[0];
  const [expandedWhyId, setExpandedWhyId] = React.useState<string | null>(null);
  const machineMap = React.useMemo(
    () => new Map(machines.map((machine) => [machine.id, machine])),
    [machines]
  );
  const lastSessionCalories = lastSession
    ? estimateSessionCalories(lastSession, (machineId) => machineMap.get(machineId))
    : null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>AI trener</Text>
        <Text style={styles.title}>Dnesny navrh treningu</Text>
        <Text style={styles.subtitle}>
          Ciel: nabrat svaly, 3 az 4 treningy tyzdenne, s ohladom na kolena.
        </Text>
      </View>

      <SectionCard
        title="Kolko mas dnes casu?"
        subtitle="Zadas celkovy cas, rozcvicku a schladenie. Trener zvysok rozdeli na cviky."
      >
        <Text style={styles.optionLabel}>Cely trening</Text>
        <View style={styles.durationRow}>
          {durationOptions.map((option) => {
            const isActive = option === durationMin;

            return (
              <Pressable
                key={option}
                onPress={() => {
                  triggerTapHaptic();
                  setDurationMin(option);
                }}
                style={[styles.durationButton, isActive ? styles.durationButtonActive : null]}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    isActive ? styles.durationButtonTextActive : null
                  ]}
                >
                  {option} min
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.optionLabel}>Rozcvicka</Text>
        <View style={styles.durationRow}>
          {warmupOptions.map((option) => {
            const isActive = option === warmupMin;

            return (
              <Pressable
                key={option}
                onPress={() => {
                  triggerTapHaptic();
                  setWarmupMin(option);
                }}
                style={[styles.durationButtonSmall, isActive ? styles.durationButtonActive : null]}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    isActive ? styles.durationButtonTextActive : null
                  ]}
                >
                  {option} min
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.optionLabel}>Schladenie</Text>
        <View style={styles.durationRow}>
          {cooldownOptions.map((option) => {
            const isActive = option === cooldownMin;

            return (
              <Pressable
                key={option}
                onPress={() => {
                  triggerTapHaptic();
                  setCooldownMin(option);
                }}
                style={[styles.durationButtonSmall, isActive ? styles.durationButtonActive : null]}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    isActive ? styles.durationButtonTextActive : null
                  ]}
                >
                  {option} min
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SectionCard>

      <SectionCard title={suggestion.title} subtitle={suggestion.explanation}>
        <View style={styles.row}>
          <StatChip label="Cas" value={`${suggestion.durationMin} min`} />
          <StatChip label="Rozcvicka" value={`${suggestion.warmupMin} min`} />
          <StatChip label="Plan" value={`${trainerPlan.estimatedDurationMinutes} min`} />
          <StatChip label="Cviky" value={String(trainerPlan.exercises.length)} />
          <StatChip label="Schladenie" value={`${suggestion.cooldownMin} min`} />
          <StatChip label="Kcal" value={`~${suggestion.estimatedCalories}`} />
        </View>
        <View style={styles.dataPill}>
          <Text style={styles.dataPillText}>
            {suggestion.dataConfidence === "podla historie"
              ? "Navrh podla tvojej historie"
              : suggestion.dataConfidence === "ucim sa"
                ? "Ucim sa z tvojich zapisov"
                : "Startovaci navrh"}
          </Text>
        </View>
        <Text style={styles.coachNote}>{suggestion.coachNote}</Text>
        <Text style={styles.strategyText}>Strategia: {trainerPlan.strategy}</Text>
      </SectionCard>

      <SectionCard
        title="Co viem z historie"
        subtitle="Toto je zaklad, z ktoreho trener sklada navrh."
      >
        <View style={styles.row}>
          <StatChip label="Priemer" value={`${trainerPlan.stats.averageWorkoutDurationMin} min`} />
          <StatChip label="Cviky/trening" value={String(trainerPlan.stats.averageExercisesPerWorkout)} />
          <StatChip label="Cviky/60 min" value={String(trainerPlan.stats.exercisesPer60Min)} />
        </View>
        <Text style={styles.tipText}>
          Najcastejsia kombinacia: {trainerPlan.stats.commonMuscleGroupCombination}
        </Text>
        <Text style={styles.tipText}>
          Casto pouzivane: {trainerPlan.stats.frequentMachines.length} | Obcas:
          {" "}{trainerPlan.stats.occasionalMachines.length} | Este nepouzite:
          {" "}{trainerPlan.stats.neverUsedMachines.length}
        </Text>
      </SectionCard>

      <SectionCard
        title="Rozcvicka"
        subtitle="Prvych par minut priprav telo, potom chod na cviky."
      >
        <View style={styles.tipStack}>
          {suggestion.warmup.map((item) => (
            <Text key={item} style={styles.tipText}>
              - {item}
            </Text>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        title="Cviky na dnes"
        subtitle="Poradie nie je nahodne. Trener strieda zataz, partie a prida aj nieco nove."
      >
        <View style={styles.machineStack}>
          {trainerPlan.exercises.map((exercise) => (
            <Pressable
              key={exercise.machine.id}
              onPress={() => {
                triggerTapHaptic();
                onOpenMachine(exercise.machine);
              }}
              style={styles.machineCard}
            >
              <View style={styles.machineMeta}>
                <View style={styles.exerciseTopRow}>
                  <Tag label={`${exercise.order}. ${exercise.muscleGroup}`} />
                  {exercise.isDiscovery ? (
                    <Text style={styles.discoveryLabel}>novy impulz</Text>
                  ) : null}
                </View>
                <Text style={styles.machineName}>{exercise.machine.displayNameSk}</Text>
                <Text style={styles.machineCategory}>{exercise.machine.descriptionSk}</Text>
                <ExerciseRestBlock
                  exercise={exercise}
                  expandedWhyId={expandedWhyId}
                  onToggleWhy={() => {
                    triggerTapHaptic();
                    setExpandedWhyId((current) =>
                      current === exercise.machine.id ? null : exercise.machine.id
                    );
                  }}
                  styles={styles}
                />
              </View>
            </Pressable>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        title="Doplnky"
        subtitle="Ked ostane cas, pridaj kratke brucho alebo jeden lahsi cvik na nohy."
      >
        <Text style={styles.tipText}>
          - Brucho: 1 az 2 cviky, kontrolovane tempo, 2 az 3 serie.
        </Text>
        <Text style={styles.tipText}>
          - Nohy: pri kolenach len lahsi stroj, bez bolesti a bez nahanania maxima.
        </Text>
      </SectionCard>

      <SectionCard
        title="Schladenie"
        subtitle="Kratky koniec po treningu."
      >
        <View style={styles.tipStack}>
          {suggestion.cooldown.map((item) => (
            <Text key={item} style={styles.tipText}>
              - {item}
            </Text>
          ))}
        </View>
      </SectionCard>

      <SectionCard
        title="Posledny trening"
        subtitle="Orientacny prehlad posledneho ulozeneho dna."
      >
        {lastSession ? (
          <>
            <View style={styles.row}>
              <StatChip
                label="Datum"
                value={new Date(lastSession.workoutDate).toLocaleDateString("sk-SK")}
              />
              <StatChip label="Fokus" value={lastSession.focus} />
              <StatChip label="Kcal" value={`~${lastSessionCalories ?? 0}`} />
            </View>
            <Text style={styles.lastSessionSummary}>{lastSession.coachSummary}</Text>
          </>
        ) : (
          <Text style={styles.tipText}>Zatial tu nie je ziadny trening.</Text>
        )}
      </SectionCard>
    </ScrollView>
  );
}

function ExerciseRestBlock({
  exercise,
  expandedWhyId,
  onToggleWhy,
  styles
}: {
  exercise: PlannedExercise;
  expandedWhyId: string | null;
  onToggleWhy: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const isWhyOpen = expandedWhyId === exercise.machine.id;
  const restText =
    exercise.recommendedRestMaxSec === 0
      ? "podla potreby"
      : `${exercise.recommendedRestMinSec}-${exercise.recommendedRestMaxSec} sek`;

  return (
    <View style={styles.restBox}>
      <View style={styles.restGrid}>
        <View>
          <Text style={styles.restLabel}>Odporucana prestavka</Text>
          <Text style={styles.restValue}>{restText}</Text>
        </View>
        <View>
          <Text style={styles.restLabel}>Serie</Text>
          <Text style={styles.restValue}>{exercise.sets} x {exercise.reps}</Text>
        </View>
      </View>
      {exercise.userAverageRestSec ? (
        <Text style={styles.restSmallText}>
          Tvoja priemerna prestavka: {exercise.userAverageRestSec} sek
        </Text>
      ) : null}
      <Text style={styles.restSmallText}>Ciel: rast svalov</Text>
      {exercise.note ? <Text style={styles.restNote}>{exercise.note}</Text> : null}
      <Pressable onPress={onToggleWhy} style={styles.restWhyButton}>
        <Text style={styles.restWhyLabel}>
          {isWhyOpen ? "Skryt vysvetlenie" : "Preco takato prestavka?"}
        </Text>
      </Pressable>
      {isWhyOpen ? <Text style={styles.restWhyText}>{exercise.whyRest}</Text> : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 32
  },
  header: {
    paddingTop: 12,
    gap: 8
  },
  eyebrow: {
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: colors.highlight,
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
    maxWidth: 360
  },
  durationRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 12
  },
  optionLabel: {
    marginBottom: 8,
    color: colors.textMuted,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 11
  },
  durationButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: colors.chipSurface
  },
  durationButtonSmall: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: colors.chipSurface
  },
  durationButtonActive: {
    backgroundColor: colors.highlight
  },
  durationButtonText: {
    color: colors.chipText,
    fontWeight: "800"
  },
  durationButtonTextActive: {
    color: "#fff8ee"
  },
  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap"
  },
  coachNote: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 23,
    color: colors.text
  },
  strategyText: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    fontWeight: "700"
  },
  dataPill: {
    alignSelf: "flex-start",
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.chipSurface
  },
  dataPillText: {
    color: colors.chipText,
    fontWeight: "800",
    fontSize: 12
  },
  machineStack: {
    gap: 12
  },
  tipStack: {
    gap: 10
  },
  tipText: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.text
  },
  machineCard: {
    backgroundColor: colors.inputSurface,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.inputBorder
  },
  machineMeta: {
    padding: 16,
    gap: 8
  },
  exerciseTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  discoveryLabel: {
    color: colors.highlight,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7
  },
  machineName: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text
  },
  machineCategory: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted
  },
  restBox: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 7
  },
  restGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  restLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  restValue: {
    marginTop: 3,
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  restSmallText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19
  },
  restNote: {
    color: colors.highlight,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800"
  },
  restWhyButton: {
    alignSelf: "flex-start",
    marginTop: 2
  },
  restWhyLabel: {
    color: colors.highlight,
    fontSize: 13,
    fontWeight: "900"
  },
  restWhyText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19
  },
  lastSessionSummary: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 23,
    color: colors.text
  }
  });
}
