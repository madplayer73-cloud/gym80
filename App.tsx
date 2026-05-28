import React, { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomNav } from "./src/components/BottomNav";
import { SideMenu } from "./src/components/SideMenu";
import { CameraPrepScreen } from "./src/screens/CameraPrepScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { HomeScreen, TrainerSessionSettings } from "./src/screens/HomeScreen";
import { MachineDetailScreen } from "./src/screens/MachineDetailScreen";
import { MachinesScreen } from "./src/screens/MachinesScreen";
import { mockMachines } from "./src/data/mockData";
import {
  AppTab,
  Machine,
  MuscleGroup,
  ReadinessCheck,
  ReadinessPain,
  TechniqueQuality,
  TrainingSetLog,
  UserExerciseProfile,
  WorkoutFeeling,
  WorkoutFocus,
  WorkoutSession
} from "./src/types";
import { AppColors, ThemeMode, ThemeProvider, useTheme } from "./src/theme";
import {
  buildMotivationMessage,
  buildRoutineMotivationMessage
} from "./src/utils/motivation";
import {
  CloudDataSnapshot,
  CloudUser,
  fetchCloudData,
  getCloudUser,
  initializeCloudAuth,
  isProductionWebHost,
  loginWithGoogle,
  logoutCloudUser,
  saveCloudData
} from "./src/utils/cloudData";

const STORAGE_KEY = "gym80-tracker-sessions";
const FAVORITES_STORAGE_KEY = "gym80-tracker-favorites";
const THEME_STORAGE_KEY = "gym80-tracker-theme";
const USER_EXERCISE_PROFILES_STORAGE_KEY = "gym80-tracker-user-exercise-profiles";
const CLOUD_DATA_VERSION = 1;
const WARMUP_ROUTINE_MACHINE_ID = "routine-warmup";
const COOLDOWN_ROUTINE_MACHINE_ID = "routine-cooldown";
const routineMachines: Machine[] = [
  {
    id: WARMUP_ROUTINE_MACHINE_ID,
    brand: "Trener",
    modelName: "Warmup Routine",
    displayNameSk: "Rozcvicka",
    category: "Treningova rutina",
    muscleGroup: "Kardio",
    imageHint: "Warmup routine before workout",
    descriptionSk:
      "Priprava tela pred treningom. Lahke tempo, mobilita a rozcvicovacie serie.",
    setupNoteLabel: "Cardio",
    exerciseType: "mobility",
    difficulty: "easy",
    estimatedTimeMinutes: 8,
    recommendedRestMinSec: 0,
    recommendedRestMaxSec: 0
  },
  {
    id: COOLDOWN_ROUTINE_MACHINE_ID,
    brand: "Trener",
    modelName: "Cooldown Routine",
    displayNameSk: "Schladenie",
    category: "Treningova rutina",
    muscleGroup: "Kardio",
    imageHint: "Cooldown routine after workout",
    descriptionSk:
      "Ukludnenie po treningu. Pomale vydychanie a lahke pretiahnutie.",
    setupNoteLabel: "Cardio",
    exerciseType: "mobility",
    difficulty: "easy",
    estimatedTimeMinutes: 5,
    recommendedRestMinSec: 0,
    recommendedRestMaxSec: 0
  }
];

function mapMuscleGroupToFocus(muscleGroup?: MuscleGroup): WorkoutFocus {
  if (!muscleGroup) {
    return "Vrch tela";
  }

  if (muscleGroup === "Kardio") {
    return "Oddych";
  }

  if (muscleGroup === "Nohy") {
    return "Spodok tela";
  }

  if (muscleGroup === "Brucho") {
    return "Brucho";
  }

  return "Vrch tela";
}

function getSessionFocus(
  entries: { machineId: string }[],
  machineMap: Map<string, Machine>
): WorkoutFocus {
  const focusSet = new Set(
    entries.map((entry) => mapMuscleGroupToFocus(machineMap.get(entry.machineId)?.muscleGroup))
  );

  if (focusSet.has("Spodok tela")) {
    return "Spodok tela";
  }

  if (focusSet.has("Vrch tela")) {
    return "Vrch tela";
  }

  if (focusSet.has("Brucho")) {
    return "Brucho";
  }

  return "Oddych";
}

function buildSessionSummary(focus: WorkoutFocus, entryCount: number) {
  if (focus === "Spodok tela") {
    return `Dnes si zapisoval spodok tela. Zatial je v treningu ${entryCount} cvik${entryCount === 1 ? "" : "y"}.`;
  }

  if (focus === "Brucho") {
    return `Dnes si zapisoval brucho a stred tela. Zatial je v treningu ${entryCount} cvik${entryCount === 1 ? "" : "y"}.`;
  }

  if (focus === "Oddych") {
    return `Dnes je zapisane kardio alebo lahsia aktivita. Zatial je v treningu ${entryCount} zaznam${entryCount === 1 ? "" : "y"}.`;
  }

  return `Dnes si zapisoval vrch tela. Zatial je v treningu ${entryCount} cvik${entryCount === 1 ? "" : "y"}.`;
}

function isWorkoutSession(value: unknown): value is WorkoutSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as WorkoutSession;

  return (
    typeof session.id === "string" &&
    typeof session.workoutDate === "string" &&
    typeof session.focus === "string" &&
    typeof session.coachSummary === "string" &&
    Array.isArray(session.entries) &&
    session.entries.every(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        typeof entry.id === "string" &&
        typeof entry.machineId === "string" &&
        typeof entry.completedAt === "string"
    )
  );
}

function isUserExerciseProfiles(value: unknown): value is Record<string, UserExerciseProfile> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.values(value as Record<string, UserExerciseProfile>).every(
    (profile) =>
      profile &&
      typeof profile === "object" &&
      typeof profile.machineId === "string" &&
      typeof profile.updatedAt === "string"
  );
}

function buildCloudSnapshot({
  sessions,
  favoriteMachineIds,
  userExerciseProfiles,
  themeMode
}: {
  sessions: WorkoutSession[];
  favoriteMachineIds: string[];
  userExerciseProfiles: Record<string, UserExerciseProfile>;
  themeMode: ThemeMode;
}): CloudDataSnapshot {
  return {
    version: CLOUD_DATA_VERSION,
    updatedAt: new Date().toISOString(),
    sessions,
    favoriteMachineIds,
    userExerciseProfiles,
    themeMode
  };
}

export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [hasLoadedTheme, setHasLoadedTheme] = useState(false);

  React.useEffect(() => {
    const loadStoredTheme = async () => {
      try {
        const rawValue = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (rawValue === "light" || rawValue === "dark") {
          setThemeMode(rawValue);
        }
      } catch (error) {
        console.log("Failed to load stored theme", error);
      } finally {
        setHasLoadedTheme(true);
      }
    };

    void loadStoredTheme();
  }, []);

  React.useEffect(() => {
    if (!hasLoadedTheme) {
      return;
    }

    const persistTheme = async () => {
      try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, themeMode);
      } catch (error) {
        console.log("Failed to store theme", error);
      }
    };

    void persistTheme();
  }, [hasLoadedTheme, themeMode]);

  return (
    <ThemeProvider mode={themeMode} setMode={setThemeMode}>
      <AppShell />
    </ThemeProvider>
  );
}

function AppShell() {
  const { colors, mode, setMode } = useTheme();
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [selectedMachineSource, setSelectedMachineSource] = useState<"home" | "machines">("machines");
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [favoriteMachineIds, setFavoriteMachineIds] = useState<string[]>([]);
  const [userExerciseProfiles, setUserExerciseProfiles] = useState<
    Record<string, UserExerciseProfile>
  >({});
  const [trainerSettings, setTrainerSettings] = useState<TrainerSessionSettings>({
    durationMin: 60,
    warmupMin: 8,
    cooldownMin: 5,
    manualFocus: null,
    readiness: {
      energia: 3,
      spanok: "priemerny",
      svalovica: "ziadna",
      bolest: "nie",
      cielDna: "normal",
      trainingLevel: "stredne_pokrocily",
      noEgoMode: true
    } satisfies ReadinessCheck,
    hasStarted: false
  });
  const [hasLoadedStoredSessions, setHasLoadedStoredSessions] = useState(false);
  const [hasLoadedStoredFavorites, setHasLoadedStoredFavorites] = useState(false);
  const [hasLoadedStoredProfiles, setHasLoadedStoredProfiles] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAuthExport, setShowAuthExport] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [cloudUser, setCloudUser] = useState<CloudUser | null>(null);
  const [cloudStatus, setCloudStatus] = useState<
    "loading" | "offline" | "syncing" | "saved" | "error"
  >("loading");
  const [hasHydratedCloud, setHasHydratedCloud] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const shouldRequireCloudLogin = isProductionWebHost();

  const machineMap = useMemo(
    () =>
      new Map(
        [...mockMachines, ...routineMachines].map((machine) => [machine.id, machine])
      ),
    []
  );

  const latestEntries = useMemo(
    () =>
      sessions.flatMap((session) =>
        session.entries.map((entry) => ({
          ...entry,
          workoutDate: session.workoutDate,
          workoutFocus: session.focus,
          machine: machineMap.get(entry.machineId)
        }))
      ),
    [machineMap, sessions]
  );

  const machineUsageCounts = useMemo(() => {
    return sessions.reduce<Record<string, number>>((counts, session) => {
      session.entries.forEach((entry) => {
        counts[entry.machineId] = (counts[entry.machineId] ?? 0) + 1;
      });

      return counts;
    }, {});
  }, [sessions]);

  const historyExportValue = useMemo(
    () =>
      JSON.stringify(
        {
          app: "gym80-tracker",
          version: 1,
          exportedAt: new Date().toISOString(),
          sessions,
          userExerciseProfiles
        },
        null,
        2
      ),
    [sessions, userExerciseProfiles]
  );

  const openMachine = (machine: Machine, source: "home" | "machines" = "machines") => {
    setSelectedMachine(machine);
    setSelectedMachineSource(source);
    setActiveTab("machine-detail");
  };

  const openCameraPrep = () => {
    setActiveTab("camera");
  };

  const navigateBackFromMachine = () => {
    setActiveTab("machines");
  };

  const navigateBackToPlan = () => {
    setActiveTab("home");
  };

  const navigateBackFromCamera = () => {
    setActiveTab("home");
  };

  React.useEffect(() => {
    let unsubscribe: undefined | (() => void);
    let isCancelled = false;

    const initializeAuth = async () => {
      try {
        const auth = await initializeCloudAuth();

        if (!auth) {
          setCloudStatus("offline");
          return;
        }

        const user = await getCloudUser();

        if (!isCancelled) {
          setCloudUser(user);
          setCloudStatus(user ? "syncing" : "offline");
        }

        unsubscribe = auth.onAuthChange((_event, nextUser) => {
          setCloudUser((nextUser as CloudUser | null) ?? null);
          setHasHydratedCloud(false);
          setCloudStatus(nextUser ? "syncing" : "offline");
        });
      } catch (error) {
        console.log("Cloud auth init failed", error);
        setCloudStatus("offline");
      } finally {
        if (!isCancelled) {
          setAuthReady(true);
        }
      }
    };

    void initializeAuth();

    return () => {
      isCancelled = true;
      unsubscribe?.();
    };
  }, []);

  React.useEffect(() => {
    const loadStoredSessions = async () => {
      try {
        const rawValue = await AsyncStorage.getItem(STORAGE_KEY);

        if (rawValue) {
          const parsed = JSON.parse(rawValue);

          if (Array.isArray(parsed)) {
            setSessions(parsed);
          }
        }
      } catch (error) {
        console.log("Failed to load stored sessions", error);
      } finally {
        setHasLoadedStoredSessions(true);
      }
    };

    void loadStoredSessions();
  }, []);

  React.useEffect(() => {
    const loadStoredFavorites = async () => {
      try {
        const rawValue = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);

        if (rawValue) {
          const parsed = JSON.parse(rawValue);

          if (Array.isArray(parsed)) {
            setFavoriteMachineIds(parsed.filter((item) => typeof item === "string"));
          }
        }
      } catch (error) {
        console.log("Failed to load stored favorites", error);
      } finally {
        setHasLoadedStoredFavorites(true);
      }
    };

    void loadStoredFavorites();
  }, []);

  React.useEffect(() => {
    const loadStoredProfiles = async () => {
      try {
        const rawValue = await AsyncStorage.getItem(USER_EXERCISE_PROFILES_STORAGE_KEY);

        if (rawValue) {
          const parsed = JSON.parse(rawValue);

          if (isUserExerciseProfiles(parsed)) {
            setUserExerciseProfiles(parsed);
          }
        }
      } catch (error) {
        console.log("Failed to load stored exercise profiles", error);
      } finally {
        setHasLoadedStoredProfiles(true);
      }
    };

    void loadStoredProfiles();
  }, []);

  React.useEffect(() => {
    if (!cloudUser) {
      setHasHydratedCloud(false);
      return;
    }

    if (
      !hasLoadedStoredSessions ||
      !hasLoadedStoredFavorites ||
      !hasLoadedStoredProfiles ||
      hasHydratedCloud
    ) {
      return;
    }

    let isCancelled = false;

    const hydrateCloudData = async () => {
      try {
        setCloudStatus("syncing");
        const cloudData = await fetchCloudData();

        if (isCancelled) {
          return;
        }

        const cloudSessionsAreValid =
          Array.isArray(cloudData?.sessions) &&
          cloudData.sessions.every(isWorkoutSession);
        const shouldUseCloudData =
          cloudSessionsAreValid &&
          (cloudData.sessions.length > 0 || sessions.length === 0);

        if (shouldUseCloudData) {
          setSessions(cloudData.sessions);
          setFavoriteMachineIds(
            Array.isArray(cloudData.favoriteMachineIds)
              ? cloudData.favoriteMachineIds.filter((item) => typeof item === "string")
              : []
          );

          if (cloudData.themeMode === "light" || cloudData.themeMode === "dark") {
            setMode(cloudData.themeMode);
          }

          if (isUserExerciseProfiles(cloudData.userExerciseProfiles)) {
            setUserExerciseProfiles(cloudData.userExerciseProfiles);
          }

          setToastMessage("Cloud zaloha nacitana");
        } else {
          await saveCloudData(
            buildCloudSnapshot({
              sessions,
              favoriteMachineIds,
              userExerciseProfiles,
              themeMode: mode
            })
          );
          setToastMessage("Cloud zaloha vytvorena");
        }

        setHasHydratedCloud(true);
        setCloudStatus("saved");
      } catch (error) {
        console.log("Cloud hydrate failed", error);
        setCloudStatus("error");
        setToastMessage("Cloud synchronizacia zatial nejde");
      }
    };

    void hydrateCloudData();

    return () => {
      isCancelled = true;
    };
  }, [
    cloudUser,
    favoriteMachineIds,
    hasHydratedCloud,
    hasLoadedStoredFavorites,
    hasLoadedStoredProfiles,
    hasLoadedStoredSessions,
    mode,
    sessions,
    userExerciseProfiles,
    setMode
  ]);

  React.useEffect(() => {
    if (
      !cloudUser ||
      !hasHydratedCloud ||
      !hasLoadedStoredSessions ||
      !hasLoadedStoredFavorites ||
      !hasLoadedStoredProfiles
    ) {
      return;
    }

    const timeout = setTimeout(() => {
      setCloudStatus("syncing");
      saveCloudData(
        buildCloudSnapshot({
          sessions,
          favoriteMachineIds,
          userExerciseProfiles,
          themeMode: mode
        })
      )
        .then(() => setCloudStatus("saved"))
        .catch((error) => {
          console.log("Cloud save failed", error);
          setCloudStatus("error");
        });
    }, 900);

    return () => clearTimeout(timeout);
  }, [
    cloudUser,
    favoriteMachineIds,
    hasHydratedCloud,
    hasLoadedStoredFavorites,
    hasLoadedStoredProfiles,
    hasLoadedStoredSessions,
    mode,
    sessions,
    userExerciseProfiles
  ]);

  React.useEffect(() => {
    if (!hasLoadedStoredSessions) {
      return;
    }

    const persistSessions = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      } catch (error) {
        console.log("Failed to store sessions", error);
      }
    };

    void persistSessions();
  }, [hasLoadedStoredSessions, sessions]);

  React.useEffect(() => {
    if (!hasLoadedStoredFavorites) {
      return;
    }

    const persistFavorites = async () => {
      try {
        await AsyncStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(favoriteMachineIds)
        );
      } catch (error) {
        console.log("Failed to store favorites", error);
      }
    };

    void persistFavorites();
  }, [favoriteMachineIds, hasLoadedStoredFavorites]);

  React.useEffect(() => {
    if (!hasLoadedStoredProfiles) {
      return;
    }

    const persistProfiles = async () => {
      try {
        await AsyncStorage.setItem(
          USER_EXERCISE_PROFILES_STORAGE_KEY,
          JSON.stringify(userExerciseProfiles)
        );
      } catch (error) {
        console.log("Failed to store exercise profiles", error);
      }
    };

    void persistProfiles();
  }, [hasLoadedStoredProfiles, userExerciseProfiles]);

  React.useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = setTimeout(() => {
      setToastMessage(null);
    }, toastMessage.length > 28 ? 3600 : 1800);

    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const saveWorkoutEntry = ({
    machineId,
    weightKg,
    sets,
    reps,
    durationMin,
    speedKph,
    inclinePercent,
    feeling,
    rpe,
    painLocation,
    painLevel,
    techniqueQuality,
    restSeconds,
    setLogs,
    note
  }: {
    machineId: string;
    weightKg?: number;
    sets?: number;
    reps?: number;
    durationMin?: number;
    speedKph?: number;
    inclinePercent?: number;
    feeling?: WorkoutFeeling;
    rpe?: number;
    painLocation?: ReadinessPain;
    painLevel?: number;
    techniqueQuality?: TechniqueQuality;
    restSeconds?: number;
    setLogs?: TrainingSetLog[];
    note: string;
  }) => {
    const now = new Date();
    const workoutDate = now.toISOString();
    const maxSetPain = setLogs?.reduce(
      (max, setLog) => Math.max(max, setLog.painLevel ?? 0),
      0
    );
    const effectivePainLevel = Math.max(painLevel ?? 0, maxSetPain ?? 0);
    const effectivePainLocation =
      effectivePainLevel > 0 ? painLocation ?? "ine" : painLocation;
    const rpeSetLogs = setLogs?.filter((setLog) => typeof setLog.rpe === "number") ?? [];
    const averageSetRpe = rpeSetLogs.length
      ? Math.round(
          (rpeSetLogs.reduce((sum, setLog) => sum + (setLog.rpe ?? 0), 0) /
            rpeSetLogs.length) *
            10
        ) / 10
      : undefined;
    const effectiveRpe = rpe ?? (Number.isFinite(averageSetRpe) ? averageSetRpe : undefined);
    const effectiveFeeling =
      effectivePainLevel >= 5 ? ("bolest" as WorkoutFeeling) : feeling;
    const newEntry = {
      id: `entry-${machineId}-${now.getTime()}`,
      machineId,
      weightKg,
      sets,
      reps,
      durationMin,
      speedKph,
      inclinePercent,
      feeling: effectiveFeeling,
      rpe: effectiveRpe,
      painLocation: effectivePainLocation,
      painLevel: effectivePainLevel,
      techniqueQuality,
      restSeconds,
      setLogs,
      note,
      completedAt: workoutDate
    };
    const previousEntry = sessions
      .flatMap((session) => session.entries)
      .find((entry) => entry.machineId === machineId);
    const totalWorkoutEntries = sessions.reduce(
      (sum, session) => sum + session.entries.length,
      0
    );
    const motivationMessage = buildMotivationMessage({
      machine: machineMap.get(machineId),
      entry: newEntry,
      previousEntry,
      totalWorkoutEntries
    });

    setSessions((currentSessions) => {
      const todayKey = workoutDate.slice(0, 10);
      const existingToday = currentSessions.find(
        (session) => session.workoutDate.slice(0, 10) === todayKey
      );

      if (existingToday) {
        const updatedEntries = [newEntry, ...existingToday.entries];
        const updatedFocus = getSessionFocus(updatedEntries, machineMap);

        return currentSessions.map((session) =>
          session.id === existingToday.id
            ? {
                ...session,
                focus: updatedFocus,
                coachSummary: buildSessionSummary(updatedFocus, updatedEntries.length),
                entries: updatedEntries
              }
            : session
        );
      }

      const newFocus = getSessionFocus([newEntry], machineMap);
      const newSession = {
        id: `session-${todayKey}`,
        workoutDate,
        focus: newFocus,
        coachSummary: buildSessionSummary(newFocus, 1),
        entries: [newEntry]
      };

      return [newSession, ...currentSessions];
    });

    setActiveTab(selectedMachineSource === "home" ? "home" : "machines");
    setToastMessage(motivationMessage);

    setUserExerciseProfiles((currentProfiles) => {
      const previousProfile = currentProfiles[machineId];
      const shouldBlock = effectivePainLevel >= 5;
      const blockedUntil = shouldBlock
        ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : previousProfile?.blockedUntil;

      return {
        ...currentProfiles,
        [machineId]: {
          ...previousProfile,
          machineId,
          blockedUntil,
          blockedReason: shouldBlock
            ? "Bolest 5/10 alebo viac. Trener tento cvik 7 dni nebude odporucat."
            : previousProfile?.blockedReason,
          lastPainLevel: effectivePainLevel,
          lastPainLocation: effectivePainLocation,
          lastRpe: effectiveRpe,
          lastRestSeconds: restSeconds,
          lastTechniqueQuality: techniqueQuality,
          updatedAt: workoutDate
        }
      };
    });
  };

  const saveRoutineEntry = ({
    machineId,
    durationMin,
    note
  }: {
    machineId: string;
    durationMin: number;
    note: string;
  }) => {
    const now = new Date();
    const workoutDate = now.toISOString();
    const newEntry = {
      id: `entry-${machineId}-${now.getTime()}`,
      machineId,
      durationMin,
      feeling: "akurat" as WorkoutFeeling,
      note,
      completedAt: workoutDate
    };

    setSessions((currentSessions) => {
      const todayKey = workoutDate.slice(0, 10);
      const existingToday = currentSessions.find(
        (session) => session.workoutDate.slice(0, 10) === todayKey
      );

      if (existingToday) {
        const alreadyExists = existingToday.entries.some(
          (entry) => entry.machineId === machineId
        );
        const updatedEntries = alreadyExists
          ? existingToday.entries.map((entry) =>
              entry.machineId === machineId ? newEntry : entry
            )
          : [...existingToday.entries, newEntry];
        const updatedFocus = getSessionFocus(updatedEntries, machineMap);

        return currentSessions.map((session) =>
          session.id === existingToday.id
            ? {
                ...session,
                focus: updatedFocus,
                coachSummary: buildSessionSummary(updatedFocus, updatedEntries.length),
                entries: updatedEntries
              }
            : session
        );
      }

      const newFocus = getSessionFocus([newEntry], machineMap);
      const newSession = {
        id: `session-${todayKey}`,
        workoutDate,
        focus: newFocus,
        coachSummary: buildSessionSummary(newFocus, 1),
        entries: [newEntry]
      };

      return [newSession, ...currentSessions];
    });

    setToastMessage(
      machineId === WARMUP_ROUTINE_MACHINE_ID
        ? buildRoutineMotivationMessage("warmup")
        : buildRoutineMotivationMessage("cooldown")
    );
  };

  const toggleFavoriteMachine = (machineId: string) => {
    setFavoriteMachineIds((currentIds) => {
      if (currentIds.includes(machineId)) {
        setToastMessage("Odstranene z oblubenych");
        setUserExerciseProfiles((currentProfiles) => ({
          ...currentProfiles,
          [machineId]: {
            ...currentProfiles[machineId],
            machineId,
            isFavorite: false,
            updatedAt: new Date().toISOString()
          }
        }));
        return currentIds.filter((id) => id !== machineId);
      }

      setToastMessage("Pridane medzi oblubene");
      setUserExerciseProfiles((currentProfiles) => ({
        ...currentProfiles,
        [machineId]: {
          ...currentProfiles[machineId],
          machineId,
          isFavorite: true,
          updatedAt: new Date().toISOString()
        }
      }));
      return [machineId, ...currentIds];
    });
  };

  const deleteWorkoutEntry = (entryId: string) => {
    setSessions((currentSessions) =>
      currentSessions.flatMap((session) => {
        const updatedEntries = session.entries.filter((entry) => entry.id !== entryId);

        if (updatedEntries.length === 0) {
          return [];
        }

        const updatedFocus = getSessionFocus(updatedEntries, machineMap);

        return [
          {
            ...session,
            focus: updatedFocus,
            coachSummary: buildSessionSummary(updatedFocus, updatedEntries.length),
            entries: updatedEntries
          }
        ];
      })
    );
    setToastMessage("Zapis zmazany");
  };

  const clearWorkoutHistory = () => {
    setSessions([]);
    setUserExerciseProfiles({});
    setToastMessage("Historia zmazana");
  };

  const importWorkoutHistory = (rawValue: string) => {
    try {
      const parsed = JSON.parse(rawValue);
      const importedSessions = Array.isArray(parsed) ? parsed : parsed?.sessions;

      if (!Array.isArray(importedSessions) || !importedSessions.every(isWorkoutSession)) {
        setToastMessage("Import nema spravny format");
        return false;
      }

      setSessions(importedSessions);
      if (isUserExerciseProfiles(parsed?.userExerciseProfiles)) {
        setUserExerciseProfiles(parsed.userExerciseProfiles);
      }
      setToastMessage("Historia importovana");
      return true;
    } catch (error) {
      setToastMessage("Import sa nepodaril");
      return false;
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.log("Google login failed", error);
      setToastMessage("Google prihlasenie sa nepodarilo");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutCloudUser();
      setCloudUser(null);
      setHasHydratedCloud(false);
      setCloudStatus("offline");
      setToastMessage("Odhlasene");
    } catch (error) {
      console.log("Logout failed", error);
      setToastMessage("Odhlasenie sa nepodarilo");
    }
  };

  const handleManualCloudSync = async () => {
    if (!cloudUser) {
      setToastMessage("Najprv sa prihlas cez Google");
      return;
    }

    try {
      setCloudStatus("syncing");
      await saveCloudData(
            buildCloudSnapshot({
              sessions,
              favoriteMachineIds,
              userExerciseProfiles,
              themeMode: mode
            })
          );
      setCloudStatus("saved");
      setToastMessage("Cloud zaloha ulozena");
    } catch (error) {
      console.log("Manual cloud sync failed", error);
      setCloudStatus("error");
      setToastMessage("Cloud ulozenie sa nepodarilo");
    }
  };

  let content = null;

  if (activeTab === "home") {
    content = (
      <HomeScreen
        machines={mockMachines}
        sessions={sessions}
        trainerSettings={trainerSettings}
        userExerciseProfiles={userExerciseProfiles}
        onChangeTrainerSettings={setTrainerSettings}
        onCompleteRoutine={saveRoutineEntry}
        onOpenMachine={(machine) => openMachine(machine, "home")}
      />
    );
  }

  if (activeTab === "machines") {
    content = (
      <MachinesScreen
        favoriteMachineIds={favoriteMachineIds}
        machineUsageCounts={machineUsageCounts}
        machines={mockMachines}
        onOpenCamera={openCameraPrep}
        onOpenMachine={(machine) => openMachine(machine, "machines")}
      />
    );
  }

  if (activeTab === "history") {
    content = (
      <HistoryScreen
        exportValue={historyExportValue}
        sessions={sessions}
        getMachine={(machineId) => machineMap.get(machineId)}
        onDeleteEntry={deleteWorkoutEntry}
        onImportHistory={importWorkoutHistory}
      />
    );
  }

  if (activeTab === "machine-detail" && selectedMachine) {
    content = (
      <MachineDetailScreen
        entries={latestEntries.filter(
          (entry) => entry.machine?.id === selectedMachine.id
        )}
        machine={selectedMachine}
        userExerciseProfile={userExerciseProfiles[selectedMachine.id]}
        isFavorite={favoriteMachineIds.includes(selectedMachine.id)}
        onBack={navigateBackFromMachine}
        onBackToPlan={selectedMachineSource === "home" ? navigateBackToPlan : undefined}
        onSaveEntry={saveWorkoutEntry}
        onToggleFavorite={() => toggleFavoriteMachine(selectedMachine.id)}
      />
    );
  }

  if (activeTab === "camera") {
    content = (
      <CameraPrepScreen
        machines={mockMachines}
        onBack={navigateBackFromCamera}
        onPickMachine={(machine) => openMachine(machine, "machines")}
      />
    );
  }

  if (shouldRequireCloudLogin && !authReady) {
    return (
      <AuthGate
        colors={colors}
        exportValue={historyExportValue}
        isLoading
        showExport={showAuthExport}
        hasLocalHistory={sessions.length > 0}
        onToggleExport={() => setShowAuthExport((current) => !current)}
        onGoogleLogin={handleGoogleLogin}
      />
    );
  }

  if (shouldRequireCloudLogin && !cloudUser) {
    return (
      <AuthGate
        colors={colors}
        exportValue={historyExportValue}
        showExport={showAuthExport}
        hasLocalHistory={sessions.length > 0}
        onToggleExport={() => setShowAuthExport((current) => !current)}
        onGoogleLogin={handleGoogleLogin}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style={mode === "dark" ? "light" : "dark"} />
      <StatusBar barStyle={mode === "dark" ? "light-content" : "dark-content"} />
      {activeTab !== "machine-detail" && activeTab !== "camera" ? (
        <View style={styles.appHeader}>
          <Pressable
            onPress={() => setIsMenuOpen(true)}
            style={styles.headerMenuButton}
          >
            <View style={styles.headerMenuIcon}>
              <View style={styles.headerMenuLine} />
              <View style={styles.headerMenuLine} />
              <View style={styles.headerMenuLine} />
            </View>
          </Pressable>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>Gym80 Tracker</Text>
            <Text style={styles.headerSubtitle}>{getTabLabel(activeTab)}</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>Beta v1</Text>
          </View>
        </View>
      ) : null}
      <View style={styles.container}>{content}</View>
      {toastMessage ? (
        <View style={styles.toastOverlay}>
          <View style={styles.toastCard}>
            <View style={styles.toastDot} />
            <Text style={styles.toastLabel}>{toastMessage}</Text>
          </View>
        </View>
      ) : null}
      {activeTab !== "machine-detail" && activeTab !== "camera" ? (
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      ) : null}
      <SideMenu
        cloudStatus={cloudStatus}
        cloudUserEmail={cloudUser?.email}
        hasHistory={sessions.length > 0}
        isOpen={isMenuOpen}
        onClearHistory={clearWorkoutHistory}
        onClose={() => setIsMenuOpen(false)}
        onGoogleLogin={handleGoogleLogin}
        onLogout={handleLogout}
        onSyncCloud={handleManualCloudSync}
      />
    </SafeAreaView>
  );
}

function AuthGate({
  colors,
  exportValue,
  hasLocalHistory,
  isLoading,
  showExport,
  onToggleExport,
  onGoogleLogin
}: {
  colors: AppColors;
  exportValue: string;
  hasLocalHistory: boolean;
  isLoading?: boolean;
  showExport: boolean;
  onToggleExport: () => void;
  onGoogleLogin: () => void;
}) {
  const styles = React.useMemo(() => createAuthStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.card}>
        <Text style={styles.kicker}>VIPGYM TRACKER</Text>
        <Text style={styles.title}>Najprv sa prihlas</Text>
        <Text style={styles.copy}>
          Kazdy pouzivatel bude mat vlastnu historiu treningov a vlastnu cloudovu
          zalohu. Ked posles link kamaratovi, neuvidi tvoje data.
        </Text>
        <Pressable
          disabled={isLoading}
          onPress={onGoogleLogin}
          style={[styles.button, isLoading ? styles.buttonDisabled : null]}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Pripravujem prihlasenie..." : "Prihlasit cez Google"}
          </Text>
        </Pressable>
        <Text style={styles.note}>
          Apple prihlasenie pripravime neskor. Teraz ideme stabilny Google zaklad.
        </Text>
        {hasLocalHistory ? (
          <>
            <Pressable
              onPress={onToggleExport}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>
                {showExport ? "Skryt lokalnu historiu" : "Zachranit lokalnu historiu"}
              </Text>
            </Pressable>
            {showExport ? (
              <View style={styles.exportBox}>
                <Text style={styles.exportTitle}>Nudzovy export historie</Text>
                <Text style={styles.exportHelp}>
                  Toto je zaloha treningov z tohto prehliadaca. Oznac text, skopiruj ho
                  a posli mi ho alebo si ho odloz.
                </Text>
                <Text selectable style={styles.exportText}>
                  {exportValue}
                </Text>
              </View>
            ) : null}
          </>
        ) : (
          <Text style={styles.note}>
            V tomto prehliadaci teraz nevidim lokalnu historiu. Ak bola v inom mobile
            alebo inom prehliadaci, treba otvorit appku tam.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.page
  },
  container: {
    flex: 1
  },
  appHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 78,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: colors.headerSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerMenuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.border
  },
  headerMenuIcon: {
    gap: 5
  },
  headerMenuLine: {
    width: 22,
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.text
  },
  headerTitleBlock: {
    flex: 1
  },
  headerTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "800"
  },
  headerSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  headerBadge: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.highlight,
    paddingHorizontal: 9,
    paddingVertical: 5
  },
  headerBadgeText: {
    color: colors.highlight,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1
  },
  toastOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 74,
    alignItems: "center",
    zIndex: 20,
    paddingHorizontal: 14
  },
  toastCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    width: "100%",
    maxWidth: 560,
    minHeight: 260,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.highlight,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 30,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 12
  },
  toastDot: {
    width: 54,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.highlight
  },
  toastLabel: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 32,
    textAlign: "center"
  }
  });
}

function createAuthStyles(colors: AppColors) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      justifyContent: "center",
      padding: 22,
      backgroundColor: colors.page
    },
    card: {
      borderRadius: 30,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: 24,
      gap: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 8
    },
    kicker: {
      color: colors.highlight,
      fontSize: 13,
      fontWeight: "900",
      letterSpacing: 1.5
    },
    title: {
      color: colors.text,
      fontSize: 34,
      fontWeight: "900",
      lineHeight: 40
    },
    copy: {
      color: colors.textMuted,
      fontSize: 17,
      lineHeight: 25
    },
    button: {
      marginTop: 8,
      borderRadius: 18,
      backgroundColor: colors.highlight,
      paddingVertical: 16,
      alignItems: "center"
    },
    buttonDisabled: {
      opacity: 0.6
    },
    buttonText: {
      color: colors.onAccent,
      fontSize: 17,
      fontWeight: "900"
    },
    note: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19
    },
    secondaryButton: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.accentSoft,
      paddingVertical: 13,
      alignItems: "center"
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "900"
    },
    exportBox: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.highlight,
      backgroundColor: colors.inputSurface,
      padding: 14,
      gap: 10,
      maxHeight: 300
    },
    exportTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "900"
    },
    exportHelp: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19
    },
    exportText: {
      color: colors.text,
      fontSize: 11,
      lineHeight: 16
    }
  });
}

function getTabLabel(tab: AppTab) {
  if (tab === "machines") {
    return "Stroje";
  }

  if (tab === "history") {
    return "Historia";
  }

  return "AI trener";
}
