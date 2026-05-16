import React, { useMemo, useState } from "react";
import { Pressable, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BottomNav } from "./src/components/BottomNav";
import { SideMenu } from "./src/components/SideMenu";
import { CameraPrepScreen } from "./src/screens/CameraPrepScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { MachineDetailScreen } from "./src/screens/MachineDetailScreen";
import { MachinesScreen } from "./src/screens/MachinesScreen";
import { mockMachines, mockWorkoutSessions } from "./src/data/mockData";
import {
  AppTab,
  Machine,
  MuscleGroup,
  WorkoutFeeling,
  WorkoutFocus,
  WorkoutSession
} from "./src/types";
import { AppColors, ThemeMode, ThemeProvider, useTheme } from "./src/theme";

const STORAGE_KEY = "gym80-tracker-sessions";
const FAVORITES_STORAGE_KEY = "gym80-tracker-favorites";

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

export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  return (
    <ThemeProvider mode={themeMode} setMode={setThemeMode}>
      <AppShell />
    </ThemeProvider>
  );
}

function AppShell() {
  const { colors, mode } = useTheme();
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [sessions, setSessions] = useState(mockWorkoutSessions);
  const [favoriteMachineIds, setFavoriteMachineIds] = useState<string[]>([]);
  const [hasLoadedStoredSessions, setHasLoadedStoredSessions] = useState(false);
  const [hasLoadedStoredFavorites, setHasLoadedStoredFavorites] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const machineMap = useMemo(
    () => new Map(mockMachines.map((machine) => [machine.id, machine])),
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
          sessions
        },
        null,
        2
      ),
    [sessions]
  );

  const openMachine = (machine: Machine) => {
    setSelectedMachine(machine);
    setActiveTab("machine-detail");
  };

  const openCameraPrep = () => {
    setActiveTab("camera");
  };

  const navigateBackFromMachine = () => {
    setActiveTab("machines");
  };

  const navigateBackFromCamera = () => {
    setActiveTab("home");
  };

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
    if (!toastMessage) {
      return;
    }

    const timeout = setTimeout(() => {
      setToastMessage(null);
    }, 1800);

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
    note: string;
  }) => {
    const now = new Date();
    const workoutDate = now.toISOString();
    const newEntry = {
      id: `entry-${machineId}-${now.getTime()}`,
      machineId,
      weightKg,
      sets,
      reps,
      durationMin,
      speedKph,
      inclinePercent,
      feeling,
      note,
      completedAt: workoutDate
    };

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

    setActiveTab("machines");
    setToastMessage("Ulozene");
  };

  const toggleFavoriteMachine = (machineId: string) => {
    setFavoriteMachineIds((currentIds) => {
      if (currentIds.includes(machineId)) {
        setToastMessage("Odstranene z oblubenych");
        return currentIds.filter((id) => id !== machineId);
      }

      setToastMessage("Pridane medzi oblubene");
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
      setToastMessage("Historia importovana");
      return true;
    } catch (error) {
      setToastMessage("Import sa nepodaril");
      return false;
    }
  };

  let content = null;

  if (activeTab === "home") {
    content = (
      <HomeScreen
        machines={mockMachines}
        sessions={sessions}
        onOpenMachine={openMachine}
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
        onOpenMachine={openMachine}
      />
    );
  }

  if (activeTab === "history") {
    content = (
      <HistoryScreen
        exportValue={historyExportValue}
        sessions={sessions}
        getMachine={(machineId) => machineMap.get(machineId)}
        onClearHistory={clearWorkoutHistory}
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
        isFavorite={favoriteMachineIds.includes(selectedMachine.id)}
        onBack={navigateBackFromMachine}
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
        onPickMachine={openMachine}
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
            <Text style={styles.headerBadgeText}>BETA</Text>
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
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
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
    bottom: 104,
    alignItems: "center"
  },
  toastCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#111111",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999
  },
  toastDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#59c184"
  },
  toastLabel: {
    color: "#fff8ee",
    fontWeight: "800"
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
