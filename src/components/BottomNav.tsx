import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppTab } from "../types";
import { AppColors, useTheme } from "../theme";
import { triggerTapHaptic } from "../utils/haptics";

type BottomNavProps = {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
};

const items: Array<{ label: string; tab: AppTab }> = [
  { label: "Domov", tab: "home" },
  { label: "Stroje", tab: "machines" },
  { label: "Historia", tab: "history" }
];

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrapper}>
      {items.map((item) => {
        const isActive = item.tab === activeTab;

        return (
          <Pressable
            key={item.tab}
            onPress={() => {
              triggerTapHaptic();
              onChange(item.tab);
            }}
            style={[styles.item, isActive ? styles.itemActive : null]}
          >
            <Text style={[styles.label, isActive ? styles.labelActive : null]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 14,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 22,
    backgroundColor: colors.accentDeep,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingVertical: 14,
    backgroundColor: colors.surfaceStrong
  },
  itemActive: {
    backgroundColor: colors.highlight
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text
  },
  labelActive: {
    color: "#fff8ee"
  }
  });
}
