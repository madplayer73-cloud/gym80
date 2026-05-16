import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppColors, useTheme } from "../theme";

type TagProps = {
  label: string;
};

export function Tag({ label }: TagProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.tag}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  tag: {
    alignSelf: "flex-start",
    backgroundColor: colors.highlightSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  label: {
    color: colors.highlight,
    fontWeight: "700",
    fontSize: 12
  }
  });
}
