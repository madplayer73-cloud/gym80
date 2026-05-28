import React from "react";
import {
  DimensionValue,
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
import {
  Machine,
  ReadinessCheck,
  ReadinessEnergy,
  ReadinessGoal,
  ReadinessPain,
  ReadinessSleep,
  ReadinessSoreness,
  UserExerciseProfile,
  UserTrainingLevel,
  WorkoutFocus,
  WorkoutSession
} from "../types";
import { estimateSessionCalories } from "../utils/calories";
import { triggerSuccessHaptic, triggerTapHaptic } from "../utils/haptics";
import {
  defaultReadiness,
  generateTrainerPlan,
  PlannedExercise
} from "../utils/trainerPlanner";
import { buildDailySuggestion } from "../utils/trainingPlan";

type HomeScreenProps = {
  machines: Machine[];
  sessions: WorkoutSession[];
  userExerciseProfiles: Record<string, UserExerciseProfile>;
  onOpenMachine: (machine: Machine) => void;
  trainerSettings: TrainerSessionSettings;
  onChangeTrainerSettings: (settings: TrainerSessionSettings) => void;
  onCompleteRoutine: (input: {
    machineId: string;
    durationMin: number;
    note: string;
  }) => void;
};

export type TrainerSessionSettings = {
  durationMin: number;
  warmupMin: number;
  cooldownMin: number;
  manualFocus: WorkoutFocus | null;
  readiness: ReadinessCheck;
  hasStarted: boolean;
};

const durationOptions = [60, 90, 120];
const warmupOptions = [5, 8, 10, 15];
const cooldownOptions = [3, 5, 8, 10];
const energyOptions: ReadinessEnergy[] = [1, 2, 3, 4, 5];
const sleepOptions: Array<{ value: ReadinessSleep; label: string }> = [
  { value: "slaby", label: "slaby" },
  { value: "priemerny", label: "priemerny" },
  { value: "dobry", label: "dobry" }
];
const sorenessOptions: Array<{ value: ReadinessSoreness; label: string }> = [
  { value: "ziadna", label: "ziadna" },
  { value: "mierna", label: "mierna" },
  { value: "silna", label: "silna" }
];
const painOptions: Array<{ value: ReadinessPain; label: string }> = [
  { value: "nie", label: "nie" },
  { value: "koleno", label: "koleno" },
  { value: "rameno", label: "rameno" },
  { value: "chrbat", label: "chrbat" }
];
const goalOptions: Array<{ value: ReadinessGoal; label: string }> = [
  { value: "normal", label: "normal" },
  { value: "lahky", label: "lahsi den" },
  { value: "silovy", label: "silnejsi den" },
  { value: "udrzat_rytmus", label: "len udrzat rytmus" }
];
const trainingLevelOptions: Array<{ value: UserTrainingLevel; label: string }> = [
  { value: "zaciatocnik", label: "zaciatocnik" },
  { value: "stredne_pokrocily", label: "stredny" },
  { value: "pokrocily", label: "pokrocily" },
  { value: "navrat_po_pauze", label: "po pauze" }
];
const noEgoOptions: Array<{ value: "zapnuty" | "vypnuty"; label: string }> = [
  { value: "zapnuty", label: "no ego ON" },
  { value: "vypnuty", label: "volnejsie" }
];
const WARMUP_ROUTINE_MACHINE_ID = "routine-warmup";
const COOLDOWN_ROUTINE_MACHINE_ID = "routine-cooldown";

function getNextFocus(currentFocus: WorkoutFocus) {
  return currentFocus === "Spodok tela" ? "Vrch tela" : "Spodok tela";
}

function translateGoal(goal: ReadinessGoal) {
  if (goal === "lahky") {
    return "lahsi den";
  }

  if (goal === "silovy") {
    return "silnejsi den";
  }

  if (goal === "udrzat_rytmus") {
    return "udrzat rytmus";
  }

  return "normal";
}

function translateTrainingLevel(level: UserTrainingLevel | undefined) {
  if (level === "zaciatocnik") {
    return "zaciatocnik";
  }

  if (level === "pokrocily") {
    return "pokrocily";
  }

  if (level === "navrat_po_pauze") {
    return "navrat po pauze";
  }

  return "stredne pokrocily";
}

export function HomeScreen({
  machines,
  sessions,
  userExerciseProfiles,
  onOpenMachine,
  trainerSettings,
  onChangeTrainerSettings,
  onCompleteRoutine
}: HomeScreenProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const {
    durationMin,
    warmupMin,
    cooldownMin,
    manualFocus,
    readiness = defaultReadiness,
    hasStarted
  } = trainerSettings;
  const updateTrainerSettings = (nextSettings: Partial<TrainerSessionSettings>) => {
    onChangeTrainerSettings({
      ...trainerSettings,
      ...nextSettings
    });
  };
  const updateReadiness = (nextReadiness: Partial<ReadinessCheck>) => {
    updateTrainerSettings({
      readiness: {
        ...readiness,
        ...nextReadiness
      },
      hasStarted: false
    });
  };
  const suggestion = buildDailySuggestion(
    sessions,
    machines,
    durationMin,
    warmupMin,
    cooldownMin,
    manualFocus ?? undefined
  );
  const trainerPlan = generateTrainerPlan({
    sessions,
    machines,
    targetDurationMinutes: durationMin,
    warmupMin,
    cooldownMin,
    preferredFocus: suggestion.focus,
    readiness,
    userExerciseProfiles
  });
  const lastSession = sessions[0];
  const [expandedWhyId, setExpandedWhyId] = React.useState<string | null>(null);
  const [isSetupExpanded, setIsSetupExpanded] = React.useState(!hasStarted);
  const [setupSavedMessage, setSetupSavedMessage] = React.useState<string | null>(null);
  const [expandedRoutineIds, setExpandedRoutineIds] = React.useState<Record<string, boolean>>({});
  const [expandedCompletedMachineIds, setExpandedCompletedMachineIds] = React.useState<
    Record<string, boolean>
  >({});
  const [busyMachineId, setBusyMachineId] = React.useState<string | null>(null);
  const machineMap = React.useMemo(
    () => new Map(machines.map((machine) => [machine.id, machine])),
    [machines]
  );
  const lastSessionCalories = lastSession
    ? estimateSessionCalories(lastSession, (machineId) => machineMap.get(machineId))
    : null;
  const todayKey = new Date().toISOString().slice(0, 10);
  const completedTodayMachineIds = React.useMemo(() => {
    return new Set(
      sessions
        .filter((session) => session.workoutDate.slice(0, 10) === todayKey)
        .flatMap((session) => session.entries.map((entry) => entry.machineId))
    );
  }, [sessions, todayKey]);

  React.useEffect(() => {
    if (hasStarted) {
      setIsSetupExpanded(false);
    }
  }, [hasStarted]);

  React.useEffect(() => {
    if (!setupSavedMessage) {
      return;
    }

    const timeout = setTimeout(() => setSetupSavedMessage(null), 2200);

    return () => clearTimeout(timeout);
  }, [setupSavedMessage]);

  const saveSetupAndCollapse = () => {
    triggerSuccessHaptic();
    setSetupSavedMessage("Ulozene. Trener ma instrukcie a ide skladat plan.");
    setIsSetupExpanded(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>AI trener</Text>
        <Text style={styles.title}>Dnesny navrh treningu</Text>
        <Text style={styles.subtitle}>
          Ciel: nabrat svaly, 3 az 4 treningy tyzdenne, s ohladom na kolena.
        </Text>
      </View>

      {!isSetupExpanded ? (
        <View style={styles.setupDock}>
          <View style={styles.setupDockHeader}>
            <View>
              <Text style={styles.setupDockEyebrow}>Trening nastaveny</Text>
              <Text style={styles.setupDockTitle}>
                {durationMin} min | rozcvicka {warmupMin} | schladenie {cooldownMin}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                triggerTapHaptic();
                setIsSetupExpanded(true);
              }}
              style={styles.setupEditButton}
            >
              <Text style={styles.setupEditButtonText}>Upravit</Text>
            </Pressable>
          </View>
          <Text style={styles.setupDockText}>
            Energia {readiness.energia}/5, spanok {readiness.spanok}, svalovica{" "}
            {readiness.svalovica}, bolest {readiness.bolest}, ciel {translateGoal(readiness.cielDna)}.
            Uroven {translateTrainingLevel(readiness.trainingLevel)},{" "}
            {readiness.noEgoMode === false ? "no ego vypnute" : "no ego zapnute"}.
          </Text>
          {setupSavedMessage ? (
            <View style={styles.savedSetupBadge}>
              <Text style={styles.savedSetupText}>{setupSavedMessage}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <>
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
                      updateTrainerSettings({ durationMin: option, hasStarted: false });
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
                      updateTrainerSettings({ warmupMin: option, hasStarted: false });
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
                      updateTrainerSettings({ cooldownMin: option, hasStarted: false });
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

          <SectionCard
            title="Ako sa dnes citis?"
            subtitle="Toto ovplyvni pocet cvikov, vyber strojov a to, ci trener nebude zbytocne tlacit na progres."
          >
            <Text style={styles.optionLabel}>Energia</Text>
            <View style={styles.durationRow}>
              {energyOptions.map((option) => {
                const isActive = option === readiness.energia;

                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      triggerTapHaptic();
                      updateReadiness({ energia: option });
                    }}
                    style={[styles.readinessButton, isActive ? styles.durationButtonActive : null]}
                  >
                    <Text
                      style={[
                        styles.durationButtonText,
                        isActive ? styles.durationButtonTextActive : null
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <ReadinessChoiceRow
              label="Spanok"
              options={sleepOptions}
              selected={readiness.spanok}
              onSelect={(value) => updateReadiness({ spanok: value })}
              styles={styles}
            />
            <ReadinessChoiceRow
              label="Svalovica"
              options={sorenessOptions}
              selected={readiness.svalovica}
              onSelect={(value) => updateReadiness({ svalovica: value })}
              styles={styles}
            />
            <ReadinessChoiceRow
              label="Bolest"
              options={painOptions}
              selected={readiness.bolest}
              onSelect={(value) => updateReadiness({ bolest: value })}
              styles={styles}
            />
            <ReadinessChoiceRow
              label="Ciel dna"
              options={goalOptions}
              selected={readiness.cielDna}
              onSelect={(value) => updateReadiness({ cielDna: value })}
              styles={styles}
            />
            <ReadinessChoiceRow
              label="Uroven treningu"
              options={trainingLevelOptions}
              selected={readiness.trainingLevel ?? defaultReadiness.trainingLevel ?? "stredne_pokrocily"}
              onSelect={(value) => updateReadiness({ trainingLevel: value })}
              styles={styles}
            />
            <ReadinessChoiceRow
              label="Bezpecnost"
              options={noEgoOptions}
              selected={readiness.noEgoMode === false ? "vypnuty" : "zapnuty"}
              onSelect={(value) => updateReadiness({ noEgoMode: value === "zapnuty" })}
              styles={styles}
            />
            <Pressable
              onPress={saveSetupAndCollapse}
              style={styles.setupDoneButton}
            >
              <Text style={styles.setupDoneButtonText}>Ulozit a posunut sa na navrh</Text>
            </Pressable>
          </SectionCard>
        </>
      )}

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
        <View style={styles.readinessSummary}>
          <Text style={styles.readinessSummaryTitle}>Stav dnes: {trainerPlan.readinessBand}</Text>
          <Text style={styles.readinessSummaryText}>{trainerPlan.readinessSummary}</Text>
        </View>
        <Text style={styles.strategyText}>Strategia: {trainerPlan.strategy}</Text>
        <View style={styles.startSummary}>
          <Text style={styles.startSummaryTitle}>
            Na dnesny trening mas cca {trainerPlan.exercises.length} cviceni
          </Text>
          <Text style={styles.startSummaryText}>
            Celkovy cas: {durationMin} min | rozcvicka {warmupMin} min | odhad planu{" "}
            {trainerPlan.estimatedDurationMinutes} min
          </Text>
        </View>
        <Pressable
          onPress={() => {
            triggerTapHaptic();
            updateTrainerSettings({
              manualFocus: getNextFocus(suggestion.focus),
              hasStarted: false
            });
            setExpandedWhyId(null);
          }}
          style={styles.newPlanButton}
        >
          <Text style={styles.newPlanButtonText}>
            Navrhni novy trening: {getNextFocus(suggestion.focus) === "Spodok tela"
              ? "nohy + brucho"
              : "ruky + hrudnik + ramena"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            triggerSuccessHaptic();
            setSetupSavedMessage("Startnute. Nastavenia som schoval, ideme makat.");
            setIsSetupExpanded(false);
            updateTrainerSettings({ hasStarted: true });
          }}
          style={[styles.startWorkoutButton, hasStarted ? styles.startWorkoutButtonActive : null]}
        >
          <Text style={styles.startWorkoutButtonText}>
            {hasStarted ? "Trening spusteny" : "Start treningu"}
          </Text>
        </Pressable>
      </SectionCard>

      {!hasStarted ? (
        <View style={styles.lockedPlanCard}>
          <Text style={styles.lockedPlanTitle}>Stroje ukazem az po starte</Text>
          <Text style={styles.lockedPlanText}>
            Najprv si nastav cas a rozcvicku. Potom stlac Start treningu a ideme
            makat, nie listovat ako v katalogu nabytku.
          </Text>
        </View>
      ) : (
        <>
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
        <Text style={styles.tipText}>
          Tyzdenny stimul: {trainerPlan.stats.weeklyState.topNeeds.length > 0
            ? `najviac chyba ${trainerPlan.stats.weeklyState.topNeeds.join(", ")}`
            : "zatial zbieram data z tohto tyzdna"}
        </Text>
        <Text style={styles.tipText}>
          Unava z tazkych cvikov: {trainerPlan.stats.weeklyState.axialFatigueScore} bodov
        </Text>
      </SectionCard>

          <SectionCard
            title="Tyzdenny report trenera"
            subtitle="Kratky servisny protokol: co rastie, co chyba a kde netreba frajerit."
          >
            <View style={styles.row}>
              <StatChip label="Treningy" value={String(trainerPlan.weeklyReport.workoutCount)} />
              <StatChip
                label="Podtrenovane"
                value={String(trainerPlan.weeklyReport.undertrainedMuscles.length)}
              />
              <StatChip
                label="Bolest"
                value={String(trainerPlan.weeklyReport.painWarnings.length)}
              />
            </View>
            <Text style={styles.tipText}>
              Najlepsi progres: {trainerPlan.weeklyReport.bestProgress}
            </Text>
            <Text style={styles.tipText}>
              Odporucanie: {trainerPlan.weeklyReport.nextWeekRecommendation}
            </Text>
            {trainerPlan.weeklyReport.highStressAreas.length ? (
              <Text style={styles.safetyNote}>
                Vysoka zataz: {trainerPlan.weeklyReport.highStressAreas.join(", ")}
              </Text>
            ) : null}
            {trainerPlan.weeklyReport.painWarnings.slice(0, 3).map((warning) => (
              <Text key={warning} style={styles.safetyNote}>
                {warning}
              </Text>
            ))}
          </SectionCard>

          <SectionCard
            title="Prioritny dashboard"
            subtitle="Zelena je v norme. Oranzova znamena, ze tomu trener da nabuduce viac pozornosti."
          >
            <Text style={styles.optionLabel}>Svalove partie</Text>
            {trainerPlan.weeklyReport.volumeByMuscle.slice(0, 10).map((item) => (
              <VolumeRow key={item.label} item={item} styles={styles} />
            ))}
            <Text style={styles.optionLabel}>Pohybove vzory</Text>
            {trainerPlan.weeklyReport.volumeByPattern.slice(0, 8).map((item) => (
              <VolumeRow key={item.label} item={item} styles={styles} />
            ))}
          </SectionCard>

          <SectionCard
            title="Rozcvicka"
            subtitle="Prvy bod treningu. Oznac ako hotove, aby bola rozcvicka aj v historii."
          >
            <RoutineTaskCard
              durationMin={warmupMin}
              isCompleted={completedTodayMachineIds.has(WARMUP_ROUTINE_MACHINE_ID)}
              items={suggestion.warmup}
              machineId={WARMUP_ROUTINE_MACHINE_ID}
              note={`Rozcvicka: ${suggestion.warmup.join(" | ")}`}
              onCompleteRoutine={onCompleteRoutine}
              orderLabel="1. Start"
              styles={styles}
              title="Rozcvicka pred treningom"
              isExpanded={expandedRoutineIds[WARMUP_ROUTINE_MACHINE_ID] ?? false}
              onToggleExpanded={() => {
                triggerTapHaptic();
                setExpandedRoutineIds((current) => ({
                  ...current,
                  [WARMUP_ROUTINE_MACHINE_ID]: !current[WARMUP_ROUTINE_MACHINE_ID]
                }));
              }}
            />
          </SectionCard>

          <SectionCard
            title="Cviky na dnes"
            subtitle="Poradie nie je nahodne. Trener strieda zataz, partie a prida aj nieco nove."
      >
        <View style={styles.machineStack}>
          {trainerPlan.exercises.map((exercise) => {
            const isCompleted = completedTodayMachineIds.has(exercise.machine.id);
            const isCompletedCollapsed =
              isCompleted && !expandedCompletedMachineIds[exercise.machine.id];

            return (
            <View
              key={exercise.machine.id}
              style={[styles.machineCard, isCompleted ? styles.machineCardCompleted : null]}
            >
                  <View style={styles.machineMeta}>
                    <View style={styles.exerciseTopRow}>
                      <Tag label={`${exercise.order + 1}. ${exercise.muscleGroup}`} />
                  <View style={styles.exerciseBadges}>
                    {isCompleted ? (
                      <Text style={styles.completedLabel}>✓ Hotovo</Text>
                    ) : null}
                    {exercise.isDiscovery ? (
                      <Text style={styles.discoveryLabel}>novy impulz</Text>
                    ) : null}
                  </View>
                </View>
                <Text style={styles.machineName}>{exercise.machine.displayNameSk}</Text>
                {isCompletedCollapsed ? (
                  <View style={styles.completedCompactBox}>
                    <Text style={styles.completedCompactTitle}>
                      Tento bod mas za sebou. Zelena karta, cista hlava, ideme dalej.
                    </Text>
                    <Text style={styles.completedCompactText}>
                      Plan bol {exercise.sets} x {exercise.reps}, prestavka{" "}
                      {exercise.recommendedRestMinSec}-{exercise.recommendedRestMaxSec} sek.
                    </Text>
                    <Pressable
                      onPress={() => {
                        triggerTapHaptic();
                        setExpandedCompletedMachineIds((current) => ({
                          ...current,
                          [exercise.machine.id]: true
                        }));
                      }}
                      style={styles.compactToggleButton}
                    >
                      <Text style={styles.compactToggleButtonText}>Zobrazit detail</Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
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
                    <Text style={styles.selectionReason}>
                      Preco tento cvik: {exercise.selectionReason}
                    </Text>
                    <Text style={styles.selectionReason}>
                      Tempo: {exercise.tempoHint}
                    </Text>
                    {exercise.progressType ? (
                      <Text style={styles.selectionReason}>
                        Typ progresu: {exercise.progressType}
                      </Text>
                    ) : null}
                    <Text style={styles.machineCategory}>{exercise.machine.descriptionSk}</Text>
                    <Pressable
                      onPress={() => {
                        triggerTapHaptic();
                        setBusyMachineId((current) =>
                          current === exercise.machine.id ? null : exercise.machine.id
                        );
                      }}
                      style={styles.busyButton}
                    >
                      <Text style={styles.busyButtonText}>Stroj je obsadeny</Text>
                    </Pressable>
                    {busyMachineId === exercise.machine.id ? (
                      <View style={styles.alternativeBox}>
                        <Text style={styles.alternativeTitle}>Nahradne cviky</Text>
                        {exercise.alternatives.length ? (
                          exercise.alternatives.map((alternative) => (
                            <Pressable
                              key={alternative.id}
                              onPress={() => {
                                triggerTapHaptic();
                                onOpenMachine(alternative);
                              }}
                              style={styles.alternativeItem}
                            >
                              <Text style={styles.alternativeName}>
                                {alternative.displayNameSk}
                              </Text>
                              <Text style={styles.alternativeMeta}>
                                {alternative.muscleGroup} | podobny ciel treningu
                              </Text>
                            </Pressable>
                          ))
                        ) : (
                          <Text style={styles.alternativeMeta}>
                            Zatial nemam dobru nahradu. Radsej preskoc a vrat sa k nemu neskor.
                          </Text>
                        )}
                      </View>
                    ) : null}
                  </>
                )}
                <Pressable
                  onPress={() => {
                    triggerTapHaptic();
                    onOpenMachine(exercise.machine);
                  }}
                  style={styles.openMachineButton}
                >
                  <Text style={styles.openMachineButtonText}>Otvorit stroj a zapisat vykon</Text>
                </Pressable>
                {isCompleted && !isCompletedCollapsed ? (
                  <Pressable
                    onPress={() => {
                      triggerTapHaptic();
                      setExpandedCompletedMachineIds((current) => ({
                        ...current,
                        [exercise.machine.id]: false
                      }));
                    }}
                    style={styles.compactLinkButton}
                  >
                    <Text style={styles.compactLinkButtonText}>Schovat detail</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
            );
          })}
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
            subtitle="Posledny bod treningu. Zapise sa do historie rovnako ako cviky."
          >
            <RoutineTaskCard
              durationMin={cooldownMin}
              isCompleted={completedTodayMachineIds.has(COOLDOWN_ROUTINE_MACHINE_ID)}
              items={suggestion.cooldown}
              machineId={COOLDOWN_ROUTINE_MACHINE_ID}
              note={`Schladenie: ${suggestion.cooldown.join(" | ")}`}
              onCompleteRoutine={onCompleteRoutine}
              orderLabel={`${trainerPlan.exercises.length + 2}. Koniec`}
              styles={styles}
              title="Schladenie po treningu"
              isExpanded={expandedRoutineIds[COOLDOWN_ROUTINE_MACHINE_ID] ?? false}
              onToggleExpanded={() => {
                triggerTapHaptic();
                setExpandedRoutineIds((current) => ({
                  ...current,
                  [COOLDOWN_ROUTINE_MACHINE_ID]: !current[COOLDOWN_ROUTINE_MACHINE_ID]
                }));
              }}
            />
          </SectionCard>
        </>
      )}

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
      <Text style={styles.restSmallText}>
        Istota odporucania: {exercise.confidenceLabel} ({exercise.confidenceScore}/100)
      </Text>
      {exercise.warmupSets.length ? (
        <View style={styles.warmupBox}>
          <Text style={styles.warmupTitle}>Rozcvicovacie serie pred pracovnou vahou</Text>
          {exercise.warmupSets.map((warmupSet) => (
            <Text key={`${exercise.machine.id}-${warmupSet.percent}`} style={styles.warmupText}>
              {warmupSet.percent}%{warmupSet.weightKg ? ` | ${warmupSet.weightKg} kg` : ""} |{" "}
              {warmupSet.reps} op. - {warmupSet.note}
            </Text>
          ))}
        </View>
      ) : null}
      {exercise.note ? <Text style={styles.restNote}>{exercise.note}</Text> : null}
      {exercise.restFeedback ? <Text style={styles.restNote}>{exercise.restFeedback}</Text> : null}
      {exercise.noEgoNote ? <Text style={styles.safetyNote}>{exercise.noEgoNote}</Text> : null}
      {exercise.safetyNote ? <Text style={styles.safetyNote}>{exercise.safetyNote}</Text> : null}
      <Pressable onPress={onToggleWhy} style={styles.restWhyButton}>
        <Text style={styles.restWhyLabel}>
          {isWhyOpen ? "Skryt vysvetlenie" : "Preco takato prestavka?"}
        </Text>
      </Pressable>
      {isWhyOpen ? <Text style={styles.restWhyText}>{exercise.whyRest}</Text> : null}
    </View>
  );
}

function ReadinessChoiceRow<T extends string>({
  label,
  options,
  selected,
  onSelect,
  styles
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  selected: T;
  onSelect: (value: T) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <>
      <Text style={styles.optionLabel}>{label}</Text>
      <View style={styles.durationRow}>
        {options.map((option) => {
          const isActive = option.value === selected;

          return (
            <Pressable
              key={option.value}
              onPress={() => {
                triggerTapHaptic();
                onSelect(option.value);
              }}
              style={[styles.readinessButton, isActive ? styles.durationButtonActive : null]}
            >
              <Text
                style={[
                  styles.durationButtonText,
                  isActive ? styles.durationButtonTextActive : null
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function VolumeRow({
  item,
  styles
}: {
  item: { label: string; sets: number; target: number; priority: "nizka" | "ok" | "vysoka" };
  styles: ReturnType<typeof createStyles>;
}) {
  const ratio = Math.min(1.4, item.sets / Math.max(1, item.target));
  const widthPercent = `${Math.max(8, Math.min(100, ratio * 100))}%` as DimensionValue;

  return (
    <View style={styles.volumeRow}>
      <View style={styles.volumeHeader}>
        <Text style={styles.volumeLabel}>{item.label}</Text>
        <Text style={styles.volumeValue}>
          {item.sets}/{item.target} serii
        </Text>
      </View>
      <View style={styles.volumeTrack}>
        <View
          style={[
            styles.volumeFill,
            item.priority === "vysoka"
              ? styles.volumeFillHigh
              : item.priority === "nizka"
                ? styles.volumeFillLow
                : styles.volumeFillOk,
            { width: widthPercent }
          ]}
        />
      </View>
    </View>
  );
}

function RoutineTaskCard({
  durationMin,
  isCompleted,
  items,
  machineId,
  note,
  onCompleteRoutine,
  orderLabel,
  styles,
  title,
  isExpanded,
  onToggleExpanded
}: {
  durationMin: number;
  isCompleted: boolean;
  items: string[];
  machineId: string;
  note: string;
  onCompleteRoutine: (input: {
    machineId: string;
    durationMin: number;
    note: string;
  }) => void;
  orderLabel: string;
  styles: ReturnType<typeof createStyles>;
  title: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}) {
  const isCollapsed = isCompleted && !isExpanded;

  if (isCollapsed) {
    return (
      <View
        style={[
          styles.routineCard,
          styles.routineCardCompleted,
          styles.routineCompactCard
        ]}
      >
        <View style={styles.exerciseTopRow}>
          <Tag label={orderLabel} />
          <Text style={styles.completedLabel}>Hotovo</Text>
        </View>
        <Text style={styles.machineName}>{title}</Text>
        <Text style={styles.completedCompactText}>
          Hotovo v historii. Cas: {durationMin} min.
        </Text>
        <Pressable onPress={onToggleExpanded} style={styles.compactToggleButton}>
          <Text style={styles.compactToggleButtonText}>Zobrazit detail</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.routineCard, isCompleted ? styles.routineCardCompleted : null]}>
      <View style={styles.exerciseTopRow}>
        <Tag label={orderLabel} />
        {isCompleted ? <Text style={styles.completedLabel}>✓ Hotovo</Text> : null}
      </View>
      <Text style={styles.machineName}>{title}</Text>
      <View style={styles.routineMetaRow}>
        <Text style={styles.routineMeta}>Cas: {durationMin} min</Text>
        <Text style={styles.routineMeta}>Zapise sa do historie</Text>
      </View>
      <View style={styles.tipStack}>
        {items.map((item) => (
          <Text key={item} style={styles.tipText}>
            - {item}
          </Text>
        ))}
      </View>
      <Pressable
        onPress={() => {
          triggerTapHaptic();
          onCompleteRoutine({ machineId, durationMin, note });
        }}
        style={[
          styles.openMachineButton,
          isCompleted ? styles.routineDoneButton : null
        ]}
      >
        <Text style={styles.openMachineButtonText}>
          {isCompleted ? "Upravit zapis ako hotove" : "Oznacit ako hotove"}
        </Text>
      </Pressable>
      {isCompleted ? (
        <Pressable onPress={onToggleExpanded} style={styles.compactLinkButton}>
          <Text style={styles.compactLinkButtonText}>Schovat detail</Text>
        </Pressable>
      ) : null}
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
  readinessButton: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: colors.chipSurface,
    minWidth: 44,
    alignItems: "center"
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
  setupDock: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: "rgba(47, 122, 87, 0.18)",
    padding: 18,
    gap: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 22,
    elevation: 6
  },
  setupDockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  setupDockEyebrow: {
    color: colors.success,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  setupDockTitle: {
    marginTop: 3,
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24
  },
  setupDockText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700"
  },
  setupEditButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 9
  },
  setupEditButtonText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "900"
  },
  savedSetupBadge: {
    borderRadius: 18,
    backgroundColor: colors.success,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  savedSetupText: {
    color: "#fff8ee",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "900"
  },
  setupDoneButton: {
    marginTop: 10,
    borderRadius: 20,
    backgroundColor: colors.success,
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: "center"
  },
  setupDoneButtonText: {
    color: "#fff8ee",
    fontSize: 16,
    fontWeight: "900"
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
  startSummary: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: "rgba(47, 122, 87, 0.14)",
    padding: 14,
    gap: 5
  },
  readinessSummary: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: "rgba(47, 122, 87, 0.13)",
    padding: 14,
    gap: 6
  },
  readinessSummaryTitle: {
    color: colors.success,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7
  },
  readinessSummaryText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "700"
  },
  startSummaryTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  startSummaryText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  newPlanButton: {
    marginTop: 16,
    backgroundColor: colors.highlight,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center"
  },
  newPlanButtonText: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: "900"
  },
  startWorkoutButton: {
    marginTop: 10,
    backgroundColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.accent
  },
  startWorkoutButtonActive: {
    backgroundColor: colors.success,
    borderColor: colors.success
  },
  startWorkoutButtonText: {
    color: colors.onAccent,
    fontSize: 16,
    fontWeight: "900"
  },
  lockedPlanCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.accentSoft,
    padding: 18,
    gap: 8
  },
  lockedPlanTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "900"
  },
  lockedPlanText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 23
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
  routineCard: {
    backgroundColor: colors.inputSurface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    padding: 16,
    gap: 10
  },
  routineCardCompleted: {
    borderWidth: 2,
    borderColor: colors.success,
    backgroundColor: "rgba(47, 122, 87, 0.24)",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 5
  },
  routineCompactCard: {
    gap: 8
  },
  routineMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  routineMeta: {
    borderRadius: 999,
    backgroundColor: colors.highlightSoft,
    color: colors.highlight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "900"
  },
  machineCard: {
    backgroundColor: colors.inputSurface,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.inputBorder
  },
  machineCardCompleted: {
    borderWidth: 2,
    borderColor: colors.success,
    backgroundColor: "rgba(47, 122, 87, 0.26)",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 5
  },
  completedCompactBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: "rgba(47, 122, 87, 0.18)",
    padding: 14,
    gap: 8
  },
  completedCompactTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21
  },
  completedCompactText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700"
  },
  compactToggleButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: colors.success,
    paddingHorizontal: 13,
    paddingVertical: 9
  },
  compactToggleButtonText: {
    color: "#fff8ee",
    fontSize: 13,
    fontWeight: "900"
  },
  compactLinkButton: {
    alignSelf: "flex-start",
    marginTop: 2,
    paddingVertical: 6
  },
  compactLinkButtonText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "900"
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
  exerciseBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end"
  },
  completedLabel: {
    color: "#ffffff",
    backgroundColor: colors.success,
    borderRadius: 999,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 7,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7
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
    borderColor: colors.success,
    backgroundColor: "rgba(47, 122, 87, 0.16)",
    padding: 12,
    gap: 7
  },
  restGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  restLabel: {
    color: colors.success,
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
  warmupBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 10,
    gap: 5
  },
  warmupTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  warmupText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700"
  },
  restNote: {
    color: colors.success,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800"
  },
  safetyNote: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "900"
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
  selectionReason: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700"
  },
  busyButton: {
    alignSelf: "flex-start",
    marginTop: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.highlight,
    backgroundColor: colors.highlightSoft,
    paddingHorizontal: 13,
    paddingVertical: 9
  },
  busyButtonText: {
    color: colors.highlight,
    fontSize: 13,
    fontWeight: "900"
  },
  alternativeBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 8
  },
  alternativeTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  alternativeItem: {
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    padding: 11,
    gap: 3
  },
  alternativeName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  alternativeMeta: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  volumeRow: {
    marginBottom: 10,
    gap: 6
  },
  volumeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  volumeLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  volumeValue: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800"
  },
  volumeTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.chipSurface,
    overflow: "hidden"
  },
  volumeFill: {
    height: "100%",
    borderRadius: 999
  },
  volumeFillHigh: {
    backgroundColor: colors.highlight
  },
  volumeFillOk: {
    backgroundColor: colors.success
  },
  volumeFillLow: {
    backgroundColor: colors.textMuted
  },
  openMachineButton: {
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: "center"
  },
  openMachineButtonText: {
    color: colors.onAccent,
    fontSize: 14,
    fontWeight: "900"
  },
  routineDoneButton: {
    backgroundColor: colors.success
  },
  lastSessionSummary: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 23,
    color: colors.text
  }
  });
}
