import * as Haptics from "expo-haptics";

export function triggerTapHaptic() {
  void safeHaptic(() => Haptics.selectionAsync());
}

export function triggerSuccessHaptic() {
  void safeHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  );
}

async function safeHaptic(run: () => Promise<void>) {
  try {
    await run();
  } catch {
    // Haptics are optional on unsupported platforms.
  }
}
