import React, { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppColors, useTheme } from "../theme";

type SectionCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  collapsed?: boolean;
  onDoublePress?: () => void;
};

export function SectionCard({
  title,
  subtitle,
  children,
  collapsed = false,
  onDoublePress
}: SectionCardProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const lastPressAtRef = React.useRef(0);

  const handleTitlePress = () => {
    if (!onDoublePress) {
      return;
    }

    const now = Date.now();

    if (now - lastPressAtRef.current <= 420) {
      lastPressAtRef.current = 0;
      onDoublePress();
      return;
    }

    lastPressAtRef.current = now;
  };

  return (
    <View style={styles.card}>
      {onDoublePress ? (
        <Pressable
          accessibilityHint="Dvojitym tuknutim zobrazis alebo skryjes obsah"
          accessibilityRole="button"
          onPress={handleTitlePress}
        >
          <Text style={styles.title}>{title}</Text>
        </Pressable>
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}
      {!collapsed && subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {!collapsed ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 3
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted
  },
  content: {
    marginTop: 16
  }
  });
}
