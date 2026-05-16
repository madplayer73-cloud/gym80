import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { AppColors, useTheme } from "../theme";
import { triggerTapHaptic } from "../utils/haptics";

type SideMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const { colors, mode, setMode } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const switchMode = (nextMode: "light" | "dark") => {
    triggerTapHaptic();
    setMode(nextMode);
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPress} onPress={onClose} />
        <View style={styles.panel}>
          <Text style={styles.title}>Menu</Text>
          <Text style={styles.subtitle}>Zobrazenie aplikacie</Text>

          <View style={styles.toggleRow}>
            <Pressable
              onPress={() => switchMode("light")}
              style={[styles.toggleButton, mode === "light" ? styles.toggleButtonActive : null]}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === "light" ? styles.toggleTextActive : null
                ]}
              >
                Light
              </Text>
            </Pressable>
            <Pressable
              onPress={() => switchMode("dark")}
              style={[styles.toggleButton, mode === "dark" ? styles.toggleButtonActive : null]}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === "dark" ? styles.toggleTextActive : null
                ]}
              >
                Dark
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              triggerTapHaptic();
              onClose();
            }}
            style={styles.closeButton}
          >
            <Text style={styles.closeText}>Zavriet</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      flexDirection: "row"
    },
    backdropPress: {
      flex: 1
    },
    panel: {
      width: 280,
      paddingTop: 62,
      paddingHorizontal: 18,
      paddingBottom: 24,
      backgroundColor: colors.surface,
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
      gap: 16
    },
    title: {
      fontSize: 28,
      fontWeight: "900",
      color: colors.text
    },
    subtitle: {
      fontSize: 14,
      color: colors.textMuted
    },
    toggleRow: {
      flexDirection: "row",
      gap: 10
    },
    toggleButton: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.border
    },
    toggleButtonActive: {
      backgroundColor: colors.highlight,
      borderColor: colors.highlight
    },
    toggleText: {
      color: colors.text,
      fontWeight: "800"
    },
    toggleTextActive: {
      color: "#fff8ee"
    },
    closeButton: {
      marginTop: "auto",
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 16,
      backgroundColor: colors.accent
    },
    closeText: {
      color: colors.page,
      fontWeight: "900"
    }
  });
}
