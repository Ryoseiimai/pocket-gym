import test from "node:test";
import assert from "node:assert/strict";
import { validateImport, emptyState, defaultProfile, MAX_ARRAY_LEN } from "../js/store.js";
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
