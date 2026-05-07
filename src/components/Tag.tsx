import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

type TagProps = {
  label: string;
};

export function Tag({ label }: TagProps) {
  return (
    <View style={styles.tag}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: "flex-start",
    backgroundColor: "#f7d9bd",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  label: {
    color: colors.accentDeep,
    fontWeight: "700",
    fontSize: 12
  }
});
