// Capacitor がネイティブ側から注入するブリッジだけを使う。Web 版は依存ゼロ。
// Plugins に無い版でも動くよう registerPlugin で取り直す。
function plugin(capacitor, name) {
  return capacitor.Plugins?.[name] ?? capacitor.registerPlugin?.(name);
}

// iOS 版だけ、起動時に使えるプラグインをログへ出す（Xcode のログで橋渡しを確かめるため）。
try {
  const capacitor = globalThis.window?.Capacitor;
  if (capacitor?.isNativePlatform?.()) console.info("[pocketgym] native plugins:", Object.keys(capacitor.Plugins || {}).join(","));
} catch {
  // ログが出せなくても動作には影響しない。
}
export async function haptic(kind) {
  try {
    if (kind !== "success" && kind !== "light") return;
    const capacitor = globalThis.window?.Capacitor;
    if (capacitor?.isNativePlatform?.()) {
      const haptics = plugin(capacitor, "Haptics");
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
    const awake = plugin(capacitor, "KeepAwake");
    if (on) await awake?.keepAwake();
    else await awake?.allowSleep();
  } catch {
    // 画面ロック防止が使えなくてもトレーニングを続ける。
  }
}
