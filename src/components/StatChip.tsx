import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppColors, useTheme } from "../theme";

type StatChipProps = {
  label: string;
  value: string;
};

export function StatChip({ label, value }: StatChipProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.chip}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  chip: {
    flex: 1,
    minWidth: 88,
    backgroundColor: colors.accentSoft,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  label: {
    fontSize: 12,
    color: colors.textMuted
  },
  value: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text
  }
  });
}
