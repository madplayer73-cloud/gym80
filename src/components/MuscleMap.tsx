import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MuscleGroup } from "../types";
import { colors } from "../theme";

type MuscleMapProps = {
  muscleGroup: MuscleGroup;
};

export function MuscleMap({ muscleGroup }: MuscleMapProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Precvičované svaly</Text>
      <View style={styles.figures}>
        <BodyFigure view="front" muscleGroup={muscleGroup} />
        <BodyFigure view="back" muscleGroup={muscleGroup} />
      </View>
    </View>
  );
}

function BodyFigure({
  view,
  muscleGroup
}: {
  view: "front" | "back";
  muscleGroup: MuscleGroup;
}) {
  const highlight = getHighlight(view, muscleGroup);

  return (
    <View style={styles.figureCard}>
      <Text style={styles.figureLabel}>{view === "front" ? "Spredu" : "Zozadu"}</Text>
      <View style={styles.figureFrame}>
        <View style={styles.head} />
        <View style={styles.shoulders}>
          <View style={[styles.arm, highlight.leftArm]} />
          <View style={[styles.torso, highlight.torso]} />
          <View style={[styles.arm, highlight.rightArm]} />
        </View>
        <View style={styles.hips}>
          <View style={[styles.leg, highlight.leftLeg]} />
          <View style={[styles.leg, highlight.rightLeg]} />
        </View>
      </View>
    </View>
  );
}

function getHighlight(view: "front" | "back", muscleGroup: MuscleGroup) {
  const orange = styles.highlight;
  const none = null;

  if (muscleGroup === "Brucho") {
    return {
      torso: view === "front" ? orange : none,
      leftArm: none,
      rightArm: none,
      leftLeg: none,
      rightLeg: none
    };
  }

  if (muscleGroup === "Chrbat") {
    return {
      torso: view === "back" ? orange : none,
      leftArm: none,
      rightArm: none,
      leftLeg: none,
      rightLeg: none
    };
  }

  if (muscleGroup === "Ruky" || muscleGroup === "Triceps") {
    return {
      torso: none,
      leftArm: orange,
      rightArm: orange,
      leftLeg: none,
      rightLeg: none
    };
  }

  if (muscleGroup === "Ramena") {
    return {
      torso: styles.highlightUpperTorso,
      leftArm: styles.highlightUpperArm,
      rightArm: styles.highlightUpperArm,
      leftLeg: none,
      rightLeg: none
    };
  }

  if (muscleGroup === "Hrudnik") {
    return {
      torso: view === "front" ? styles.highlightUpperTorso : none,
      leftArm: none,
      rightArm: none,
      leftLeg: none,
      rightLeg: none
    };
  }

  return {
    torso: none,
    leftArm: none,
    rightArm: none,
    leftLeg: styles.highlightLegFront,
    rightLeg: styles.highlightLegFront
  };
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 14,
    backgroundColor: "#fff3e1",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e1bd86"
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text
  },
  figures: {
    marginTop: 14,
    flexDirection: "row",
    gap: 12
  },
  figureCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fffaf2",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10
  },
  figureLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted
  },
  figureFrame: {
    marginTop: 10,
    alignItems: "center"
  },
  head: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: "#e8ddd0"
  },
  shoulders: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6
  },
  torso: {
    width: 34,
    height: 74,
    borderRadius: 14,
    backgroundColor: "#e8ddd0"
  },
  arm: {
    width: 12,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#e8ddd0"
  },
  hips: {
    marginTop: 6,
    flexDirection: "row",
    gap: 8
  },
  leg: {
    width: 16,
    height: 88,
    borderRadius: 12,
    backgroundColor: "#e8ddd0"
  },
  highlight: {
    backgroundColor: colors.highlight
  },
  highlightUpperTorso: {
    backgroundColor: colors.highlight,
    height: 42
  },
  highlightUpperArm: {
    backgroundColor: colors.highlight,
    height: 36
  },
  highlightLegFront: {
    backgroundColor: colors.highlight
  }
});
