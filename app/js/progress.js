// セット記録(きつさ)から次回のレベルを決めるルール。純粋関数のみ(DOM非依存)。

import { MIN_LEVEL, MAX_LEVEL } from "./store.js";

/**
 * 1種目分の今回のセット全ての"きつさ"配列から、次回レベルを計算する。
 * ルール:
 *  - 1セットでも「きつい」があれば -1 (下限あり)
 *  - 記録した全セットが「楽」なら +1 (上限あり)
 *  - それ以外(「ちょうど」中心)は変化なし
 * @param {number} currentLevel
 * @param {Array<'easy'|'ok'|'hard'>} feels
 * @returns {number} 次回レベル
 */
export function nextLevel(currentLevel, feels) {
  if (!Array.isArray(feels) || feels.length === 0) return currentLevel;
  const hasHard = feels.some((f) => f === "hard");
  if (hasHard) return clampLevel(currentLevel - 1);
  const allEasy = feels.every((f) => f === "easy");
  if (allEasy) return clampLevel(currentLevel + 1);
  return currentLevel;
}

export function clampLevel(level) {
  return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, level));
}

/**
 * exerciseState 全体に、1セッション分の記録(種目ごとのfeels)を反映した新しい exerciseState を返す(不変更新)。
 * @param {object} exerciseState - id -> { level }
 * @param {object} feelsByExerciseId - id -> Array<'easy'|'ok'|'hard'>
 */
export function applySessionResults(exerciseState, feelsByExerciseId) {
  const next = { ...exerciseState };
  for (const [id, feels] of Object.entries(feelsByExerciseId)) {
    const current = (exerciseState[id] && exerciseState[id].level) || 0;
    next[id] = { level: nextLevel(current, feels) };
  }
  return next;
}
