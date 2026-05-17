import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { AppColors, useTheme } from "../theme";
import { triggerTapHaptic } from "../utils/haptics";

type SideMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory: () => void;
  hasHistory: boolean;
};

export function SideMenu({ isOpen, onClose, onClearHistory, hasHistory }: SideMenuProps) {
  const { colors, mode, setMode } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [clearStep, setClearStep] = React.useState(0);

  React.useEffect(() => {
    if (!isOpen) {
      setClearStep(0);
    }
  }, [isOpen]);

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

          <View style={styles.dangerBox}>
            <Text style={styles.dangerTitle}>Bezpecnost dat</Text>
            <Text style={styles.dangerText}>
              Mazanie historie je schovane tu, aby si si ju omylom nezmazal pocas
              treningu.
            </Text>
            <Pressable
              disabled={!hasHistory}
              onPress={() => {
                triggerTapHaptic();

                if (clearStep < 2) {
                  setClearStep((current) => current + 1);
                  return;
                }

                onClearHistory();
                setClearStep(0);
                onClose();
              }}
              style={[
                styles.clearHistoryButton,
                !hasHistory ? styles.clearHistoryButtonDisabled : null
              ]}
            >
              <Text style={styles.clearHistoryText}>
                {getClearHistoryLabel(clearStep, hasHistory)}
              </Text>
            </Pressable>
            {clearStep > 0 ? (
              <Pressable
                onPress={() => {
                  triggerTapHaptic();
                  setClearStep(0);
                }}
                style={styles.cancelClearButton}
              >
                <Text style={styles.cancelClearText}>Nie, nechaj historiu</Text>
              </Pressable>
            ) : null}
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
    dangerBox: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.accentSoft,
      padding: 14,
      gap: 10
    },
    dangerTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "900"
    },
    dangerText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19
    },
    clearHistoryButton: {
      alignItems: "center",
      borderRadius: 15,
      backgroundColor: colors.highlight,
      paddingHorizontal: 12,
      paddingVertical: 12
    },
    clearHistoryButtonDisabled: {
      opacity: 0.45
    },
    clearHistoryText: {
      color: "#fff8ee",
      fontWeight: "900",
      textAlign: "center"
    },
    cancelClearButton: {
      alignItems: "center",
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10
    },
    cancelClearText: {
      color: colors.text,
      fontWeight: "900"
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

function getClearHistoryLabel(step: number, hasHistory: boolean) {
  if (!hasHistory) {
    return "Historia je prazdna";
  }

  if (step === 0) {
    return "Zmazat historiu";
  }

  if (step === 1) {
    return "Naozaj zmazat celu historiu?";
  }

  return "Mas export? Klikni este raz";
}
