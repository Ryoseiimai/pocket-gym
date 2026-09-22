// localStorage を扱う唯一のモジュール。キーは "pocketgym.v1" 固定。
// DOM に依存しないため node:test でスキーマ検証だけ単体テストできる。

import { EXERCISES } from "./exercises.js";

export const STORAGE_KEY = "pocketgym.v1";
export const MAX_BYTES = 4 * 1024 * 1024; // 4MB
export const MAX_ARRAY_LEN = 10000;
export const MAX_STRING_LEN = 500;

const EXERCISE_IDS = new Set(EXERCISES.map((e) => e.id));
const GOALS = ["tighten", "strength", "stamina", "posture"];
const EXPERIENCES = ["beginner", "some", "experienced"];
const PLACES = ["home-none", "home-dumbbell", "gym"];
const DAYS = [2, 3, 4];
const MINUTES = [15, 30, 45];
const FEELS = ["easy", "ok", "hard"];

export const MIN_LEVEL = -2;
export const MAX_LEVEL = 3;

export function emptyState() {
  return {
    version: 1,
    profile: null, // 未カウンセリングは null
    exerciseState: {}, // id -> { level }
    logs: [], // { date, exerciseId, feel, count }
    sessions: [], // { date, exerciseIds: string[] } 振り返り集計用
  };
}

export function defaultProfile() {
  return {
    goal: "tighten",
    experience: "beginner",
    place: "home-none",
    daysPerWeek: 3,
    minutes: 30,
    onboarded: false,
  };
}

function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isValidString(v, maxLen = MAX_STRING_LEN) {
  return typeof v === "string" && v.length > 0 && v.length <= maxLen;
}

function isValidDate(v) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function isValidLevel(v) {
  return typeof v === "number" && Number.isFinite(v) && v >= MIN_LEVEL && v <= MAX_LEVEL;
}

function sanitizeProfile(raw) {
  if (raw === null) return null;
  if (!isPlainObject(raw)) return null;
  if (!GOALS.includes(raw.goal)) return null;
  if (!EXPERIENCES.includes(raw.experience)) return null;
  if (!PLACES.includes(raw.place)) return null;
  if (!DAYS.includes(raw.daysPerWeek)) return null;
  if (!MINUTES.includes(raw.minutes)) return null;
  return {
    goal: raw.goal,
    experience: raw.experience,
    place: raw.place,
    daysPerWeek: raw.daysPerWeek,
    minutes: raw.minutes,
    onboarded: raw.onboarded === true,
  };
}

function sanitizeExerciseState(raw, errors) {
  if (raw === undefined) return {};
  if (!isPlainObject(raw)) {
    errors.push("exerciseState はオブジェクトである必要があります");
    return null;
  }
  const out = {};
  let count = 0;
  for (const [id, val] of Object.entries(raw)) {
    if (count > MAX_ARRAY_LEN) {
      errors.push("exerciseState の件数が上限を超えています");
      return null;
    }
    count += 1;
    if (!EXERCISE_IDS.has(id)) continue; // 未知の種目IDは無視して捨てる
    if (!isPlainObject(val) || !isValidLevel(val.level)) continue;
    out[id] = { level: val.level };
  }
  return out;
}

function sanitizeLogs(raw, errors) {
  if (!Array.isArray(raw)) {
    errors.push("logs は配列である必要があります");
    return null;
  }
  if (raw.length > MAX_ARRAY_LEN) {
    errors.push(`logs は${MAX_ARRAY_LEN}件までです`);
    return null;
  }
  const out = [];
  for (const l of raw) {
    const bad =
      !isPlainObject(l) ||
      !isValidDate(l.date) ||
      !isValidString(l.exerciseId, 100) ||
      !EXERCISE_IDS.has(l.exerciseId) ||
      !FEELS.includes(l.feel) ||
      typeof l.count !== "number" ||
      !Number.isFinite(l.count) ||
      l.count < 0 ||
      l.count > 100000;
    if (bad) {
      errors.push("不正な記録(logs)が含まれています");
      return null;
    }
    out.push({ date: l.date, exerciseId: l.exerciseId, feel: l.feel, count: l.count });
  }
  return out;
}

function sanitizeSessions(raw, errors) {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) {
    errors.push("sessions は配列である必要があります");
    return null;
  }
  if (raw.length > MAX_ARRAY_LEN) {
    errors.push(`sessions は${MAX_ARRAY_LEN}件までです`);
    return null;
  }
  const out = [];
  for (const s of raw) {
    if (!isPlainObject(s) || !isValidDate(s.date) || !Array.isArray(s.exerciseIds) || s.exerciseIds.length > 100) {
      errors.push("不正なセッション記録(sessions)が含まれています");
      return null;
    }
    const ids = [];
    let bad = false;
    for (const id of s.exerciseIds) {
      if (typeof id !== "string" || !EXERCISE_IDS.has(id)) {
        bad = true;
        break;
      }
      ids.push(id);
    }
    if (bad) {
      errors.push("不正なセッション記録(sessions)が含まれています");
      return null;
    }
    out.push({ date: s.date, exerciseIds: ids });
  }
  return out;
}

/**
 * インポートJSONをスキーマ検証する。
 * 戻り値: { ok: boolean, errors: string[], data?: object }
 * 失敗時は data を返さない(呼び出し側で何も上書きしない)。
 */
export function validateImport(raw) {
  const errors = [];

  if (!isPlainObject(raw)) {
    return { ok: false, errors: ["ルートはオブジェクトである必要があります"] };
  }
  if (raw.version !== 1) {
    errors.push("version は 1 である必要があります");
  }

  const profile = raw.profile === undefined ? null : sanitizeProfile(raw.profile);
  if (raw.profile !== undefined && raw.profile !== null && profile === null) {
    errors.push("profile が不正です");
  }

  const exerciseState = sanitizeExerciseState(raw.exerciseState, errors);
  const logs = sanitizeLogs(raw.logs, errors);
  const sessions = sanitizeSessions(raw.sessions, errors);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const data = { version: 1, profile, exerciseState, logs, sessions };
  const size = new TextEncoder().encode(JSON.stringify(data)).length;
  if (size > MAX_BYTES) {
    return { ok: false, errors: ["データサイズが上限(4MB)を超えています"] };
  }

  return { ok: true, errors: [], data };
}

/** state を localStorage に保存する。サイズ上限を超える場合は保存せず false を返す */
export function saveState(state) {
  const json = JSON.stringify(state);
  const size = new TextEncoder().encode(json).length;
  if (size > MAX_BYTES) return false;
  window.localStorage.setItem(STORAGE_KEY, json);
  return true;
}

/** localStorage から state を読み込む。無ければ初期状態を返す */
export function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    const result = validateImport(parsed);
    if (!result.ok) return emptyState();
    return result.data;
  } catch {
    return emptyState();
  }
}
