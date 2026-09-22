import test from "node:test";
import assert from "node:assert/strict";
import { weeklySessionCount, currentStreak, levelHistoryFor, toSvgPoints, totalSetsByExercise } from "../js/stats.js";

test("weeklySessionCount は直近7日以内のセッション日数を数える", () => {
  const sessions = [
    { date: "2026-10-15", exerciseIds: [] },
    { date: "2026-10-10", exerciseIds: [] },
    { date: "2026-09-01", exerciseIds: [] }, // 範囲外
  ];
  assert.equal(weeklySessionCount(sessions, "2026-10-16"), 2);
});

test("currentStreak は今日から遡って連続日数を数える", () => {
  const sessions = [
    { date: "2026-10-16" },
    { date: "2026-10-15" },
    { date: "2026-10-14" },
    { date: "2026-10-12" }, // 途切れる
  ];
  assert.equal(currentStreak(sessions, "2026-10-16"), 3);
});

test("currentStreak は今日やっていなくても昨日までの連続を数える", () => {
  const sessions = [{ date: "2026-10-15" }, { date: "2026-10-14" }];
  assert.equal(currentStreak(sessions, "2026-10-16"), 2);
});

test("currentStreak は記録が無ければ0", () => {
  assert.equal(currentStreak([], "2026-10-16"), 0);
});

test("levelHistoryFor は日付順でレベル推移を再計算する", () => {
  const logs = [
    { date: "2026-10-14", exerciseId: "squat", feel: "easy", count: 10 },
    { date: "2026-10-15", exerciseId: "squat", feel: "easy", count: 10 },
    { date: "2026-10-16", exerciseId: "squat", feel: "hard", count: 10 },
    { date: "2026-10-15", exerciseId: "plank", feel: "hard", count: 30 }, // 別種目
  ];
  const history = levelHistoryFor("squat", logs);
  assert.deepEqual(
    history.map((h) => h.date),
    ["2026-10-14", "2026-10-15", "2026-10-16"]
  );
  assert.equal(history[0].level, 1);
  assert.equal(history[1].level, 2);
  assert.equal(history[2].level, 1);
});

test("toSvgPoints は履歴の件数と同じ数の座標を返す", () => {
  const history = [
    { date: "2026-10-14", level: 0 },
    { date: "2026-10-15", level: 1 },
    { date: "2026-10-16", level: 2 },
  ];
  const points = toSvgPoints(history, { width: 300, height: 80 });
  assert.equal(points.length, 3);
  for (const p of points) {
    assert.ok(p.x >= 0 && p.x <= 300);
    assert.ok(p.y >= 0 && p.y <= 80);
  }
});

test("toSvgPoints は空配列に対して空配列を返す", () => {
  assert.deepEqual(toSvgPoints([], { width: 100, height: 50 }), []);
});

test("totalSetsByExercise は種目ごとの記録件数を集計する", () => {
  const logs = [
    { date: "2026-10-14", exerciseId: "squat", feel: "ok", count: 10 },
    { date: "2026-10-15", exerciseId: "squat", feel: "ok", count: 10 },
    { date: "2026-10-15", exerciseId: "plank", feel: "ok", count: 30 },
  ];
  const totals = totalSetsByExercise(logs);
  assert.equal(totals.get("squat"), 2);
  assert.equal(totals.get("plank"), 1);
});
