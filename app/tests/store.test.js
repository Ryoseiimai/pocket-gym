import test from "node:test";
import assert from "node:assert/strict";
import { validateImport, emptyState, defaultProfile, saveState, MAX_ARRAY_LEN } from "../js/store.js";
import { EXERCISES } from "../js/exercises.js";

const exId = EXERCISES[0].id;

function validData(overrides = {}) {
  return {
    version: 1,
    profile: { ...defaultProfile(), onboarded: true },
    exerciseState: { [exId]: { level: 1 } },
    logs: [{ date: "2026-10-15", exerciseId: exId, feel: "ok", count: 10 }],
    sessions: [{ date: "2026-10-15", exerciseIds: [exId] }],
    ...overrides,
  };
}

test("emptyState は妥当な初期状態を返す", () => {
  const s = emptyState();
  assert.equal(s.version, 1);
  assert.equal(s.profile, null);
  assert.deepEqual(s.logs, []);
  assert.deepEqual(s.sessions, []);
});

test("validateImport は正しいデータを受理する", () => {
  const result = validateImport(validData());
  assert.equal(result.ok, true);
  assert.equal(result.data.logs.length, 1);
});

test("validateImport はルートがオブジェクトでなければ拒否する", () => {
  assert.equal(validateImport([1, 2, 3]).ok, false);
  assert.equal(validateImport("hi").ok, false);
  assert.equal(validateImport(null).ok, false);
});

test("validateImport は version 不一致を拒否する", () => {
  const result = validateImport(validData({ version: 99 }));
  assert.equal(result.ok, false);
});

test("validateImport は不正な profile を拒否する", () => {
  const result = validateImport(validData({ profile: { goal: "not-a-goal" } }));
  assert.equal(result.ok, false);
});

test("validateImport は未知の exerciseId を含む exerciseState を無視して読み込む", () => {
  const result = validateImport(validData({ exerciseState: { "unknown-id": { level: 1 }, [exId]: { level: 2 } } }));
  assert.equal(result.ok, true);
  assert.equal(result.data.exerciseState["unknown-id"], undefined);
  assert.equal(result.data.exerciseState[exId].level, 2);
});

test("validateImport は不正な feel を含む logs を拒否する", () => {
  const result = validateImport(validData({ logs: [{ date: "2026-10-15", exerciseId: exId, feel: "invalid", count: 1 }] }));
  assert.equal(result.ok, false);
});

test("validateImport は日付フォーマットが不正な logs を拒否する", () => {
  const result = validateImport(validData({ logs: [{ date: "10/15/2026", exerciseId: exId, feel: "ok", count: 1 }] }));
  assert.equal(result.ok, false);
});

test("validateImport は上限件数を超える logs を拒否する", () => {
  const logs = Array.from({ length: MAX_ARRAY_LEN + 1 }, (_, i) => ({
    date: "2026-10-15",
    exerciseId: exId,
    feel: "ok",
    count: i,
  }));
  const result = validateImport(validData({ logs }));
  assert.equal(result.ok, false);
});

test("validateImport は __proto__ をキーに使ったexerciseStateを安全に無視する", () => {
  const raw = validData();
  raw.exerciseState = JSON.parse('{"__proto__": {"level": 1}, "' + exId + '": {"level": 1}}');
  const result = validateImport(raw);
  assert.equal(result.ok, true);
  assert.equal(Object.prototype.hasOwnProperty.call({}, "polluted"), false);
});

test("validateImport は exerciseState がちょうど MAX_ARRAY_LEN 件なら受理する(オフバイワン境界)", () => {
  const exerciseState = {};
  for (let i = 0; i < MAX_ARRAY_LEN; i++) exerciseState[`ex-${i}`] = { level: 0 };
  const result = validateImport(validData({ exerciseState }));
  assert.equal(result.ok, true);
});

test("validateImport は exerciseState が MAX_ARRAY_LEN+1 件だと打ち切って拒否する(オフバイワン境界)", () => {
  const exerciseState = {};
  for (let i = 0; i < MAX_ARRAY_LEN + 1; i++) exerciseState[`ex-${i}`] = { level: 0 };
  const result = validateImport(validData({ exerciseState }));
  assert.equal(result.ok, false);
});

test("saveState は window.localStorage.setItem が例外を投げても外に漏らさず false を返す", () => {
  const originalWindow = globalThis.window;
  globalThis.window = {
    localStorage: {
      setItem() {
        // Safari プライベートブラウズや QuotaExceededError を模したスタブ
        throw new DOMException("QuotaExceededError", "QuotaExceededError");
      },
    },
  };
  try {
    const result = saveState(emptyState());
    assert.equal(result, false);
  } finally {
    globalThis.window = originalWindow;
  }
});

test("saveState はサイズ超過時に setItem を呼ばず false を返す(例外にも依存しない)", () => {
  const originalWindow = globalThis.window;
  let setItemCalled = false;
  globalThis.window = {
    localStorage: {
      setItem() {
        setItemCalled = true;
      },
    },
  };
  try {
    const oversized = { junk: "x".repeat(5 * 1024 * 1024) }; // 5MB > MAX_BYTES(4MB)
    const result = saveState(oversized);
    assert.equal(result, false);
    assert.equal(setItemCalled, false);
  } finally {
    globalThis.window = originalWindow;
  }
});

test("saveState は正常時に true を返し setItem を1回呼ぶ", () => {
  const originalWindow = globalThis.window;
  const calls = [];
  globalThis.window = {
    localStorage: {
      setItem(key, value) {
        calls.push([key, value]);
      },
    },
  };
  try {
    const result = saveState(emptyState());
    assert.equal(result, true);
    assert.equal(calls.length, 1);
  } finally {
    globalThis.window = originalWindow;
  }
});
