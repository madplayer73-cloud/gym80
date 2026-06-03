import * as Haptics from "expo-haptics";

export function triggerTapHaptic() {
  void safeHaptic(() => Haptics.selectionAsync());
}

export function triggerSuccessHaptic() {
  void safeHaptic(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  );
}

export function triggerRestCompleteHaptic() {
  void safeHaptic(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await wait(130);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await wait(130);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  });

  try {
    const navigatorWithVibration = globalThis.navigator as
      | (Navigator & { vibrate?: (pattern: number | number[]) => boolean })
      | undefined;

    navigatorWithVibration?.vibrate?.([180, 80, 180, 80, 320]);
  } catch {
    // Vibracie su len bonus na zariadeniach, ktore ich podporuju.
  }
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

async function safeHaptic(run: () => Promise<void>) {
  try {
    await run();
  } catch {
    // Haptics are optional on unsupported platforms.
  }
}
