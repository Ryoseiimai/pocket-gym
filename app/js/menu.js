// 今日のメニュー生成。乱数は使わず、日付文字列から導出した整数シードだけを使う
// (同じ date + profile + exerciseState なら常に同じメニューになる=再現可能)。

import { EXERCISES, availableEquipment, suitableForExperience } from "./exercises.js";

const BODY_PART_CYCLES = {
  2: ["full", "full"],
  3: ["upper", "lower", "full"],
  4: ["upper", "lower", "core", "full"],
};

const BASE_REPS = 10;
const BASE_SECONDS = 30;
const REPS_PER_LEVEL = 2;
const SECONDS_PER_LEVEL = 5;
const MIN_REPS = 5;
const MIN_SECONDS = 15;
const BASE_SETS = 3;
const MAX_SETS = 4;
const REST_SECONDS_REPS = 45;
const REST_SECONDS_TIMED = 20;

/** 文字列から決定的な32bit整数を作る(FNV-1aベース) */
export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** シード付き擬似乱数生成器(mulberry32)。0以上1未満の小数を返す関数を返す */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yatesをseeded randomで行う決定的シャッフル(元配列は変更しない) */
export function seededShuffle(arr, rand) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** date文字列(YYYY-MM-DD)から1970-01-01からの経過日数を返す */
export function daysSinceEpoch(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

/** その日に鍛える部位を返す('upper'|'lower'|'core'|'full') */
export function bodyPartForDate(dateStr, daysPerWeek) {
  const cycle = BODY_PART_CYCLES[daysPerWeek] || BODY_PART_CYCLES[3];
  const idx = ((daysSinceEpoch(dateStr) % cycle.length) + cycle.length) % cycle.length;
  return cycle[idx];
}

/** minutes(1回の時間)から組む種目数を決める */
export function exerciseCountFor(minutes) {
  const n = Math.round(minutes / 6);
  return Math.max(3, Math.min(8, n));
}

function levelOf(exerciseState, id) {
  const s = exerciseState && exerciseState[id];
  return s && typeof s.level === "number" ? s.level : 0;
}

/** 種目1件分のセット・回数(秒数)・休憩秒を、現在のレベルから計算する */
export function planFor(exercise, level) {
  const sets = BASE_SETS;
  if (exercise.unit === "seconds") {
    const seconds = Math.max(MIN_SECONDS, BASE_SECONDS + level * SECONDS_PER_LEVEL);
    return { unit: "seconds", sets, amount: seconds, restSeconds: REST_SECONDS_TIMED };
  }
  const reps = Math.max(MIN_REPS, BASE_REPS + level * REPS_PER_LEVEL);
  return { unit: "reps", sets, amount: reps, restSeconds: REST_SECONDS_REPS };
}

/** 部位ローテーション内で目的に合う種目を優先。同点はシード順を保つ。 */
function goalPriority(exercise, goal) {
  if (goal === "stamina") return Number(exercise.unit === "seconds") + Number(exercise.bodyPart === "full");
  if (goal === "strength") return Number(exercise.unit === "reps");
  if (goal === "posture") return Number(exercise.bodyPart === "core" || exercise.movement === "pull" || exercise.id === "superman");
  return 0;
}

function fixedPhase(phase) {
  return EXERCISES.filter((e) => e.phase === phase).map((e) => ({
    exerciseId: e.id, phase, unit: "seconds", sets: 1,
    amount: e.id === "warmup-march" ? 45 : 30, restSeconds: 0,
  }));
}

/**
 * 今日のメニューを生成する(決定的)。
 * @param {object} profile - store.js の profile 形式
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {object} exerciseState - id -> { level }
 * @returns {Array<{exerciseId:string, unit:string, sets:number, amount:number, restSeconds:number, phase:string}>}
 */
export function generateMenu(profile, dateStr, exerciseState = {}) {
  if (!profile) return [];
  const equip = availableEquipment(profile.place);
  const bodyPart = bodyPartForDate(dateStr, profile.daysPerWeek);
  const count = exerciseCountFor(profile.minutes);

  const eligible = EXERCISES.filter((e) => !e.phase && equip.has(e.equipment) && suitableForExperience(e, profile.experience));
  const primary = bodyPart === "full" ? eligible : eligible.filter((e) => e.bodyPart === bodyPart || e.bodyPart === "full");
  const rest = eligible.filter((e) => !primary.includes(e));

  const seed = hashString(`${dateStr}|${profile.place}|${profile.experience}|${bodyPart}`);
  const rand = seededRandom(seed);
  const prioritize = (items) => items.sort((a, b) => goalPriority(b, profile.goal) - goalPriority(a, profile.goal));
  const pool = [...prioritize(seededShuffle(primary, rand)), ...prioritize(seededShuffle(rest, seededRandom(seed ^ 0x9e3779b9)))];

  const picked = pool.slice(0, count);
  const main = picked.map((e) => {
    const plan = planFor(e, levelOf(exerciseState, e.id));
    if (profile.goal === "strength" && e.unit === "reps") plan.sets = Math.min(MAX_SETS, plan.sets + 1);
    return { exerciseId: e.id, phase: "main", ...plan };
  });
  return [...fixedPhase("warmup"), ...main, ...fixedPhase("cooldown")];
}
