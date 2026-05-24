import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { AppColors, useTheme } from "../theme";
import { triggerTapHaptic } from "../utils/haptics";

type SideMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory: () => void;
  hasHistory: boolean;
  cloudUserEmail?: string;
  cloudStatus: "loading" | "offline" | "syncing" | "saved" | "error";
  onGoogleLogin: () => void;
  onLogout: () => void;
  onSyncCloud: () => void;
};

export function SideMenu({
  isOpen,
  onClose,
  onClearHistory,
  hasHistory,
  cloudUserEmail,
  cloudStatus,
  onGoogleLogin,
  onLogout,
  onSyncCloud
}: SideMenuProps) {
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

          <View style={styles.cloudBox}>
            <Text style={styles.cloudTitle}>Cloud a prihlasenie</Text>
            <Text style={styles.cloudText}>
              {cloudUserEmail
                ? `Prihlaseny: ${cloudUserEmail}`
                : "Po prihlaseni sa treningy ukladaju oddelene pre kazdeho pouzivatela."}
            </Text>
            <View style={styles.statusPill}>
              <View
                style={[
                  styles.statusDot,
                  cloudStatus === "saved" ? styles.statusDotOk : null,
                  cloudStatus === "error" ? styles.statusDotError : null
                ]}
              />
              <Text style={styles.statusText}>{getCloudStatusLabel(cloudStatus)}</Text>
            </View>
            {cloudUserEmail ? (
              <View style={styles.cloudButtonRow}>
                <Pressable
                  onPress={() => {
                    triggerTapHaptic();
                    onSyncCloud();
                  }}
                  style={styles.cloudButton}
                >
                  <Text style={styles.cloudButtonText}>Ulozit do cloudu</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    triggerTapHaptic();
                    onLogout();
                  }}
                  style={styles.cloudSecondaryButton}
                >
                  <Text style={styles.cloudSecondaryText}>Odhlasit</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  triggerTapHaptic();
                  onGoogleLogin();
                }}
                style={styles.cloudButton}
              >
                <Text style={styles.cloudButtonText}>Prihlasit cez Google</Text>
              </Pressable>
            )}
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
    cloudBox: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceStrong,
      padding: 14,
      gap: 10
    },
    cloudTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "900"
    },
    cloudText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19
    },
    statusPill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      paddingVertical: 7
    },
    statusDot: {
      width: 9,
      height: 9,
      borderRadius: 99,
      backgroundColor: colors.textMuted
    },
    statusDotOk: {
      backgroundColor: colors.success
    },
    statusDotError: {
      backgroundColor: "#d9534f"
    },
    statusText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "800"
    },
    cloudButtonRow: {
      gap: 8
    },
    cloudButton: {
      alignItems: "center",
      borderRadius: 15,
      backgroundColor: colors.highlight,
      paddingHorizontal: 12,
      paddingVertical: 12
    },
    cloudButtonText: {
      color: colors.onAccent,
      fontWeight: "900",
      textAlign: "center"
    },
    cloudSecondaryButton: {
      alignItems: "center",
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10
    },
    cloudSecondaryText: {
      color: colors.text,
      fontWeight: "900"
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

function getCloudStatusLabel(status: SideMenuProps["cloudStatus"]) {
  if (status === "loading") {
    return "Kontrolujem prihlasenie";
  }

  if (status === "syncing") {
    return "Synchronizujem";
  }

  if (status === "saved") {
    return "Cloud ulozeny";
  }

  if (status === "error") {
    return "Cloud chyba";
  }

  return "Iba lokalne";
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
