import React from "react";

export type ThemeMode = "light" | "dark";

export const lightColors = {
  page: "#efe6d6",
  surface: "#fff8ef",
  surfaceStrong: "#f2c57c",
  headerSurface: "#111111",
  border: "#d2b48b",
  text: "#1f1a14",
  textMuted: "#685b4a",
  accent: "#111111",
  accentDeep: "#000000",
  accentSoft: "#efe3c9",
  highlight: "#d96c1f",
  highlightSoft: "#f6d1ab",
  inputSurface: "#fff3e1",
  inputBorder: "#e1bd86",
  chipSurface: "#ead9bb",
  chipText: "#4d2a13",
  onAccent: "#fff8ee",
  success: "#2f7a57",
  danger: "#b83b2f",
  shadow: "rgba(80, 47, 12, 0.12)"
};

export const darkColors = {
  page: "#080909",
  surface: "#121216",
  surfaceStrong: "#1a1a20",
  headerSurface: "#0f1014",
  border: "#34313b",
  text: "#f6f0e8",
  textMuted: "#b9aea2",
  accent: "#f0c99f",
  accentDeep: "#050506",
  accentSoft: "#1c1714",
  highlight: "#d87932",
  highlightSoft: "#2b2119",
  inputSurface: "#17171d",
  inputBorder: "#3f3944",
  chipSurface: "#242027",
  chipText: "#f0c99f",
  onAccent: "#12100d",
  success: "#65c18c",
  danger: "#ff7a6b",
  shadow: "rgba(0, 0, 0, 0.35)"
};

export const colors = lightColors;

export type AppColors = typeof lightColors;

const ThemeContext = React.createContext<{
  colors: AppColors;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}>({
  colors: lightColors,
  mode: "light",
  setMode: () => undefined
});

export function ThemeProvider({
  children,
  mode,
  setMode
}: {
  children: React.ReactNode;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}) {
  const value = React.useMemo(
    () => ({
      colors: mode === "dark" ? darkColors : lightColors,
      mode,
      setMode
    }),
    [mode, setMode]
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
