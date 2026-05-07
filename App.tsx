import React, { useMemo, useState } from "react";
import { SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { BottomNav } from "./src/components/BottomNav";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { MachineDetailScreen } from "./src/screens/MachineDetailScreen";
import { MachinesScreen } from "./src/screens/MachinesScreen";
import { mockMachines, mockWorkoutSessions } from "./src/data/mockData";
import { AppTab, Machine } from "./src/types";
import { colors } from "./src/theme";

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  const machineMap = useMemo(
    () => new Map(mockMachines.map((machine) => [machine.id, machine])),
    []
  );

  const latestEntries = useMemo(
    () =>
      mockWorkoutSessions.flatMap((session) =>
        session.entries.map((entry) => ({
          ...entry,
          workoutDate: session.workoutDate,
          workoutFocus: session.focus,
          machine: machineMap.get(entry.machineId)
        }))
      ),
    [machineMap]
  );

  const openMachine = (machine: Machine) => {
    setSelectedMachine(machine);
    setActiveTab("machine-detail");
  };

  const navigateBackFromMachine = () => {
    setActiveTab("machines");
  };

  let content = null;

  if (activeTab === "home") {
    content = (
      <HomeScreen
        machines={mockMachines}
        sessions={mockWorkoutSessions}
        onOpenMachine={openMachine}
      />
    );
  }

  if (activeTab === "machines") {
    content = (
      <MachinesScreen machines={mockMachines} onOpenMachine={openMachine} />
    );
  }

  if (activeTab === "history") {
    content = (
      <HistoryScreen
        sessions={mockWorkoutSessions}
        getMachine={(machineId) => machineMap.get(machineId)}
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
        onBack={navigateBackFromMachine}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>{content}</View>
      {activeTab !== "machine-detail" ? (
        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.page
  },
  container: {
    flex: 1
  }
});
