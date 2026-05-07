import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppTab } from "../types";
import { colors } from "../theme";

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
  return (
    <View style={styles.wrapper}>
      {items.map((item) => {
        const isActive = item.tab === activeTab;

        return (
          <Pressable
            key={item.tab}
            onPress={() => onChange(item.tab)}
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

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: colors.page,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    paddingVertical: 14,
    backgroundColor: colors.surface
  },
  itemActive: {
    backgroundColor: colors.accent
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted
  },
  labelActive: {
    color: "#fff8ee"
  }
});
