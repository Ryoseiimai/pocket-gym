// 振り返り集計。DOM非依存の純粋関数のみ(SVG描画用の座標計算まで)。

import { nextLevel } from "./progress.js";

const DAY_MS = 86400000;

function toDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function diffDays(a, b) {
  return Math.round((toDate(a) - toDate(b)) / DAY_MS);
}

/** 直近7日(today含む)に実施したセッション日の集合を返す */
export function sessionDatesInLastWeek(sessions, todayStr) {
  return sessions
    .map((s) => s.date)
    .filter((d) => {
      const diff = diffDays(todayStr, d);
      return diff >= 0 && diff < 7;
    });
}

/** 今週(直近7日)の実施回数 */
export function weeklySessionCount(sessions, todayStr) {
  return new Set(sessionDatesInLastWeek(sessions, todayStr)).size;
}

/** 今日から遡って連続で実施している日数(streak) */
export function currentStreak(sessions, todayStr) {
  const dates = new Set(sessions.map((s) => s.date));
  let streak = 0;
  let cursor = todayStr;
  // 今日まだやっていなくても、昨日までの連続は数える
  if (!dates.has(cursor)) {
    cursor = shiftDate(cursor, -1);
  }
  while (dates.has(cursor)) {
    streak += 1;
    cursor = shiftDate(cursor, -1);
  }
  return streak;
}

function shiftDate(dateStr, deltaDays) {
  const d = toDate(dateStr);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/**
 * 指定種目の、記録日ごとのレベル推移を再計算する(履歴を別途保存せず logs から再現する)。
 * @returns {Array<{date:string, level:number}>} 日付昇順
 */
export function levelHistoryFor(exerciseId, logs) {
  const byDate = new Map();
  for (const l of logs) {
    if (l.exerciseId !== exerciseId) continue;
    if (!byDate.has(l.date)) byDate.set(l.date, []);
    byDate.get(l.date).push(l.feel);
  }
  const dates = [...byDate.keys()].sort();
  let level = 0;
  const history = [];
  for (const date of dates) {
    level = nextLevel(level, byDate.get(date));
    history.push({ date, level });
  }
  return history;
}

/**
 * SVG折れ線用の座標に変換する。
 * @param {Array<{date:string, level:number}>} history
 * @param {{width:number, height:number, padding:number, minLevel:number, maxLevel:number}} opts
 * @returns {Array<{x:number, y:number}>}
 */
export function toSvgPoints(history, opts) {
  const { width, height, padding = 8, minLevel = -2, maxLevel = 3 } = opts;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const span = Math.max(1, maxLevel - minLevel);
  if (history.length === 0) return [];
  if (history.length === 1) {
    const y = padding + innerH * (1 - (history[0].level - minLevel) / span);
    return [{ x: padding + innerW / 2, y }];
  }
  return history.map((h, i) => {
    const x = padding + (innerW * i) / (history.length - 1);
    const y = padding + innerH * (1 - (h.level - minLevel) / span);
    return { x, y };
  });
}

/** 種目別の直近合計実施回数(セット消化数)を返す(振り返りの一覧用) */
export function totalSetsByExercise(logs) {
  const out = new Map();
  for (const l of logs) {
    out.set(l.exerciseId, (out.get(l.exerciseId) || 0) + 1);
  }
  return out;
}
