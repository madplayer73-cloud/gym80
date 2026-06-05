import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Text,
  View
} from "react-native";
import { SectionCard } from "../components/SectionCard";
import { Tag } from "../components/Tag";
import { AppColors, useTheme } from "../theme";
import { Machine, MuscleGroup } from "../types";
import { getMachineImage } from "../utils/machineImages";

type MachinesScreenProps = {
  favoriteMachineIds: string[];
  machineUsageCounts: Record<string, number>;
  machines: Machine[];
  onOpenCamera: () => void;
  onOpenMachine: (machine: Machine) => void;
};

type MachineFilter = MuscleGroup | "Vsetko" | "Oblubene";

const filterOptions: Array<{ label: string; value: MachineFilter }> = [
  { label: "Vsetko", value: "Vsetko" },
  { label: "Oblubene", value: "Oblubene" },
  { label: "Hrudnik", value: "Hrudnik" },
  { label: "Chrbat", value: "Chrbat" },
  { label: "Ramena", value: "Ramena" },
  { label: "Ruky", value: "Ruky" },
  { label: "Triceps", value: "Triceps" },
  { label: "Nohy", value: "Nohy" },
  { label: "Brucho", value: "Brucho" },
  { label: "Kardio", value: "Kardio" },
  { label: "Cele telo", value: "Cele telo" }
];

export function MachinesScreen({
  favoriteMachineIds,
  machineUsageCounts,
  machines,
  onOpenCamera,
  onOpenMachine
}: MachinesScreenProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedFilter, setSelectedFilter] = React.useState<MachineFilter>("Vsetko");
  const favoriteMachineIdSet = React.useMemo(
    () => new Set(favoriteMachineIds),
    [favoriteMachineIds]
  );

  const favoriteMachines = React.useMemo(() => {
    return favoriteMachineIds
      .map((machineId) => machines.find((machine) => machine.id === machineId))
      .filter((machine): machine is Machine => Boolean(machine))
      .sort((firstMachine, secondMachine) => {
        const firstCount = machineUsageCounts[firstMachine.id] ?? 0;
        const secondCount = machineUsageCounts[secondMachine.id] ?? 0;

        if (firstCount !== secondCount) {
          return secondCount - firstCount;
        }

        return (
          favoriteMachineIds.indexOf(firstMachine.id) -
          favoriteMachineIds.indexOf(secondMachine.id)
        );
      });
  }, [favoriteMachineIds, machineUsageCounts, machines]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredMachines = machines.filter((machine) => {
    const searchableCodes = getMachineSearchCodes(machine);
    const matchesSearch =
      normalizedQuery.length === 0 ||
      machine.displayNameSk.toLowerCase().includes(normalizedQuery) ||
      machine.descriptionSk.toLowerCase().includes(normalizedQuery) ||
      machine.modelName.toLowerCase().includes(normalizedQuery) ||
      machine.id.toLowerCase().includes(normalizedQuery) ||
      machine.muscleGroup.toLowerCase().includes(normalizedQuery) ||
      searchableCodes.some((code) => code.includes(normalizedQuery));

    if (selectedFilter === "Oblubene") {
      return favoriteMachineIdSet.has(machine.id) && matchesSearch;
    }

    const matchesFilter =
      selectedFilter === "Vsetko" || machine.muscleGroup === selectedFilter;

    return matchesFilter && matchesSearch;
  }).sort((firstMachine, secondMachine) => {
    if (selectedFilter !== "Oblubene") {
      return 0;
    }

    return (machineUsageCounts[secondMachine.id] ?? 0) - (machineUsageCounts[firstMachine.id] ?? 0);
  });

  const renderMachineCard = (machine: Machine, isFavorite = false) => (
    <Pressable key={machine.id} onPress={() => onOpenMachine(machine)}>
      <SectionCard
        title={`${isFavorite ? "* " : ""}${machine.displayNameSk}`}
        subtitle={`Znacka ${machine.brand}`}
      >
        {getMachineImage(machine.imageAsset) ? (
          <Image
            source={getMachineImage(machine.imageAsset)!}
            style={styles.machineImage}
            resizeMode="cover"
          />
        ) : null}
        <View style={styles.row}>
          <Tag label={machine.muscleGroup} />
          {isFavorite ? (
            <View style={styles.usageBadge}>
              <Text style={styles.usageBadgeText}>
                {machineUsageCounts[machine.id] ?? 0}x pouzite
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.hintValue}>{machine.descriptionSk}</Text>
        {machine.setupNoteLabel ? (
          <>
            <Text style={styles.hintLabel}>Co si mozes zapisat</Text>
            <Text style={styles.hintValue}>{translateSetupLabel(machine.setupNoteLabel)}</Text>
          </>
        ) : null}
      </SectionCard>
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Stroje v databaze</Text>
      <Text style={styles.subtitle}>
        Toto je zaklad pre neskorsie rozpoznavanie z fotky. Kazdy stroj uz ma svoju historiu a poznamky.
      </Text>

      <Pressable onPress={onOpenCamera} style={styles.cameraButton}>
        <Text style={styles.cameraButtonTitle}>Odfotit stroj</Text>
        <Text style={styles.cameraButtonText}>
          Otvor kameru, odfot stroj a vyber najblizsiu zhodu z databazy.
        </Text>
      </Pressable>

      <TextInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Hladaj stroj, partiu alebo cislo"
        placeholderTextColor={colors.textMuted}
        style={styles.searchInput}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filterOptions.map((filter) => {
          const isActive = filter.value === selectedFilter;

          return (
            <Pressable
              key={filter.value}
              onPress={() => setSelectedFilter(filter.value)}
              style={[styles.filterChip, isActive ? styles.filterChipActive : null]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive ? styles.filterChipTextActive : null
                ]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedFilter === "Oblubene" ? (
        <View style={styles.favoriteSection}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Oblubene</Text>
            <Text style={styles.sectionHint}>najcastejsie hore</Text>
          </View>
          {favoriteMachines
            .filter((machine) => filteredMachines.some((item) => item.id === machine.id))
            .map((machine) => renderMachineCard(machine, true))}
        </View>
      ) : (
        filteredMachines.map((machine) =>
          renderMachineCard(machine, favoriteMachineIdSet.has(machine.id))
        )
      )}
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
  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: colors.text
  },
  sectionTitleRow: {
    gap: 3
  },
  sectionHint: {
    fontSize: 12,
    color: colors.textMuted
  },
  favoriteSection: {
    gap: 12
  },
  searchInput: {
    backgroundColor: colors.inputSurface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text
  },
  cameraButton: {
    backgroundColor: colors.accent,
    borderRadius: 22,
    padding: 18,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4
  },
  cameraButtonTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.onAccent
  },
  cameraButtonText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.onAccent
  },
  filterRow: {
    gap: 10,
    paddingRight: 8
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.chipSurface
  },
  filterChipActive: {
    backgroundColor: colors.highlight
  },
  filterChipText: {
    fontWeight: "700",
    color: colors.chipText
  },
  filterChipTextActive: {
    color: "#fff8ee"
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12
  },
  usageBadge: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  usageBadgeText: {
    color: colors.page,
    fontSize: 12,
    fontWeight: "900"
  },
  machineImage: {
    width: "100%",
    height: 180,
    borderRadius: 18
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

function getMachineSearchCodes(machine: Machine) {
  const imageNames = [machine.imageAsset, ...(machine.imageAssets ?? [])].filter(
    (imageName): imageName is string => Boolean(imageName)
  );

  return imageNames.flatMap((imageName) => {
    const fileNameMatch = imageName.match(/^(\d{3,})/);
    const allNumberMatches = imageName.match(/\d{3,}/g) ?? [];

    return Array.from(new Set([fileNameMatch?.[1], ...allNumberMatches].filter(Boolean))) as string[];
  });
}
