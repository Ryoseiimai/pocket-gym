// Capacitor がネイティブ側から注入するブリッジだけを使う。Web 版は依存ゼロ。
export async function haptic(kind) {
  try {
    if (kind !== "success" && kind !== "light") return;
    const capacitor = globalThis.window?.Capacitor;
    if (capacitor?.isNativePlatform?.()) {
      const haptics = capacitor.Plugins?.Haptics;
      if (kind === "success") await haptics?.notification({ type: "SUCCESS" });
      else await haptics?.impact({ style: "LIGHT" });
    } else {
      globalThis.navigator?.vibrate?.(kind === "success" ? [200, 100, 200] : 20);
    }
  } catch {
    // 未対応・権限拒否・プラグイン失敗でもトレーニングを続ける。
  }
}

export async function keepAwake(on) {
  try {
    const capacitor = globalThis.window?.Capacitor;
    if (!capacitor?.isNativePlatform?.()) return;
    const awake = capacitor.Plugins?.KeepAwake;
    if (on) await awake?.keepAwake();
    else await awake?.allowSleep();
  } catch {
    // 画面ロック防止が使えなくてもトレーニングを続ける。
  }
}
