import React from "react";
import {
  Image,
  Linking,
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
import {
  Machine,
  ReadinessPain,
  TechniqueQuality,
  TrainingSetLog,
  TrainingSetType,
  UserExerciseProfile,
  WorkoutEntry,
  WorkoutFeeling
} from "../types";
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
    restSeconds?: number;
    rpe?: number;
    painLocation?: ReadinessPain;
    painLevel?: number;
    techniqueQuality?: TechniqueQuality;
    setLogs?: TrainingSetLog[];
    note: string;
  }) => void;
  userExerciseProfile?: UserExerciseProfile;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

const feelingOptions: Array<{ value: WorkoutFeeling; label: string }> = [
  { value: "lahke", label: "lahke" },
  { value: "akurat", label: "akurat" },
  { value: "tazke", label: "tazke" },
  { value: "bolest", label: "bolest" }
];
const painLocationOptions: Array<{ value: ReadinessPain; label: string }> = [
  { value: "nie", label: "bez bolesti" },
  { value: "koleno", label: "koleno" },
  { value: "rameno", label: "rameno" },
  { value: "chrbat", label: "chrbat" },
  { value: "ine", label: "ine" }
];
const rpeOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const painLevelOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const techniqueOptions: Array<{ value: TechniqueQuality; label: string }> = [
  { value: "cista", label: "cista" },
  { value: "prijatelna", label: "prijatelna" },
  { value: "zla", label: "zla" }
];

function clampSetCount(value: number) {
  return Math.min(8, Math.max(1, Math.round(value || 1)));
}

function roundTrainingWeight(value: number) {
  return Math.round(value * 10) / 10;
}

function getWarmupWeight(workingWeightKg: number | undefined, percent: number | undefined) {
  if (!workingWeightKg || !percent) {
    return undefined;
  }

  return roundTrainingWeight(workingWeightKg * (percent / 100));
}

function getSuggestedWorkingWeight(
  latestEntry: WorkoutEntry | undefined,
  guidance: ReturnType<typeof getMachineTrainingGuidance>
) {
  const latestWeight = latestEntry?.weightKg ?? 0;

  if (!latestWeight) {
    return undefined;
  }

  const painLevel = latestEntry?.painLevel ?? (latestEntry?.feeling === "bolest" ? 5 : 0);
  const rpe =
    latestEntry?.rpe ??
    (latestEntry?.feeling === "tazke" ? 9.5 : latestEntry?.feeling === "bolest" ? 10 : 8);
  const reps = latestEntry?.reps ?? 0;
  const sets = latestEntry?.sets ?? 0;
  const techniqueQuality = latestEntry?.techniqueQuality ?? "cista";

  if (painLevel >= 3 || rpe >= 9.5 || techniqueQuality === "zla") {
    return Math.max(0, roundTrainingWeight(latestWeight - guidance.microloadStepKg));
  }

  if (
    sets >= 3 &&
    reps >= guidance.defaultRepMax &&
    rpe <= 8.5 &&
    painLevel === 0 &&
    latestEntry?.feeling !== "tazke"
  ) {
    return roundTrainingWeight(latestWeight + guidance.microloadStepKg);
  }

  return latestWeight;
}

function createSetLog({
  index,
  weightKg,
  reps,
  rpe,
  painLocation,
  painLevel,
  restSeconds,
  techniqueQuality,
  setType = "working",
  targetPercent
}: {
  index: number;
  weightKg?: number;
  reps?: number;
  rpe?: number;
  painLocation: ReadinessPain;
  painLevel: number;
  restSeconds?: number;
  techniqueQuality: TechniqueQuality;
  setType?: TrainingSetType;
  targetPercent?: number;
}): TrainingSetLog {
  return {
    id: `set-${index + 1}-${Date.now()}`,
    setNumber: index + 1,
    setType,
    targetPercent,
    weightKg,
    reps,
    rpe,
    painLocation,
    painLevel,
    restSecondsUsed: restSeconds,
    techniqueQuality,
    completed: false
  };
}

function syncSetWeightsForWorkingWeight(logs: TrainingSetLog[], workingWeightKg: number) {
  return logs.map((setLog) => {
    if (setLog.completed) {
      return setLog;
    }

    if (setLog.setType === "warmup") {
      return {
        ...setLog,
        weightKg: getWarmupWeight(workingWeightKg, setLog.targetPercent) ?? setLog.weightKg
      };
    }

    return {
      ...setLog,
      weightKg: workingWeightKg
    };
  });
}

function getSetTitle(setLog: TrainingSetLog, workingIndex: number) {
  if (setLog.setType === "warmup") {
    return `Rozcvicka ${setLog.targetPercent ? `${setLog.targetPercent}%` : ""}`.trim();
  }

  return `Pracovna seria ${workingIndex}`;
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(restSeconds).padStart(2, "0")}`;
}

function playRestDoneSound() {
  try {
    const AudioContextCtor =
      (globalThis as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
      (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) {
      return;
    }

    const audioContext = new AudioContextCtor();
    const beeps = [
      { delayMs: 0, durationMs: 90, frequency: 880 },
      { delayMs: 170, durationMs: 90, frequency: 980 },
      { delayMs: 360, durationMs: 240, frequency: 1160 }
    ];

    beeps.forEach((beep) => {
      globalThis.setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = beep.frequency;
        gain.gain.setValueAtTime(0.001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          audioContext.currentTime + beep.durationMs / 1000
        );
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + beep.durationMs / 1000);
      }, beep.delayMs);
    });
  } catch {
    // Zvuk je len prijemny bonus. Ak ho prehliadac zablokuje, appka ide dalej.
  }
}

export function MachineDetailScreen({
  machine,
  entries,
  userExerciseProfile,
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
  const machineImages = React.useMemo(
    () =>
      [machine.imageAsset, ...(machine.imageAssets ?? [])]
        .map((imageAsset) => getMachineImage(imageAsset))
        .filter(Boolean) as Array<NonNullable<ReturnType<typeof getMachineImage>>>,
    [machine]
  );
  const machineImage = machineImages[0] ?? null;
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
  const trainingGuidance = React.useMemo(
    () => getMachineTrainingGuidance(machine, latestEntry?.weightKg),
    [latestEntry?.weightKg, machine]
  );
  const restText =
    trainingGuidance.recommendedRestMaxSec === 0
      ? "podla potreby"
      : `${trainingGuidance.recommendedRestMinSec}-${trainingGuidance.recommendedRestMaxSec} sek`;
  const restTimerSeconds =
    trainingGuidance.recommendedRestMaxSec > 0
      ? Math.round(
          (trainingGuidance.recommendedRestMinSec + trainingGuidance.recommendedRestMaxSec) / 2
        )
      : 60;
  const blockedUntilTime = userExerciseProfile?.blockedUntil
    ? new Date(userExerciseProfile.blockedUntil).getTime()
    : 0;
  const isTemporarilyBlocked =
    Boolean(blockedUntilTime) && !Number.isNaN(blockedUntilTime) && blockedUntilTime > Date.now();

  const [isImageOpen, setIsImageOpen] = React.useState(false);
  const [isRestWhyOpen, setIsRestWhyOpen] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [weightKg, setWeightKg] = React.useState("");
  const [sets, setSets] = React.useState("4");
  const [reps, setReps] = React.useState("10");
  const [durationMin, setDurationMin] = React.useState("20");
  const [speedKph, setSpeedKph] = React.useState("6");
  const [inclinePercent, setInclinePercent] = React.useState("0");
  const [feeling, setFeeling] = React.useState<WorkoutFeeling>("akurat");
  const [rpe, setRpe] = React.useState(8);
  const [painLevel, setPainLevel] = React.useState(0);
  const [painLocation, setPainLocation] = React.useState<ReadinessPain>("nie");
  const [techniqueQuality, setTechniqueQuality] = React.useState<TechniqueQuality>("cista");
  const [restSeconds, setRestSeconds] = React.useState(String(restTimerSeconds));
  const [setLogs, setSetLogs] = React.useState<TrainingSetLog[]>([]);
  const [collapsedSetIds, setCollapsedSetIds] = React.useState<Record<string, boolean>>({});
  const [activeRestTimer, setActiveRestTimer] = React.useState<{
    setNumber: number;
    remainingSec: number;
  } | null>(null);
  const [note, setNote] = React.useState("");
  const selectedMachineImage = machineImages[selectedImageIndex] ?? machineImage;
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
    const suggestedWorkingWeight = getSuggestedWorkingWeight(latestEntry, trainingGuidance);
    const workingSets = clampSetCount(latestEntry?.sets ?? 4);
    const workingReps = latestEntry?.reps ?? trainingGuidance.defaultRepMax ?? 10;

    setWeightKg(suggestedWorkingWeight ? String(suggestedWorkingWeight) : "");
    setSets(latestEntry?.sets ? String(latestEntry.sets) : "4");
    setReps(latestEntry?.reps ? String(latestEntry.reps) : String(trainingGuidance.defaultRepMax ?? 10));
    setDurationMin(latestEntry?.durationMin ? String(latestEntry.durationMin) : "20");
    setSpeedKph(latestEntry?.speedKph ? String(latestEntry.speedKph) : "6");
    setInclinePercent(
      latestEntry?.inclinePercent !== undefined
        ? String(latestEntry.inclinePercent)
        : "0"
    );
    setNote(latestEntry?.note ?? "");
    setFeeling(latestEntry?.feeling ?? "akurat");
    setRpe(latestEntry?.rpe ?? 8);
    setPainLevel(latestEntry?.painLevel ?? 0);
    setPainLocation(latestEntry?.painLocation ?? "nie");
    setTechniqueQuality(latestEntry?.techniqueQuality ?? "cista");
    setRestSeconds(
      latestEntry?.restSeconds ? String(latestEntry.restSeconds) : String(restTimerSeconds)
    );
    const warmupLogs = trainingGuidance.warmupSets.map((warmupSet, index) =>
      createSetLog({
        index,
        weightKg:
          warmupSet.weightKg ??
          getWarmupWeight(suggestedWorkingWeight, warmupSet.percent),
        reps: warmupSet.reps,
        rpe: 5,
        painLocation: latestEntry?.painLocation ?? "nie",
        painLevel: latestEntry?.painLevel ?? 0,
        restSeconds: latestEntry?.restSeconds ?? restTimerSeconds,
        techniqueQuality: latestEntry?.techniqueQuality ?? "cista",
        setType: "warmup",
        targetPercent: warmupSet.percent
      })
    );
    const existingWorkingLogs =
      latestEntry?.setLogs
        ?.filter((setLog) => setLog.setType !== "warmup")
        .map((setLog, index) => ({
          ...setLog,
          id: `set-working-${index + 1}-${Date.now()}`,
          setNumber: warmupLogs.length + index + 1,
          setType: "working" as const,
          weightKg: suggestedWorkingWeight ?? setLog.weightKg,
          reps: setLog.reps ?? workingReps,
          techniqueQuality: setLog.techniqueQuality ?? latestEntry.techniqueQuality ?? "cista",
          completed: false
        }))
        .slice(0, workingSets) ?? [];
    const generatedWorkingLogs = Array.from(
      { length: Math.max(0, workingSets - existingWorkingLogs.length) },
      (_item, index) =>
        createSetLog({
          index: warmupLogs.length + existingWorkingLogs.length + index,
          weightKg: suggestedWorkingWeight,
          reps: workingReps,
          rpe: latestEntry?.rpe ?? 8,
          painLocation: latestEntry?.painLocation ?? "nie",
          painLevel: latestEntry?.painLevel ?? 0,
          restSeconds: latestEntry?.restSeconds ?? restTimerSeconds,
          techniqueQuality: latestEntry?.techniqueQuality ?? "cista",
          setType: "working"
        })
    );

    setSetLogs([...warmupLogs, ...existingWorkingLogs, ...generatedWorkingLogs].map(
      (setLog, index) => ({ ...setLog, setNumber: index + 1 })
    ));
    setCollapsedSetIds({});
    setActiveRestTimer(null);
  }, [latestEntry?.id, machine.id, restTimerSeconds, trainingGuidance]);

  React.useEffect(() => {
    if (!activeRestTimer) {
      return;
    }

    if (activeRestTimer.remainingSec <= 0) {
      setActiveRestTimer(null);
      playRestDoneSound();
      triggerSuccessHaptic();
      return;
    }

    const interval = setInterval(() => {
      setActiveRestTimer((current) =>
        current ? { ...current, remainingSec: Math.max(0, current.remainingSec - 1) } : null
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRestTimer]);

  const adjustWeight = (delta: number) => {
    triggerTapHaptic();
    const current = Number(weightKg || "0");
    const next = Math.max(0, Math.round((current + delta) * 100) / 100);
    handleWorkingWeightChange(next === 0 ? "" : String(next));
  };

  const handleWorkingWeightChange = (value: string) => {
    setWeightKg(value);
    const parsedWeight = Number(value);

    if (!parsedWeight) {
      return;
    }

    setSetLogs((currentLogs) => syncSetWeightsForWorkingWeight(currentLogs, parsedWeight));
  };

  const handleWorkingRepsChange = (value: string) => {
    setReps(value);
    const parsedReps = Number(value);

    if (!parsedReps) {
      return;
    }

    setSetLogs((currentLogs) =>
      currentLogs.map((setLog) =>
        setLog.setType === "warmup" || setLog.completed
          ? setLog
          : { ...setLog, reps: parsedReps }
      )
    );
  };

  const updateSetLog = (
    setNumber: number,
    nextValues: Partial<Omit<TrainingSetLog, "id" | "setNumber">>
  ) => {
    setSetLogs((currentLogs) =>
      currentLogs.map((setLog) =>
        setLog.setNumber === setNumber ? { ...setLog, ...nextValues } : setLog
      )
    );
  };

  const handleSetsChange = (value: string) => {
    setSets(value);
    const parsedSets = clampSetCount(Number(value));

    if (!parsedSets) {
      return;
    }

    setSetLogs((currentLogs) => {
      const warmupLogs = currentLogs.filter((setLog) => setLog.setType === "warmup");
      const workingLogs = currentLogs.filter((setLog) => setLog.setType !== "warmup");

      if (workingLogs.length === parsedSets) {
        return currentLogs;
      }

      if (workingLogs.length > parsedSets) {
        return [...warmupLogs, ...workingLogs.slice(0, parsedSets)].map((setLog, index) => ({
          ...setLog,
          setNumber: index + 1
        }));
      }

      return [
        ...warmupLogs,
        ...workingLogs,
        ...Array.from({ length: parsedSets - workingLogs.length }, (_item, index) =>
          createSetLog({
            index: warmupLogs.length + workingLogs.length + index,
            weightKg: Number(weightKg) || undefined,
            reps: Number(reps) || undefined,
            rpe,
            painLocation,
            painLevel,
            restSeconds: Number(restSeconds) || restTimerSeconds,
            techniqueQuality,
            setType: "working"
          })
        )
      ].map((setLog, index) => ({ ...setLog, setNumber: index + 1 }));
    });
  };

  const startRestAfterSet = (setNumber: number) => {
    triggerTapHaptic();
    const now = new Date().toISOString();

    updateSetLog(setNumber, {
      completed: true,
      completedAt: now,
      restSecondsUsed: Number(restSeconds) || restTimerSeconds
    });
    const completedSet = setLogs.find((setLog) => setLog.setNumber === setNumber);

    if (completedSet) {
      setCollapsedSetIds((current) => ({ ...current, [completedSet.id]: true }));
    }
    setActiveRestTimer({
      setNumber,
      remainingSec: Number(restSeconds) || restTimerSeconds
    });
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
    const completedLogs = setLogs.filter((setLog) => setLog.completed);
    const logsForSave = (completedLogs.length > 0 ? completedLogs : setLogs).map(
      (setLog, index) => ({
        ...setLog,
        id: `set-${machine.id}-${Date.now()}-${index + 1}`,
        setNumber: index + 1,
        completed: true,
        completedAt: setLog.completedAt ?? new Date().toISOString(),
        weightKg: setLog.weightKg ?? parsedWeight,
        reps: setLog.reps ?? Number(reps),
        rpe: setLog.rpe ?? rpe,
        painLocation: (setLog.painLevel ?? painLevel) > 0
          ? setLog.painLocation ?? painLocation
          : "nie",
        painLevel: setLog.painLevel ?? painLevel,
        restSecondsUsed: (setLog.restSecondsUsed ?? Number(restSeconds)) || restTimerSeconds,
        techniqueQuality: setLog.techniqueQuality ?? techniqueQuality
      })
    );
    const workingLogsForSave = logsForSave.filter((setLog) => setLog.setType !== "warmup");
    const performanceLogs = workingLogsForSave.length > 0 ? workingLogsForSave : logsForSave;
    const parsedSets = performanceLogs.length;
    const parsedReps = Math.round(
      performanceLogs.reduce((sum, setLog) => sum + (setLog.reps ?? 0), 0) / parsedSets
    );
    const averageWeight =
      Math.round(
        (performanceLogs.reduce((sum, setLog) => sum + (setLog.weightKg ?? 0), 0) /
          parsedSets) *
          100
      ) / 100;
    const averageRpe =
      Math.round(
        (performanceLogs.reduce((sum, setLog) => sum + (setLog.rpe ?? rpe), 0) /
          parsedSets) *
          10
      ) / 10;
    const maxPainLevel = Math.max(...logsForSave.map((setLog) => setLog.painLevel ?? 0), painLevel);

    if (!averageWeight || !parsedSets || !parsedReps) {
      return;
    }

    onSaveEntry({
      machineId: machine.id,
      weightKg: averageWeight,
      sets: parsedSets,
      reps: parsedReps,
      restSeconds: Number(restSeconds) || restTimerSeconds,
      rpe: averageRpe,
      painLocation: maxPainLevel > 0 ? painLocation : "nie",
      painLevel: maxPainLevel,
      techniqueQuality,
      setLogs: logsForSave,
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
              setSelectedImageIndex(0);
              setIsImageOpen(true);
            }}
          >
            <Image source={machineImage} style={styles.machineImage} resizeMode="cover" />
            <Text style={styles.imageHint}>Klikni na fotku pre vacsi nahlad</Text>
          </Pressable>
        ) : null}

        {machineImages.length > 1 ? (
          <View style={styles.galleryRow}>
            {machineImages.map((imageSource, index) => (
              <Pressable
                key={`${machine.id}-image-${index}`}
                onPress={() => {
                  triggerTapHaptic();
                  setSelectedImageIndex(index);
                  setIsImageOpen(true);
                }}
                style={styles.galleryItem}
              >
                <Image source={imageSource} style={styles.galleryImage} resizeMode="cover" />
              </Pressable>
            ))}
          </View>
        ) : null}

        {machine.videoUrl ? (
          <Pressable
            onPress={() => {
              triggerTapHaptic();
              Linking.openURL(machine.videoUrl!);
            }}
            style={styles.videoButton}
          >
            <Text style={styles.videoButtonLabel}>Nie je ti jasne, ako sa na tom cvici?</Text>
            <Text style={styles.videoButtonHint}>Kukni video na YouTube.</Text>
          </Pressable>
        ) : null}

        <View style={styles.row}>
          <Tag label={machine.muscleGroup} />
        </View>
        <Text style={styles.description}>{machine.descriptionSk}</Text>
        {isTemporarilyBlocked ? (
          <View style={styles.blockedCard}>
            <Text style={styles.blockedTitle}>Trener tento cvik teraz neodporuca</Text>
            <Text style={styles.blockedText}>
              Posledne tu bola vyssia bolest. Do{" "}
              {new Date(blockedUntilTime).toLocaleDateString("sk-SK")} ho AI nebude davat
              do navrhov, ale manualne ho stale vies zapisat.
            </Text>
          </View>
        ) : null}
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
          {trainingGuidance.warmupSets.length ? (
            <View style={styles.warmupBox}>
              <Text style={styles.warmupTitle}>Rozcvicovacie serie</Text>
              {trainingGuidance.warmupSets.map((warmupSet) => (
                <Text
                  key={`${machine.id}-${warmupSet.percent}`}
                  style={styles.warmupText}
                >
                  {warmupSet.percent}%{warmupSet.weightKg ? ` | ${warmupSet.weightKg} kg` : ""} |{" "}
                  {warmupSet.reps} op. - {warmupSet.note}
                </Text>
              ))}
            </View>
          ) : null}
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
            {latestEntry.rpe || latestEntry.painLevel ? (
              <Text style={styles.note}>
                RPE: {latestEntry.rpe ?? "-"} | bolest: {latestEntry.painLevel ?? 0}/10
                {latestEntry.painLocation && latestEntry.painLocation !== "nie"
                  ? ` (${latestEntry.painLocation})`
                  : ""}
              </Text>
            ) : null}
            {latestEntry.techniqueQuality ? (
              <Text style={styles.note}>
                Technika: {translateTechniqueQuality(latestEntry.techniqueQuality)}
              </Text>
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
                onChangeText={handleWorkingWeightChange}
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
                  onChangeText={handleSetsChange}
                  keyboardType="number-pad"
                  style={styles.smallInput}
                />
              </View>
              <View style={styles.inlineField}>
                <Text style={styles.fieldLabel}>Opakovania</Text>
                <TextInput
                  value={reps}
                  onChangeText={handleWorkingRepsChange}
                  keyboardType="number-pad"
                  style={styles.smallInput}
                />
              </View>
            </View>

            <View style={styles.inlineFields}>
              <View style={styles.inlineField}>
                <Text style={styles.fieldLabel}>Pauza v sekundach</Text>
                <TextInput
                  value={restSeconds}
                  onChangeText={setRestSeconds}
                  keyboardType="number-pad"
                  style={styles.smallInput}
                />
              </View>
              <View style={styles.inlineField}>
                <Text style={styles.fieldLabel}>RPE celkovo 1-10</Text>
                <TextInput
                  value={String(rpe)}
                  onChangeText={(value) => setRpe(Math.min(10, Math.max(1, Number(value) || 1)))}
                  keyboardType="number-pad"
                  style={styles.smallInput}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Technika pohybu</Text>
            <View style={styles.feelingRow}>
              {techniqueOptions.map((option) => {
                const isActive = techniqueQuality === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      triggerTapHaptic();
                      setTechniqueQuality(option.value);
                      setSetLogs((currentLogs) =>
                        currentLogs.map((setLog) => ({
                          ...setLog,
                          techniqueQuality: option.value
                        }))
                      );
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

            <Text style={styles.fieldLabel}>Detailne serie</Text>
            {activeRestTimer ? (
              <View style={styles.timerCard}>
                <Text style={styles.timerTitle}>
                  Pauza po {activeRestTimer.setNumber}. serii
                </Text>
                <Text style={styles.timerValue}>
                  Dalsia seria za: {formatTimer(activeRestTimer.remainingSec)}
                </Text>
                <View style={styles.timerActions}>
                  <Pressable
                    onPress={() => {
                      triggerTapHaptic();
                      setActiveRestTimer(null);
                    }}
                    style={styles.timerButton}
                  >
                    <Text style={styles.timerButtonText}>Preskocit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      triggerTapHaptic();
                      setActiveRestTimer((current) =>
                        current
                          ? { ...current, remainingSec: current.remainingSec + 30 }
                          : current
                      );
                    }}
                    style={styles.timerButtonStrong}
                  >
                    <Text style={styles.timerButtonStrongText}>+30 sek</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
            <View style={styles.setStack}>
              {setLogs.map((setLog) => {
                const workingIndex =
                  setLog.setType === "warmup"
                    ? 0
                    : setLogs
                        .slice(0, setLog.setNumber)
                        .filter((item) => item.setType !== "warmup").length;
                const setTitle = getSetTitle(setLog, workingIndex);
                const isCollapsed = setLog.completed && collapsedSetIds[setLog.id] !== false;

                if (isCollapsed) {
                  return (
                    <View key={setLog.id} style={styles.collapsedSetCard}>
                      <View style={styles.collapsedSetTextWrap}>
                        <Text style={styles.collapsedSetTitle}>OK {setTitle}</Text>
                        <Text style={styles.collapsedSetMeta}>
                          {setLog.weightKg ?? 0} kg x {setLog.reps ?? 0} op. | RPE{" "}
                          {setLog.rpe ?? "-"}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => {
                          triggerTapHaptic();
                          setCollapsedSetIds((current) => ({
                            ...current,
                            [setLog.id]: false
                          }));
                        }}
                        style={styles.setTimerButton}
                      >
                        <Text style={styles.setTimerButtonText}>Otvorit</Text>
                      </Pressable>
                    </View>
                  );
                }

                return (
                  <View
                    key={setLog.id}
                    style={[
                      styles.setCard,
                      setLog.setType === "warmup" ? styles.warmupSetCard : null,
                      setLog.completed ? styles.setCardDone : null
                    ]}
                  >
                    <View style={styles.setHeader}>
                      <View>
                        <Text style={styles.setTitle}>{setTitle}</Text>
                        {setLog.setType === "warmup" ? (
                          <Text style={styles.setSubtitle}>
                            priprav telo, nejdeme bojovat o ego
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.setHeaderActions}>
                        {setLog.completed ? (
                          <Pressable
                            onPress={() => {
                              triggerTapHaptic();
                              setCollapsedSetIds((current) => ({
                                ...current,
                                [setLog.id]: true
                              }));
                            }}
                            style={styles.setTimerButton}
                          >
                            <Text style={styles.setTimerButtonText}>Schovat</Text>
                          </Pressable>
                        ) : null}
                        <Pressable
                          onPress={() => startRestAfterSet(setLog.setNumber)}
                          style={setLog.completed ? styles.setDoneButton : styles.setTimerButton}
                        >
                          <Text
                            style={
                              setLog.completed
                                ? styles.setDoneButtonText
                                : styles.setTimerButtonText
                            }
                          >
                            {setLog.completed ? "Hotovo" : "Hotovo + pauza"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                    <View style={styles.inlineFields}>
                      <View style={styles.inlineField}>
                        <Text style={styles.setFieldLabel}>kg</Text>
                        <TextInput
                          value={setLog.weightKg ? String(setLog.weightKg) : weightKg}
                          onChangeText={(value) =>
                            updateSetLog(setLog.setNumber, {
                              weightKg: Number(value) || undefined
                            })
                          }
                          keyboardType="decimal-pad"
                          style={styles.miniInput}
                        />
                      </View>
                      <View style={styles.inlineField}>
                        <Text style={styles.setFieldLabel}>op.</Text>
                        <TextInput
                          value={setLog.reps ? String(setLog.reps) : reps}
                          onChangeText={(value) =>
                            updateSetLog(setLog.setNumber, {
                              reps: Number(value) || undefined
                            })
                          }
                          keyboardType="number-pad"
                          style={styles.miniInput}
                        />
                      </View>
                    </View>
                    <Text style={styles.setFieldLabel}>RPE serie</Text>
                    <View style={styles.choiceRow}>
                      {rpeOptions.map((option) => {
                        const isActive = (setLog.rpe ?? rpe) === option;

                        return (
                          <Pressable
                            key={option}
                            onPress={() => {
                              triggerTapHaptic();
                              updateSetLog(setLog.setNumber, { rpe: option });
                            }}
                            style={[
                              styles.choiceButton,
                              isActive ? styles.choiceButtonActive : null
                            ]}
                          >
                            <Text
                              style={[
                                styles.choiceButtonText,
                                isActive ? styles.choiceButtonTextActive : null
                              ]}
                            >
                              {option}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Text style={styles.setFieldLabel}>Bolest 0-10</Text>
                    <View style={styles.choiceRow}>
                      {painLevelOptions.map((option) => {
                        const isActive = (setLog.painLevel ?? painLevel) === option;

                        return (
                          <Pressable
                            key={option}
                            onPress={() => {
                              triggerTapHaptic();
                              updateSetLog(setLog.setNumber, { painLevel: option });
                            }}
                            style={[
                              styles.choiceButton,
                              isActive ? styles.painChoiceButtonActive : null
                            ]}
                          >
                            <Text
                              style={[
                                styles.choiceButtonText,
                                isActive ? styles.choiceButtonTextActive : null
                              ]}
                            >
                              {option}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Text style={styles.setFieldLabel}>Technika serie</Text>
                    <View style={styles.feelingRow}>
                      {techniqueOptions.map((option) => {
                        const isActive =
                          (setLog.techniqueQuality ?? techniqueQuality) === option.value;

                        return (
                          <Pressable
                            key={option.value}
                            onPress={() => {
                              triggerTapHaptic();
                              updateSetLog(setLog.setNumber, {
                                techniqueQuality: option.value
                              });
                            }}
                            style={[
                              styles.feelingButton,
                              isActive ? styles.feelingButtonActive : null
                            ]}
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
                  </View>
                );
              })}
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

        <Text style={styles.fieldLabel}>Bolest celkovo 0-10</Text>
        <View style={styles.choiceRow}>
          {painLevelOptions.map((option) => {
            const isActive = painLevel === option;

            return (
              <Pressable
                key={option}
                onPress={() => {
                  triggerTapHaptic();
                  setPainLevel(option);
                  setSetLogs((currentLogs) =>
                    currentLogs.map((setLog) => ({
                      ...setLog,
                      painLevel: setLog.painLevel ?? option
                    }))
                  );
                }}
                style={[
                  styles.choiceButton,
                  isActive ? styles.painChoiceButtonActive : null
                ]}
              >
                <Text
                  style={[
                    styles.choiceButtonText,
                    isActive ? styles.choiceButtonTextActive : null
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>Kde boli?</Text>
        <View style={styles.feelingRow}>
          {painLocationOptions.map((option) => {
            const isActive = painLocation === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  triggerTapHaptic();
                  setPainLocation(option.value);
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
        {painLevel >= 5 ? (
          <Text style={styles.painWarning}>
            Bolest {painLevel}/10 znamena stopku pre AI navrhy na 7 dni. Nie sme v
            gladiatorskej arene, budujeme svaly rozumne.
          </Text>
        ) : null}

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
              {entry.rpe || entry.painLevel ? (
                <Text style={styles.timelineText}>
                  RPE {entry.rpe ?? "-"} | bolest {entry.painLevel ?? 0}/10
                </Text>
              ) : null}
              {entry.techniqueQuality ? (
                <Text style={styles.timelineText}>
                  Technika: {translateTechniqueQuality(entry.techniqueQuality)}
                </Text>
              ) : null}
              {entry.setLogs?.length ? (
                <Text style={styles.timelineText}>
                  Serie:{" "}
                  {entry.setLogs
                    .map(
                      (setLog) =>
                        `${setLog.setNumber}. ${setLog.weightKg ?? 0}kg x ${setLog.reps ?? 0} (RPE ${setLog.rpe ?? "-"})`
                    )
                    .join(" | ")}
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
          {selectedMachineImage ? (
            <Image source={selectedMachineImage} style={styles.modalImage} resizeMode="contain" />
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
  galleryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    flexWrap: "wrap"
  },
  galleryItem: {
    width: 84,
    height: 64,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface
  },
  galleryImage: {
    width: "100%",
    height: "100%"
  },
  videoButton: {
    marginTop: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.highlight,
    backgroundColor: colors.highlightSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 3
  },
  videoButtonLabel: {
    color: colors.highlight,
    fontSize: 15,
    fontWeight: "900"
  },
  videoButtonHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text
  },
  blockedCard: {
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#c74747",
    backgroundColor: "rgba(172, 44, 44, 0.18)",
    padding: 14,
    gap: 6
  },
  blockedTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  blockedText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19
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
  miniInput: {
    backgroundColor: colors.inputSurface,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: "800",
    color: colors.text
  },
  setStack: {
    gap: 10,
    marginTop: 6,
    marginBottom: 12
  },
  setCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.accentSoft,
    padding: 12,
    gap: 8
  },
  setCardDone: {
    borderColor: colors.success,
    backgroundColor: "rgba(47, 122, 87, 0.18)"
  },
  warmupSetCard: {
    borderColor: colors.highlight,
    backgroundColor: colors.highlightSoft
  },
  collapsedSetCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: "rgba(47, 122, 87, 0.2)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  collapsedSetTextWrap: {
    flex: 1,
    gap: 3
  },
  collapsedSetTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  collapsedSetMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800"
  },
  setHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  setHeaderActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 8
  },
  setTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  setSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  setFieldLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4
  },
  setTimerButton: {
    borderRadius: 999,
    backgroundColor: colors.highlight,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  setTimerButtonText: {
    color: colors.onAccent,
    fontSize: 12,
    fontWeight: "900"
  },
  setDoneButton: {
    borderRadius: 999,
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  setDoneButtonText: {
    color: "#fff8ee",
    fontSize: 12,
    fontWeight: "900"
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10
  },
  choiceButton: {
    minWidth: 42,
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputSurface,
    paddingHorizontal: 12,
    paddingVertical: 9
  },
  choiceButtonActive: {
    backgroundColor: colors.success,
    borderColor: colors.success
  },
  painChoiceButtonActive: {
    backgroundColor: colors.highlight,
    borderColor: colors.highlight
  },
  choiceButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  choiceButtonTextActive: {
    color: "#fff8ee"
  },
  timerCard: {
    minHeight: 260,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.success,
    backgroundColor: "rgba(47, 122, 87, 0.24)",
    padding: 24,
    gap: 16,
    marginBottom: 16,
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 6
  },
  timerTitle: {
    color: colors.success,
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  timerValue: {
    color: colors.text,
    fontSize: 48,
    lineHeight: 56,
    fontWeight: "900",
    textAlign: "center"
  },
  timerActions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center"
  },
  timerButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 18,
    paddingVertical: 13
  },
  timerButtonText: {
    color: colors.text,
    fontWeight: "900"
  },
  timerButtonStrong: {
    borderRadius: 999,
    backgroundColor: colors.success,
    paddingHorizontal: 18,
    paddingVertical: 13
  },
  timerButtonStrongText: {
    color: "#fff8ee",
    fontWeight: "900"
  },
  painWarning: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#c74747",
    backgroundColor: "rgba(172, 44, 44, 0.16)",
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10
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

function translateTechniqueQuality(quality: TechniqueQuality) {
  if (quality === "cista") {
    return "cista";
  }

  if (quality === "prijatelna") {
    return "prijatelna";
  }

  return "zla - najprv oprav pohyb, az potom vahu";
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
