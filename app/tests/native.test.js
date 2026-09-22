import test from "node:test";
import assert from "node:assert/strict";
import { haptic, keepAwake } from "../js/native.js";

function environment(t, window, navigator) {
  for (const [key, value] of Object.entries({ window, navigator })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, key, original);
      else delete globalThis[key];
    });
  }
}

test("ネイティブは注入済み Haptics の SUCCESS / LIGHT を呼ぶ", async t => {
  const calls = [];
  const Haptics = {
    async notification(options) { assert.equal(this, Haptics); calls.push(["notification", options]); },
    async impact(options) { assert.equal(this, Haptics); calls.push(["impact", options]); },
  };
  environment(t, { Capacitor: { isNativePlatform: () => true, Plugins: { Haptics } } }, {
    vibrate: () => assert.fail("ネイティブでは Web の振動を呼ばない"),
  });
  await haptic("success");
  await haptic("light");
  await haptic("unknown");
  assert.deepEqual(calls, [["notification", { type: "SUCCESS" }], ["impact", { style: "LIGHT" }]]);
});

test("Web は休憩終了の振動パターンと短いセット完了の振動へフォールバックする", async t => {
  const calls = [];
  const navigator = { vibrate(pattern) { assert.equal(this, navigator); calls.push(pattern); } };
  environment(t, {}, navigator);
  await haptic("success");
  await haptic("light");
  await haptic("unknown");
  assert.deepEqual(calls, [[200, 100, 200], 20]);
});

test("Capacitor の Web 環境でもネイティブプラグインを呼ばない", async t => {
  const calls = [];
  environment(t, { Capacitor: {
    isNativePlatform: () => false,
    get Plugins() { assert.fail("Web ではプラグイン不要"); },
  } }, { vibrate: pattern => calls.push(pattern) });
  await haptic("success");
  await keepAwake(true);
  await keepAwake(false);
  assert.deepEqual(calls, [[200, 100, 200]]);
});

test("KeepAwake はネイティブだけで画面ロックを防ぎ、終了時に解除する", async t => {
  const calls = [];
  const KeepAwake = {
    async keepAwake() { assert.equal(this, KeepAwake); calls.push("awake"); },
    async allowSleep() { assert.equal(this, KeepAwake); calls.push("sleep"); },
  };
  environment(t, { Capacitor: { isNativePlatform: () => true, Plugins: { KeepAwake } } }, undefined);
  await keepAwake(true);
  await keepAwake(false);
  assert.deepEqual(calls, ["awake", "sleep"]);
});

test("window・navigator がない環境と振動非対応の Web では何もしない", async t => {
  environment(t, undefined, undefined);
  await haptic("success");
  await haptic("light");
  await keepAwake(true);
  await keepAwake(false);
  globalThis.window = {};
  globalThis.navigator = {};
  await haptic("success");
  await haptic("light");
});

test("navigator.vibrate の例外でも処理を続ける", async t => {
  environment(t, {}, { vibrate() { throw new Error("振動が拒否された"); } });
  await assert.doesNotReject(haptic("success"));
  await assert.doesNotReject(haptic("light"));
});

test("ネイティブプラグインが未登録・メソッド未実装でも処理を続ける", async t => {
  environment(t, { Capacitor: { isNativePlatform: () => true } }, undefined);
  for (const Plugins of [undefined, {}, { Haptics: {}, KeepAwake: {} }]) {
    window.Capacitor.Plugins = Plugins;
    await assert.doesNotReject(haptic("success"));
    await assert.doesNotReject(haptic("light"));
    await assert.doesNotReject(keepAwake(true));
    await assert.doesNotReject(keepAwake(false));
  }
});

for (const asynchronous of [false, true]) {
  test(`プラグインの${asynchronous ? "Promise 拒否" : "同期例外"}を外へ漏らさない`, async t => {
    let calls = 0;
    const fail = () => {
      calls++;
      if (asynchronous) return Promise.reject(new Error("未対応"));
      throw new Error("未対応");
    };
    environment(t, { Capacitor: { isNativePlatform: () => true, Plugins: {
      Haptics: { notification: fail, impact: fail },
      KeepAwake: { keepAwake: fail, allowSleep: fail },
    } } }, undefined);
    await assert.doesNotReject(haptic("success"));
    await assert.doesNotReject(haptic("light"));
    await assert.doesNotReject(keepAwake(true));
    await assert.doesNotReject(keepAwake(false));
    assert.equal(calls, 4);
  });
}

test("ブリッジ自体の取得に失敗しても処理を続ける", async t => {
  environment(t, { get Capacitor() { throw new Error("初期化失敗"); } }, undefined);
  await assert.doesNotReject(haptic("success"));
  await assert.doesNotReject(keepAwake(true));
});
