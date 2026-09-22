import test from "node:test";
import assert from "node:assert/strict";
import { nextLevel, clampLevel, applySessionResults } from "../js/progress.js";
import { MIN_LEVEL, MAX_LEVEL } from "../js/store.js";

test("全セットが楽ならレベルが+1される", () => {
  assert.equal(nextLevel(0, ["easy", "easy", "easy"]), 1);
});

test("1セットでもきついがあればレベルが-1される", () => {
  assert.equal(nextLevel(0, ["ok", "hard", "easy"]), -1);
});

test("ちょうど中心なら変化しない", () => {
  assert.equal(nextLevel(0, ["ok", "ok", "ok"]), 0);
});

test("空配列や不正入力では変化しない", () => {
  assert.equal(nextLevel(1, []), 1);
  assert.equal(nextLevel(1, undefined), 1);
});

test("レベルは上限を超えない", () => {
  assert.equal(clampLevel(MAX_LEVEL + 5), MAX_LEVEL);
  assert.equal(nextLevel(MAX_LEVEL, ["easy"]), MAX_LEVEL);
});

test("レベルは下限を下回らない", () => {
  assert.equal(clampLevel(MIN_LEVEL - 5), MIN_LEVEL);
  assert.equal(nextLevel(MIN_LEVEL, ["hard"]), MIN_LEVEL);
});

test("applySessionResults は複数種目のレベルをまとめて不変更新する", () => {
  const prevState = { squat: { level: 0 }, plank: { level: 1 } };
  const next = applySessionResults(prevState, {
    squat: ["easy", "easy"],
    plank: ["hard"],
  });
  assert.equal(next.squat.level, 1);
  assert.equal(next.plank.level, 0);
  // 元のオブジェクトは変更されない
  assert.equal(prevState.squat.level, 0);
  assert.equal(prevState.plank.level, 1);
});

test("applySessionResults は記録のない種目のレベルをそのまま保持する", () => {
  const prevState = { squat: { level: 2 } };
  const next = applySessionResults(prevState, {});
  assert.equal(next.squat.level, 2);
});
