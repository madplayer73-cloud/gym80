import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MachineSetupCard } from "../components/MachineSetupCard";
import { parseMachineDrafts } from "../utils/machineDraft";
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
import { getMachineAccessories } from "../data/machineAccessories";
import { getRememberedAccessory } from "../utils/exerciseMemory";
import { AppColors, useTheme } from "../theme";
import {
  Machine,
  MachineSetup,
  MachineDraft,
  MachineAccessoryId,
  MachineExerciseVariant,
  ReadinessPain,
  TechniqueQuality,
  TrainingSetLog,
  TrainingSetType,
  UserExerciseProfile,
  WorkoutEntry,
  WorkoutFeeling
} from "../types";
import {
  triggerRestCompleteHaptic,
  triggerSuccessHaptic,
  triggerTapHaptic
} from "../utils/haptics";
import { getMachineImage } from "../utils/machineImages";
import {
  getEntryProgressionAdvice,
  getPlannedProgressionAdvice,
  getTrendProgressionAdvice,
  suggestWorkingWeight,
  getWorkingWeightReason,
  ProgressionAdviceLevel
} from "../utils/progressionAdvice";
import { getMachineTrainingGuidance, PlannedExercise } from "../utils/trainerPlanner";

type MachineDetailEntry = WorkoutEntry & {
  workoutDate: string;
  workoutFocus: string;
  machine?: Machine;
};

type MachineDetailScreenProps = {
  onSaveMachineSetup: (setup: MachineSetup) => void;
  machine: Machine;
  plannedExercise?: PlannedExercise;
  entries: MachineDetailEntry[];
  onBack: () => void;
  onBackToPlan?: () => void;
  onSaveEntry: (input: {
    machineId: string;
    exerciseVariantId?: string;
    exerciseVariantNameSk?: string;
    accessoryId?: MachineAccessoryId;
    accessoryNameSk?: string;
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
    if (setLog.completed || setLog.manualOverride) {
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
    void audioContext.resume?.();
    const beeps = [
      { delayMs: 0, durationMs: 120, frequency: 920 },
      { delayMs: 210, durationMs: 120, frequency: 920 },
      { delayMs: 440, durationMs: 170, frequency: 1080 },
      { delayMs: 720, durationMs: 340, frequency: 1280 }
    ];

    beeps.forEach((beep) => {
      globalThis.setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = beep.frequency;
        gain.gain.setValueAtTime(0.001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.48, audioContext.currentTime + 0.02);
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

function playCountdownBeep(remainingSec: number) {
  try {
    const AudioContextCtor =
      (globalThis as unknown as { AudioContext?: typeof AudioContext }).AudioContext ??
      (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) {
      return;
    }

    const audioContext = new AudioContextCtor();
    void audioContext.resume?.();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const frequency = remainingSec === 3 ? 640 : remainingSec === 2 ? 820 : 1060;
    const duration = remainingSec === 1 ? 0.22 : 0.14;

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.36, audioContext.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    // Zvuk je bonus. Niektore prehliadace ho povolia az po interakcii.
  }
}

function getDefaultVariantId(machine: Machine) {
  return machine.exerciseVariants?.[0]?.id ?? null;
}

function getVariantLoadHint(variant: MachineExerciseVariant | undefined) {
  if (!variant) {
    return "";
  }

  if (variant.loadType === "assisted") {
    return "Pri tomto variante kg znamena dopomoc stroja. Menej kg = tazsi cvik.";
  }

  if (variant.loadType === "bodyweight") {
    return "Tento variant je vlastna vaha. Ak pouzijes vestu alebo kotuc, zatial to napis do poznamky.";
  }

  return "Tento variant ma vlastnu vahu alebo odpor, preto ho ukladame oddelene.";
}

const draftWrites = new Map<string, Promise<unknown>>();
function writeDrafts(key: string, drafts: Record<string, MachineDraft>) {
  const raw = JSON.stringify(drafts);
  const next = (draftWrites.get(key) ?? Promise.resolve()).catch(() => {}).then(() => AsyncStorage.setItem(key, raw));
  draftWrites.set(key, next);
  return next;
}
export function MachineDetailScreen(props: MachineDetailScreenProps) {
  const [drafts, setDrafts] = React.useState<Record<string, MachineDraft> | null>(null);
  const [loadError, setLoadError] = React.useState(false);
  const key = `gym80-machine-draft-v1-${props.machine.id}`;
  const { colors } = useTheme();
  React.useEffect(() => {
    let cancelled = false;
    void (draftWrites.get(key) ?? Promise.resolve()).catch(() => {}).then(() => AsyncStorage.getItem(key)).then((raw) => {
      const parsed = parseMachineDrafts(raw);
      if (!cancelled) setDrafts(parsed);
    }).catch(() => { if (!cancelled) setLoadError(true); });
    return () => { cancelled = true; };
  }, [key]);
  if (loadError) return <View style={{ padding: 20 }}><Text style={{ color: colors.text }}>Rozpracovany zapis sa nepodarilo nacitat. Nechavam ho ulozeny. Skus znovu otvorit stroj.</Text><Pressable onPress={props.onBack}><Text style={{ color: colors.highlight, padding: 16 }}>Spat</Text></Pressable></View>;
  if (!drafts) return <Text style={{ color: colors.text, padding: 20 }}>Nacitavam zapis…</Text>;
  return <MachineDetailForm {...props} initialDrafts={drafts} storageKey={key} />;
}
function MachineDetailForm({
  initialDrafts,
  storageKey,
  onSaveMachineSetup,
  machine,
  plannedExercise,
  entries,
  userExerciseProfile,
  isFavorite,
  onBack,
  onBackToPlan,
  onSaveEntry,
  onToggleFavorite
}: MachineDetailScreenProps & { initialDrafts: Record<string, MachineDraft>; storageKey: string }) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const isCardio = machine.muscleGroup === "Kardio";
  const draftsRef = React.useRef(initialDrafts);
  const newestDraft = Object.values(initialDrafts).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const [selectedAccessoryId, setSelectedAccessoryId] = React.useState<MachineAccessoryId | null>(() =>
    newestDraft ? newestDraft.accessoryId : getRememberedAccessory(machine, entries));
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | null>(() =>
    newestDraft?.variantId ?? getDefaultVariantId(machine)
  );

  const draftKey = JSON.stringify([selectedVariantId, selectedAccessoryId]);
  const [initializedKey, setInitializedKey] = React.useState<string | null>(null);
  const baselineRef = React.useRef<string | null>(null);
  const savedRef = React.useRef(false);
  const [draftMessage, setDraftMessage] = React.useState("");

  const selectedVariant = React.useMemo(
    () =>
      machine.exerciseVariants?.find((variant) => variant.id === selectedVariantId) ??
      machine.exerciseVariants?.[0],
    [machine.exerciseVariants, selectedVariantId]
  );
  const entriesForSelectedVariant = React.useMemo(() => {
    const accessoryEntries = entries.filter((entry) => (entry.accessoryId ?? null) === selectedAccessoryId);
    if (!selectedVariant) {
      return accessoryEntries;
    }

    const defaultVariantId = getDefaultVariantId(machine);
    return accessoryEntries.filter(
      (entry) =>
        entry.exerciseVariantId === selectedVariant.id ||
        (!entry.exerciseVariantId && selectedVariant.id === defaultVariantId)
    );
  }, [entries, machine, selectedVariant, selectedAccessoryId]);
  const latestEntry = entriesForSelectedVariant[0];
  const isBodyweightVariant = selectedVariant?.loadType === "bodyweight";
  const tracksWeight = !isCardio && !isBodyweightVariant;
  const machineImages = React.useMemo(
    () =>
      [machine.imageAsset, ...(machine.imageAssets ?? [])]
        .map((imageAsset) => getMachineImage(imageAsset))
        .filter(Boolean) as Array<NonNullable<ReturnType<typeof getMachineImage>>>,
    [machine]
  );
  const machineImage = machineImages[0] ?? null;
  const accessories = React.useMemo(
    () => getMachineAccessories(machine.accessoryIds),
    [machine.accessoryIds]
  );
  const weightEntries = tracksWeight
    ? entriesForSelectedVariant.filter((entry) => typeof entry.weightKg === "number")
    : [];
  const cardioEntries = entriesForSelectedVariant.filter(
    (entry) => typeof entry.durationMin === "number"
  );
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
  const [isRestSectionOpen, setIsRestSectionOpen] = React.useState(false);
  const [isLastPerformanceOpen, setIsLastPerformanceOpen] = React.useState(false);
  const [isTodayPerformanceOpen, setIsTodayPerformanceOpen] = React.useState(false);
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
  const [isWarmupConfirmed, setIsWarmupConfirmed] = React.useState(false);
  const [isWarmupDismissed, setIsWarmupDismissed] = React.useState(false);
  const [isWarmupSuggestionOpen, setIsWarmupSuggestionOpen] = React.useState(false);
  const [activeRestTimer, setActiveRestTimer] = React.useState<{
    setNumber: number;
    remainingSec: number;
  } | null>(null);
  const [note, setNote] = React.useState("");
  const lastCountdownBeepRef = React.useRef<number | null>(null);
  const lastWarmupSuggestionPressAtRef = React.useRef(0);
  const selectedMachineImage = machineImages[selectedImageIndex] ?? machineImage;
  const selectedAccessory = accessories.find(
    (accessory) => accessory.id === selectedAccessoryId
  );
  const latestProgressionAdvice = !isCardio
    ? getTrendProgressionAdvice(entriesForSelectedVariant, machine) ?? getEntryProgressionAdvice(latestEntry)
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
    setIsWarmupConfirmed(false);
    setIsWarmupDismissed(false);
    setIsWarmupSuggestionOpen(false);
  }, [machine.id, latestEntry?.id, selectedVariant?.id]);

  React.useEffect(() => {
    setIsRestSectionOpen(false);
    setIsLastPerformanceOpen(false);
    setIsTodayPerformanceOpen(false);
    const rememberedDraft = Object.values(draftsRef.current).filter((draft) => draft.variantId === selectedVariantId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    setSelectedAccessoryId(rememberedDraft ? rememberedDraft.accessoryId : getRememberedAccessory(machine, entries, selectedVariantId));
  }, [machine.id, selectedVariantId]);

  React.useEffect(() => {
    baselineRef.current = null;
    savedRef.current = false;
    setInitializedKey(draftKey);
    const draft = draftsRef.current[draftKey];
    if (draft) {
      setWeightKg(draft.weightKg); setSets(draft.sets); setReps(draft.reps);
      setDurationMin(draft.durationMin); setSpeedKph(draft.speedKph); setInclinePercent(draft.inclinePercent);
      setFeeling(draft.feeling); setRpe(draft.rpe); setPainLevel(draft.painLevel); setPainLocation(draft.painLocation);
      setTechniqueQuality(draft.techniqueQuality); setRestSeconds(draft.restSeconds); setSetLogs(draft.setLogs); setNote(draft.note);
      setDraftMessage("Rozpracovany zapis obnoveny. Zatial nie je v historii.");
      return;
    }
    setDraftMessage("");
    const suggestedWorkingWeight = suggestWorkingWeight(entriesForSelectedVariant, machine);
    const workingSets = clampSetCount(plannedExercise?.sets ?? latestEntry?.sets ?? 4);
    const workingReps = plannedExercise?.reps ?? latestEntry?.reps ?? trainingGuidance.defaultRepMax ?? 10;
    const workingRest = plannedExercise
      ? Math.round((plannedExercise.recommendedRestMinSec + plannedExercise.recommendedRestMaxSec) / 2)
      : latestEntry?.restSeconds ?? restTimerSeconds;

    setWeightKg(tracksWeight && suggestedWorkingWeight ? String(suggestedWorkingWeight) : "");
    setSets(String(workingSets));
    setReps(String(workingReps));
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
    setRestSeconds(String(workingRest));
    const warmupLogs: TrainingSetLog[] = [];
    const existingWorkingLogs =
      latestEntry?.setLogs
        ?.filter((setLog) => setLog.setType !== "warmup")
        .map((setLog, index) => ({
          ...setLog,
          id: `set-working-${index + 1}-${Date.now()}`,
          setNumber: warmupLogs.length + index + 1,
          setType: "working" as const,
          weightKg: tracksWeight ? suggestedWorkingWeight ?? setLog.weightKg : undefined,
          reps: workingReps,
          restSecondsUsed: workingRest,
          techniqueQuality: setLog.techniqueQuality ?? latestEntry.techniqueQuality ?? "cista",
          completed: false
        }))
        .slice(0, workingSets) ?? [];
    const generatedWorkingLogs = Array.from(
      { length: Math.max(0, workingSets - existingWorkingLogs.length) },
      (_item, index) =>
        createSetLog({
          index: warmupLogs.length + existingWorkingLogs.length + index,
          weightKg: tracksWeight ? suggestedWorkingWeight : undefined,
          reps: workingReps,
          rpe: latestEntry?.rpe ?? 8,
          painLocation: latestEntry?.painLocation ?? "nie",
          painLevel: latestEntry?.painLevel ?? 0,
          restSeconds: workingRest,
          techniqueQuality: latestEntry?.techniqueQuality ?? "cista",
          setType: "working"
        })
    );

    setSetLogs([...warmupLogs, ...existingWorkingLogs, ...generatedWorkingLogs].map(
      (setLog, index) => ({ ...setLog, setNumber: index + 1 })
    ));
    setCollapsedSetIds({});
    setActiveRestTimer(null);
  }, [latestEntry?.id, machine.id, restTimerSeconds, selectedVariant?.id, selectedAccessoryId, tracksWeight, trainingGuidance, plannedExercise]);

  React.useEffect(() => {
    if (initializedKey !== draftKey || savedRef.current) return;
    const draft = { variantId: selectedVariantId, accessoryId: selectedAccessoryId, weightKg, sets, reps, durationMin, speedKph, inclinePercent, feeling, rpe, painLevel, painLocation, techniqueQuality, restSeconds, setLogs, note };
    const raw = JSON.stringify(draft);
    if (baselineRef.current === null) { baselineRef.current = raw; return; }
    if (baselineRef.current === raw) return;
    baselineRef.current = raw;
    draftsRef.current[draftKey] = { ...draft, updatedAt: new Date().toISOString() };
    void writeDrafts(storageKey, draftsRef.current).then(() => setDraftMessage("Rozpracovany zapis priebezne ulozeny na tomto zariadeni."))
      .catch(() => setDraftMessage("Zapis sa nepodarilo priebezne ulozit. Nezatvaraj ho, kym neulozis vykon."));
  }, [initializedKey, draftKey, weightKg, sets, reps, durationMin, speedKph, inclinePercent, feeling, rpe, painLevel, painLocation, techniqueQuality, restSeconds, setLogs, note]);
  const clearSavedDraft = () => {
    savedRef.current = true;
    delete draftsRef.current[draftKey];
    void writeDrafts(storageKey, draftsRef.current).catch(() => console.log("Draft cleanup failed"));
  };

  React.useEffect(() => {
    if (!activeRestTimer) {
      lastCountdownBeepRef.current = null;
      return;
    }

    if (activeRestTimer.remainingSec <= 0) {
      setActiveRestTimer(null);
      playRestDoneSound();
      triggerRestCompleteHaptic();
      return;
    }

    if (
      activeRestTimer.remainingSec <= 3 &&
      lastCountdownBeepRef.current !== activeRestTimer.remainingSec
    ) {
      lastCountdownBeepRef.current = activeRestTimer.remainingSec;
      playCountdownBeep(activeRestTimer.remainingSec);
    }

    const interval = setInterval(() => {
      setActiveRestTimer((current) =>
        current ? { ...current, remainingSec: Math.max(0, current.remainingSec - 1) } : null
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRestTimer]);

  const adjustWeight = (delta: number) => {
    if (!tracksWeight) {
      return;
    }

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
          : setLog.manualOverride
            ? setLog
            : { ...setLog, reps: parsedReps }
      )
    );
  };

  const addSuggestedWarmupSets = () => {
    if (!tracksWeight) {
      return;
    }

    const workingWeight = Number(weightKg) || suggestWorkingWeight(entriesForSelectedVariant, machine);
    const warmupLogs = trainingGuidance.warmupSets.map((warmupSet, index) =>
      createSetLog({
        index,
        weightKg:
          warmupSet.weightKg ??
          getWarmupWeight(workingWeight, warmupSet.percent),
        reps: warmupSet.reps,
        rpe: 5,
        painLocation: "nie",
        painLevel: 0,
        restSeconds: Number(restSeconds) || restTimerSeconds,
        techniqueQuality,
        setType: "warmup",
        targetPercent: warmupSet.percent
      })
    );

    setSetLogs((currentLogs) => {
      const workingLogs = currentLogs.filter((setLog) => setLog.setType !== "warmup");

      return [...warmupLogs, ...workingLogs].map((setLog, index) => ({
        ...setLog,
        setNumber: index + 1
      }));
    });
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
            weightKg: tracksWeight ? Number(weightKg) || undefined : undefined,
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
    const hasNextUncompletedSet = setLogs.some(
      (setLog) => setLog.setNumber > setNumber && !setLog.completed
    );

    updateSetLog(setNumber, {
      completed: true,
      completedAt: now,
      restSecondsUsed: Number(restSeconds) || restTimerSeconds
    });
    const completedSet = setLogs.find((setLog) => setLog.setNumber === setNumber);

    if (completedSet) {
      setCollapsedSetIds((current) => ({ ...current, [completedSet.id]: true }));
    }
    setActiveRestTimer(
      hasNextUncompletedSet
        ? {
            setNumber,
            remainingSec: Number(restSeconds) || restTimerSeconds
          }
        : null
    );
  };

  const handleSave = () => {
    if (isCardio) {
      const parsedDuration = Number(durationMin);
      const parsedSpeed = Number(speedKph);
      const parsedIncline = Number(inclinePercent);

      if (!parsedDuration || parsedSpeed < 0 || parsedIncline < 0) {
        return;
      }

      clearSavedDraft();
      onSaveEntry({
        machineId: machine.id,
        accessoryId: selectedAccessory?.id,
        accessoryNameSk: selectedAccessory?.nameSk,
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
        weightKg: tracksWeight ? setLog.weightKg ?? parsedWeight : undefined,
        reps: setLog.reps ?? Number(reps),
        rpe,
        painLocation: painLevel > 0 ? painLocation : "nie",
        painLevel,
        restSecondsUsed: (setLog.restSecondsUsed ?? Number(restSeconds)) || restTimerSeconds,
        techniqueQuality
      })
    );
    const workingLogsForSave = logsForSave.filter((setLog) => setLog.setType !== "warmup");
    const performanceLogs = workingLogsForSave.length > 0 ? workingLogsForSave : logsForSave;
    const parsedSets = performanceLogs.length;
    const parsedReps = Math.round(
      performanceLogs.reduce((sum, setLog) => sum + (setLog.reps ?? 0), 0) /
        Math.max(1, parsedSets)
    );
    const averageWeight = tracksWeight
      ?
      Math.round(
        (performanceLogs.reduce((sum, setLog) => sum + (setLog.weightKg ?? 0), 0) /
          Math.max(1, parsedSets)) *
          100
      ) / 100
      : undefined;
    const averageRpe =
      Math.round(
        (performanceLogs.reduce((sum, setLog) => sum + (setLog.rpe ?? rpe), 0) /
          Math.max(1, parsedSets)) *
          10
      ) / 10;
    const maxPainLevel = Math.max(...logsForSave.map((setLog) => setLog.painLevel ?? 0), painLevel);

    if ((tracksWeight && !averageWeight) || !parsedSets || !parsedReps) {
      return;
    }

    clearSavedDraft();
    onSaveEntry({
      machineId: machine.id,
      exerciseVariantId: selectedVariant?.id,
      exerciseVariantNameSk: selectedVariant?.nameSk,
      accessoryId: selectedAccessory?.id,
      accessoryNameSk: selectedAccessory?.nameSk,
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
    <View style={styles.screenRoot}>
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

      {!isCardio ? <MachineSetupCard setup={userExerciseProfile?.machineSetup} lastWeight={latestEntry?.weightKg} onSave={onSaveMachineSetup} /> : null}
      {draftMessage ? <Text accessibilityRole="alert" style={styles.subtitle}>{draftMessage}</Text> : null}
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
          <Tag label={selectedVariant?.muscleGroup ?? machine.muscleGroup} />
        </View>
        <Text style={styles.description}>{machine.descriptionSk}</Text>
        {machine.exerciseVariants?.length ? (
          <View style={styles.variantBox}>
            <Text style={styles.variantTitle}>Vyber cvik na tomto stroji</Text>
            <View style={styles.variantGrid}>
              {machine.exerciseVariants.map((variant) => {
                const isActive = selectedVariant?.id === variant.id;

                return (
                  <Pressable
                    key={variant.id}
                    onPress={() => {
                      triggerTapHaptic();
                      setSelectedVariantId(variant.id);
                    }}
                    style={[styles.variantButton, isActive ? styles.variantButtonActive : null]}
                  >
                    <Text
                      style={[
                        styles.variantButtonText,
                        isActive ? styles.variantButtonTextActive : null
                      ]}
                    >
                      {variant.nameSk}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {selectedVariant ? (
              <>
                <Text style={styles.variantDescription}>{selectedVariant.descriptionSk}</Text>
                <Text style={styles.variantHint}>{getVariantLoadHint(selectedVariant)}</Text>
              </>
            ) : null}
          </View>
        ) : null}
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

      {accessories.length ? (
        <SectionCard
          title="Pomôcka ku kladke"
          subtitle="Vyber úchop, ktorý používaš pri dnešnom výkone."
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.accessoryRow}
          >
            <Pressable
              onPress={() => {
                triggerTapHaptic();
                setSelectedAccessoryId(null);
              }}
              style={[
                styles.accessoryCard,
                !selectedAccessoryId ? styles.accessoryCardActive : null
              ]}
            >
              <View style={styles.noAccessoryImage}>
                <Text style={styles.noAccessoryText}>Bez</Text>
              </View>
              <Text style={styles.accessoryCode}>Bez pomôcky</Text>
            </Pressable>
            {accessories.map((accessory) => {
              const accessoryImage = getMachineImage(accessory.imageAsset);
              const isSelected = accessory.id === selectedAccessoryId;

              return (
                <Pressable
                  key={accessory.id}
                  onPress={() => {
                    triggerTapHaptic();
                    setSelectedAccessoryId(accessory.id);
                  }}
                  style={[
                    styles.accessoryCard,
                    isSelected ? styles.accessoryCardActive : null
                  ]}
                >
                  {accessoryImage ? (
                    <Image
                      source={accessoryImage}
                      style={styles.accessoryImage}
                      resizeMode="contain"
                    />
                  ) : null}
                  <Text style={styles.accessoryCode}>C. {accessory.id}</Text>
                  <Text style={styles.accessoryName}>{accessory.nameSk}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Odporucana prestavka"
        subtitle="Orientacne odporucanie pre rast svalov pri tomto stroji."
        collapsed={!isRestSectionOpen}
        onDoublePress={() => {
          triggerTapHaptic();
          setIsRestSectionOpen((current) => !current);
        }}
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
        collapsed={!isLastPerformanceOpen}
        onDoublePress={() => {
          triggerTapHaptic();
          setIsLastPerformanceOpen((current) => !current);
        }}
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
              ) : tracksWeight ? (
                <>
                  <StatChip label="Vaha" value={`${latestEntry.weightKg ?? 0} kg`} />
                  <StatChip
                    label="Serie x op."
                    value={`${latestEntry.sets ?? 0} x ${latestEntry.reps ?? 0}`}
                  />
                </>
              ) : (
                <>
                  <StatChip label="Typ" value="vlastna vaha" />
                  <StatChip
                    label="Serie x op."
                    value={`${latestEntry.sets ?? 0} x ${latestEntry.reps ?? 0}`}
                  />
                </>
              )}
            </View>
            {latestEntry.exerciseVariantNameSk ? (
              <Text style={styles.note}>Variant: {latestEntry.exerciseVariantNameSk}</Text>
            ) : null}
            {latestEntry.accessoryNameSk ? (
              <Text style={styles.note}>Pomôcka: {latestEntry.accessoryNameSk}</Text>
            ) : null}
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
            : tracksWeight
              ? "Zakladny prehlad vahy a poctu treningov na tomto stroji."
              : "Zakladny prehlad poctu treningov a opakovani s vlastnou vahou."
        }
      >
        <View style={styles.statsRow}>
          {isCardio ? (
            <>
              <StatChip label="Posledny cas" value={`${latestEntry?.durationMin ?? 0} min`} />
              <StatChip label="Najrychlejsie" value={`${maxCardioSpeed} km/h`} />
              <StatChip label="Treningy" value={String(entriesForSelectedVariant.length)} />
              <StatChip label="Najdlhsi cas" value={`${maxCardioDuration} min`} />
            </>
          ) : tracksWeight ? (
            <>
              <StatChip label="Posledna vaha" value={`${latestEntry?.weightKg ?? 0} kg`} />
              <StatChip label="Najvyssia vaha" value={`${maxWeight} kg`} />
              <StatChip label="Treningy" value={String(entries.length)} />
              <StatChip
                label="Progres 30 dni"
                value={`${monthProgress >= 0 ? "+" : ""}${monthProgress} kg`}
              />
            </>
          ) : (
            <>
              <StatChip label="Zataz" value="vlastna vaha" />
              <StatChip label="Treningy" value={String(entriesForSelectedVariant.length)} />
              <StatChip label="Posledne serie" value={String(latestEntry?.sets ?? 0)} />
              <StatChip label="Posledne op." value={String(latestEntry?.reps ?? 0)} />
            </>
          )}
        </View>

        {tracksWeight && recentWeightBars.length > 0 ? (
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
        collapsed={!isTodayPerformanceOpen}
        onDoublePress={() => {
          triggerTapHaptic();
          setIsTodayPerformanceOpen((current) => !current);
        }}
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
            {tracksWeight ? <Text style={styles.adviceMeta}>{getWorkingWeightReason(entriesForSelectedVariant, machine)}</Text> : null}
            {tracksWeight && plannedProgressionAdvice ? (
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
            {tracksWeight && trainingGuidance.warmupSets.length && !isWarmupConfirmed && !isWarmupDismissed ? (
              <View style={styles.warmupSuggestionCard}>
                <Pressable
                  accessibilityHint="Dvojitym tuknutim zobrazis alebo skryjes navrh rozcvicky"
                  accessibilityRole="button"
                  onPress={() => {
                    const now = Date.now();

                    if (now - lastWarmupSuggestionPressAtRef.current <= 420) {
                      lastWarmupSuggestionPressAtRef.current = 0;
                      triggerTapHaptic();
                      setIsWarmupSuggestionOpen((current) => !current);
                      return;
                    }

                    lastWarmupSuggestionPressAtRef.current = now;
                  }}
                >
                  <Text style={styles.warmupSuggestionTitle}>AI navrhuje rozcvicku</Text>
                </Pressable>
                {isWarmupSuggestionOpen ? (
                  <>
                    <Text style={styles.warmupSuggestionText}>
                      Tento cvik alebo vaha uz patri medzi narocnejsie. Dve lahke serie pomozu
                      prehriat klby, svaly a znizit riziko pretazenia.
                    </Text>
                    <View style={styles.warmupSuggestionList}>
                      {trainingGuidance.warmupSets.map((warmupSet) => (
                        <Text key={`${machine.id}-suggest-${warmupSet.percent}`} style={styles.warmupText}>
                          {warmupSet.percent}% |{" "}
                          {getWarmupWeight(Number(weightKg), warmupSet.percent) ??
                            warmupSet.weightKg ??
                            "-"}{" "}
                          kg | {warmupSet.reps} op.
                        </Text>
                      ))}
                    </View>
                    <View style={styles.warmupSuggestionActions}>
                      <Pressable
                        onPress={() => {
                          triggerSuccessHaptic();
                          addSuggestedWarmupSets();
                          setIsWarmupConfirmed(true);
                        }}
                        style={styles.warmupSuggestionPrimary}
                      >
                        <Text style={styles.warmupSuggestionPrimaryText}>Ano, pridaj rozcvicku</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          triggerTapHaptic();
                          setIsWarmupDismissed(true);
                        }}
                        style={styles.warmupSuggestionSecondary}
                      >
                        <Text style={styles.warmupSuggestionSecondaryText}>Dnes netreba</Text>
                      </Pressable>
                    </View>
                  </>
                ) : null}
              </View>
            ) : null}
            {tracksWeight && trainingGuidance.warmupSets.length && isWarmupConfirmed ? (
              <View style={styles.warmupConfirmedCard}>
                <Text style={styles.warmupConfirmedText}>
                  Rozcvicka pridana hore pred pracovne serie. Kg aj opakovania vies stale rucne
                  upravit.
                </Text>
              </View>
            ) : null}
            {tracksWeight ? (
              <>
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
              </>
            ) : (
              <View style={styles.bodyweightInfoCard}>
                <Text style={styles.bodyweightInfoTitle}>Vlastna vaha</Text>
                <Text style={styles.bodyweightInfoText}>
                  Kg tu nezapisujeme. Ak raz pojdes s vestou alebo kotucom, zapiseme to
                  zatial do poznamky a neskor dorobime samostatne pole.
                </Text>
              </View>
            )}

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

            <Text style={styles.fieldLabel}>Serie k tomuto cviku</Text>
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
                const hasNextUncompletedSet = setLogs.some(
                  (nextSetLog) =>
                    nextSetLog.setNumber > setLog.setNumber && !nextSetLog.completed
                );

                if (isCollapsed) {
                  return (
                    <View key={setLog.id} style={styles.collapsedSetCard}>
                      <View style={styles.collapsedSetTextWrap}>
                        <Text style={styles.collapsedSetTitle}>OK {setTitle}</Text>
                        <Text style={styles.collapsedSetMeta}>
                          {tracksWeight
                            ? `${setLog.weightKg ?? 0} kg x ${setLog.reps ?? 0} op.`
                            : `vlastna vaha x ${setLog.reps ?? 0} op.`}
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
                            {setLog.completed
                              ? "Hotovo"
                              : hasNextUncompletedSet
                                ? "Hotovo + pauza"
                                : "Hotovo"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                    <View style={styles.inlineFields}>
                      {tracksWeight ? (
                        <View style={styles.inlineField}>
                          <Text style={styles.setFieldLabel}>kg</Text>
                          <TextInput
                            value={setLog.weightKg ? String(setLog.weightKg) : weightKg}
                            onChangeText={(value) =>
                              updateSetLog(setLog.setNumber, {
                                manualOverride: true,
                                weightKg: Number(value) || undefined
                              })
                            }
                            keyboardType="decimal-pad"
                            style={styles.miniInput}
                          />
                        </View>
                      ) : null}
                      <View style={styles.inlineField}>
                        <Text style={styles.setFieldLabel}>op.</Text>
                        <TextInput
                          value={setLog.reps ? String(setLog.reps) : reps}
                          onChangeText={(value) =>
                            updateSetLog(setLog.setNumber, {
                              manualOverride: true,
                              reps: Number(value) || undefined
                            })
                          }
                          keyboardType="number-pad"
                          style={styles.miniInput}
                        />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <Text style={styles.fieldLabel}>Pocit po cviku</Text>
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

        {!isCardio ? (
          <>
            <Text style={styles.fieldLabel}>Kolko opakovani by si este dal? (RPE 1-10)</Text>
            <Text style={styles.helperText}>
              RPE 8 znamena asi 2 opakovania v rezerve. RPE 10 znamena, ze dalsie by uz
              neslo cisto.
            </Text>
            <TextInput
              value={String(rpe)}
              onChangeText={(value) => setRpe(Math.min(10, Math.max(1, Number(value) || 1)))}
              keyboardType="number-pad"
              style={styles.smallInput}
            />
          </>
        ) : null}

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
                  : entry.weightKg
                    ? `${entry.weightKg} kg - ${entry.sets ?? 0} serie - ${entry.reps ?? 0} opakovani`
                    : `vlastna vaha - ${entry.sets ?? 0} serie - ${entry.reps ?? 0} opakovani`}
              </Text>
              {entry.exerciseVariantNameSk ? (
                <Text style={styles.timelineText}>
                  Variant: {entry.exerciseVariantNameSk}
                </Text>
              ) : null}
              {entry.accessoryNameSk ? (
                <Text style={styles.timelineText}>
                  Pomôcka: {entry.accessoryNameSk}
                </Text>
              ) : null}
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
                        `${setLog.setNumber}. ${
                          setLog.weightKg ? `${setLog.weightKg}kg` : "vlastna vaha"
                        } x ${setLog.reps ?? 0} (RPE ${setLog.rpe ?? "-"})`
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
    {activeRestTimer ? (
      <View style={styles.floatingTimerCard}>
        <Text style={styles.timerTitle}>
          Pauza po {activeRestTimer.setNumber}. serii
        </Text>
        <Text style={styles.timerValue}>
          {formatTimer(activeRestTimer.remainingSec)}
        </Text>
        <Text style={styles.timerSubtitle}>Dalsia seria za chvilu. Nadych, vydych, Swarcik caka.</Text>
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
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  screenRoot: {
    flex: 1
  },
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 220
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
  accessoryRow: {
    gap: 12,
    paddingRight: 6
  },
  accessoryCard: {
    width: 170,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.inputSurface,
    padding: 10,
    gap: 6
  },
  accessoryCardActive: {
    borderColor: colors.highlight,
    backgroundColor: colors.highlightSoft
  },
  accessoryImage: {
    width: "100%",
    height: 105,
    borderRadius: 12,
    backgroundColor: "#f4f4f4"
  },
  noAccessoryImage: {
    width: "100%",
    height: 105,
    borderRadius: 12,
    backgroundColor: colors.chipSurface,
    alignItems: "center",
    justifyContent: "center"
  },
  noAccessoryText: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: "900"
  },
  accessoryCode: {
    color: colors.highlight,
    fontSize: 13,
    fontWeight: "900"
  },
  accessoryName: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700"
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
  helperText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -4,
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
  variantBox: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceStrong,
    padding: 14,
    gap: 10,
    marginTop: 8
  },
  variantTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  variantGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  variantButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputSurface,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  variantButtonActive: {
    backgroundColor: colors.highlight,
    borderColor: colors.highlight
  },
  variantButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  variantButtonTextActive: {
    color: "#fff8ee"
  },
  variantDescription: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700"
  },
  variantHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19
  },
  bodyweightInfoCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: "rgba(47, 122, 87, 0.16)",
    padding: 14,
    gap: 6,
    marginBottom: 12
  },
  bodyweightInfoTitle: {
    color: colors.success,
    fontSize: 16,
    fontWeight: "900"
  },
  bodyweightInfoText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20
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
  floatingTimerCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    zIndex: 30,
    minHeight: 230,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.success,
    backgroundColor: colors.surface,
    padding: 22,
    gap: 12,
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 1,
    shadowRadius: 28,
    elevation: 20
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
  timerSubtitle: {
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800"
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
  warmupSuggestionCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.highlight,
    backgroundColor: colors.highlightSoft,
    padding: 14,
    gap: 10,
    marginBottom: 12
  },
  warmupSuggestionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  warmupSuggestionText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19
  },
  warmupSuggestionList: {
    gap: 3
  },
  warmupSuggestionActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  warmupSuggestionPrimary: {
    borderRadius: 999,
    backgroundColor: colors.highlight,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  warmupSuggestionPrimaryText: {
    color: "#fff8ee",
    fontSize: 13,
    fontWeight: "900"
  },
  warmupSuggestionSecondary: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  warmupSuggestionSecondaryText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900"
  },
  warmupConfirmedCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.success,
    backgroundColor: "rgba(47, 122, 87, 0.16)",
    padding: 12,
    marginBottom: 12
  },
  warmupConfirmedText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "800"
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

  if (label === "Exercise variant") {
    return "variant cviku";
  }

  if (label === "Assistance weight") {
    return "dopomoc stroja";
  }

  if (label === "Bodyweight") {
    return "vlastna vaha";
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
