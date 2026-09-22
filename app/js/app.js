import { el, clear, svgEl } from "./dom.js";
import { loadState, saveState, validateImport, defaultProfile, emptyState, MAX_BYTES } from "./store.js";
import { exerciseById } from "./exercises.js";
import { generateMenu } from "./menu.js";
import { applySessionResults } from "./progress.js";
import { weeklySessionCount, currentStreak, levelHistoryFor, toSvgPoints, totalSetsByExercise } from "./stats.js";

const TABS = ["today", "log", "reflect", "settings"];
const TAB_LABELS = { today: "今日", log: "記録", reflect: "振り返り", settings: "設定" };

const GOAL_LABELS = { tighten: "体を引き締める", strength: "筋力アップ", stamina: "体力づくり", posture: "姿勢改善" };
const EXPERIENCE_LABELS = { beginner: "はじめて", some: "少しある", experienced: "慣れている" };
const PLACE_LABELS = { "home-none": "自宅・器具なし", "home-dumbbell": "自宅・ダンベルあり", gym: "ジム" };
const FEEL_LABELS = { easy: "楽", ok: "ちょうど", hard: "きつい" };

let state = loadState();
let currentTab = "today";
let onboardingDraft = defaultProfile();
let settingsDraft = null;
let workout = null; // { menu, index, feelsByExerciseId, resting, restRemaining, timerId }
let importError = "";
let resetConfirmStep = 0;

const root = document.getElementById("app");

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function persist() {
  const ok = saveState(state);
  if (!ok) window.alert("保存できませんでした。容量不足やプライベートブラウズなど、ブラウザの保存制限が原因の可能性があります。");
}

function setState(patch) {
  state = { ...state, ...patch };
  persist();
  renderApp();
}

function switchTab(tab) {
  if (tab === "settings" && currentTab !== "settings") settingsDraft = null;
  currentTab = tab;
  renderApp();
}

// ---------- 共通パーツ ----------
function notice(text) {
  return el("p", { className: "notice" }, text);
}

function radioGroup(name, options, current, onChange) {
  return el(
    "div",
    { className: "radio-group", role: "group", "aria-label": name },
    options.map(([value, label]) =>
      el(
        "button",
        {
          type: "button",
          className: "choice" + (current === value ? " choice-selected" : ""),
          "aria-pressed": String(current === value),
          onClick: () => onChange(value),
        },
        label
      )
    )
  );
}

// ---------- 初回カウンセリング / 設定フォーム ----------
function renderCounselingForm(draft, onSubmit, submitLabel) {
  return el("div", { className: "card" }, [
    el("h2", {}, "カウンセリング"),
    notice("入力内容はいつでも設定タブから変更できます。"),
    el("label", { className: "field-label" }, "目的"),
    radioGroup("目的", Object.entries(GOAL_LABELS), draft.goal, (v) => {
      draft.goal = v;
      renderApp();
    }),
    el("label", { className: "field-label" }, "経験"),
    radioGroup("経験", Object.entries(EXPERIENCE_LABELS), draft.experience, (v) => {
      draft.experience = v;
      renderApp();
    }),
    el("label", { className: "field-label" }, "場所と器具"),
    radioGroup("場所と器具", Object.entries(PLACE_LABELS), draft.place, (v) => {
      draft.place = v;
      renderApp();
    }),
    el("label", { className: "field-label" }, "週の回数"),
    radioGroup(
      "週の回数",
      [
        [2, "週2回"],
        [3, "週3回"],
        [4, "週4回"],
      ],
      draft.daysPerWeek,
      (v) => {
        draft.daysPerWeek = v;
        renderApp();
      }
    ),
    el("label", { className: "field-label" }, "1回の時間"),
    radioGroup(
      "1回の時間",
      [
        [15, "15分"],
        [30, "30分"],
        [45, "45分"],
      ],
      draft.minutes,
      (v) => {
        draft.minutes = v;
        renderApp();
      }
    ),
    el("p", { className: "disclaimer" }, "このアプリは医療・診断の助言はしません。痛みが出たらすぐに中止し、持病がある方は医師に相談してください。"),
    el(
      "button",
      {
        className: "primary-btn",
        onClick: () => onSubmit({ ...draft, onboarded: true }),
      },
      submitLabel
    ),
  ]);
}

// ---------- 今日のメニュー ----------
function menuForToday() {
  return generateMenu(state.profile, todayStr(), state.exerciseState);
}

function startWorkout() {
  const menu = menuForToday();
  if (menu.length === 0) return;
  workout = { menu, index: 0, setIndex: 0, feelsByExerciseId: {}, resting: false, restRemaining: 0, timerId: null };
  renderApp();
}

function stopTimer() {
  if (workout && workout.timerId !== null) {
    window.clearInterval(workout.timerId);
    workout.timerId = null;
  }
  if (workout && workout.resting) {
    const item = workout.menu[workout.index];
    workout.restMessage = `休憩終了。次は${exerciseById(item.exerciseId).name} セット${workout.setIndex + 1}`;
  }
}

function completeSet(feel) {
  const item = workout.menu[workout.index];
  const feels = workout.feelsByExerciseId[item.exerciseId] || [];
  feels.push(feel);
  workout.feelsByExerciseId[item.exerciseId] = feels;

  const date = todayStr();
  const logs = [...state.logs, { date, exerciseId: item.exerciseId, feel, count: item.amount }];
  state = { ...state, logs };
  persist();

  const isLastSetOfExercise = workout.setIndex + 1 >= item.sets;
  if (isLastSetOfExercise) {
    if (workout.index + 1 >= workout.menu.length) {
      finishWorkout();
      return;
    }
    workout.index += 1;
    workout.setIndex = 0;
    renderApp();
  } else {
    workout.setIndex += 1;
    beginRest(item.restSeconds);
  }
}

function beginRest(seconds) {
  stopTimer();
  workout.resting = true;
  workout.restRemaining = seconds;
  workout.restMessage = `休憩開始(${seconds}秒)`;
  renderApp();
  workout.timerId = window.setInterval(() => {
    workout.restRemaining -= 1;
    if (workout.restRemaining <= 0) {
      stopTimer();
      workout.resting = false;
      try {
        if (typeof navigator.vibrate === "function") navigator.vibrate([200, 100, 200]);
      } catch {
        // 振動を許可しない端末でもトレーニングを続けられるようにする。
      }
      if (currentTab === "today") renderApp();
    } else if (currentTab === "today") {
      const timer = document.querySelector(".rest-timer");
      if (timer) timer.textContent = `${workout.restRemaining}秒`;
      if (workout.restRemaining === 10) {
        workout.restMessage = "もうすぐ再開です";
        if (workout.restStatus.isConnected) workout.restStatus.textContent = workout.restMessage;
      }
    }
  }, 1000);
}

function finishWorkout() {
  stopTimer();
  const date = todayStr();
  const exerciseIds = workout.menu.map((m) => m.exerciseId);
  const exerciseState = applySessionResults(state.exerciseState, workout.feelsByExerciseId);
  const sessions = [...state.sessions.filter((s) => s.date !== date), { date, exerciseIds }];
  state = { ...state, exerciseState, sessions };
  persist();
  workout = null;
  renderApp();
}

function renderWorkout() {
  const item = workout.menu[workout.index];
  const ex = exerciseById(item.exerciseId);
  const progressLabel = `種目 ${workout.index + 1} / ${workout.menu.length}　セット ${workout.setIndex + 1} / ${item.sets}`;

  // 同じ通知領域を使い、DOMへの接続後に節目のメッセージだけを更新する。
  const status = workout.restStatus || el("p", { className: "rest-status", "aria-live": "polite", "aria-atomic": "true" });
  workout.restStatus = status;
  const message = workout.restMessage || `次は${ex.name} セット${workout.setIndex + 1}`;
  if (!workout.resting) workout.restMessage = "";
  window.setTimeout(() => {
    if (status.isConnected && status.textContent !== message) status.textContent = message;
  }, 0);

  if (workout.resting) {
    return el("div", { className: "card workout-card" }, [
      el("p", { className: "progress-label" }, progressLabel),
      el("h2", {}, "休憩中"),
      el("p", { className: "rest-timer", "aria-hidden": "true" }, `${workout.restRemaining}秒`),
      status,
      el("p", {}, "次: " + ex.name),
      el(
        "button",
        {
          className: "secondary-btn",
          onClick: () => {
            stopTimer();
            workout.resting = false;
            renderApp();
          },
        },
        "休憩をスキップ"
      ),
    ]);
  }

  const amountLabel = ex.unit === "seconds" ? `${item.amount}秒` : `${item.amount}回`;
  return el("div", { className: "card workout-card" }, [
    el("p", { className: "progress-label" }, progressLabel),
    status,
    el("h2", { className: "exercise-name" }, ex.name),
    el("p", { className: "exercise-amount" }, amountLabel),
    el(
      "ul",
      { className: "form-points" },
      ex.points.map((p) => el("li", {}, p))
    ),
    el("p", { className: "field-label" }, "このセットのきつさは?"),
    el("div", { className: "feel-buttons" }, [
      el("button", { className: "feel-btn feel-easy", onClick: () => completeSet("easy") }, "楽"),
      el("button", { className: "feel-btn feel-ok", onClick: () => completeSet("ok") }, "ちょうど"),
      el("button", { className: "feel-btn feel-hard", onClick: () => completeSet("hard") }, "きつい"),
    ]),
  ]);
}

function renderToday() {
  if (!state.profile || !state.profile.onboarded) {
    return renderCounselingForm(onboardingDraft, (profile) => {
      state = { ...state, profile };
      persist();
      renderApp();
    }, "はじめる");
  }

  if (workout) return renderWorkout();

  const menu = menuForToday();
  const doneToday = state.sessions.some((s) => s.date === todayStr());

  const children = [
    el("h2", {}, "今日のメニュー"),
    doneToday ? notice("今日はもう完了しています。おつかれさまでした。") : null,
  ];

  if (menu.length === 0) {
    children.push(notice("条件に合う種目が見つかりませんでした。設定を見直してください。"));
  } else {
    children.push(
      el(
        "ul",
        { className: "menu-list" },
        menu.map((item) => {
          const ex = exerciseById(item.exerciseId);
          const amountLabel = ex.unit === "seconds" ? `${item.amount}秒` : `${item.amount}回`;
          return el("li", { className: "menu-item" }, [
            el("span", { className: "menu-item-name" }, ex.name),
            el("span", { className: "menu-item-detail" }, `${item.sets}セット × ${amountLabel}`),
          ]);
        })
      )
    );
    children.push(
      el(
        "button",
        { className: "primary-btn", onClick: startWorkout },
        doneToday ? "もう一度やる" : "トレーニング開始"
      )
    );
  }

  return el("div", { className: "card" }, children);
}

// ---------- 記録 ----------
function renderLog() {
  const logs = [...state.logs].sort((a, b) => (a.date < b.date ? 1 : -1));
  if (logs.length === 0) {
    return el("div", { className: "card" }, [el("h2", {}, "記録"), notice("まだ記録がありません。今日のメニューをこなすとここに残ります。")]);
  }
  const totals = totalSetsByExercise(logs);
  const rows = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, count]) => {
      const ex = exerciseById(id);
      if (!ex) return null;
      return el("li", { className: "log-row" }, [el("span", {}, ex.name), el("span", { className: "log-count" }, `${count}セット`)]);
    })
    .filter(Boolean);
  return el("div", { className: "card" }, [
    el("h2", {}, "記録(種目別 累計セット数)"),
    el("ul", { className: "log-list" }, rows),
  ]);
}

// ---------- 振り返り ----------
function renderChart(exerciseId) {
  const history = levelHistoryFor(exerciseId, state.logs);
  if (history.length < 2) return notice("まだグラフにするデータが足りません。");
  const width = 300;
  const height = 80;
  const points = toSvgPoints(history, { width, height, minLevel: -2, maxLevel: 3 });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return svgEl("svg", { width, height, viewBox: `0 0 ${width} ${height}`, className: "level-chart" }, [
    svgEl("path", { d: path, fill: "none", stroke: "currentColor", "stroke-width": "2" }),
    ...points.map((p) => svgEl("circle", { cx: p.x, cy: p.y, r: 2.5, fill: "currentColor" })),
  ]);
}

function renderReflect() {
  const today = todayStr();
  const weekly = weeklySessionCount(state.sessions, today);
  const streak = currentStreak(state.sessions, today);
  const exerciseIds = [...new Set(state.logs.map((l) => l.exerciseId))];

  return el("div", { className: "card" }, [
    el("h2", {}, "振り返り"),
    el("div", { className: "stat-row" }, [
      el("div", { className: "stat-box" }, [el("div", { className: "stat-num" }, String(weekly)), el("div", { className: "stat-label" }, "今週の実施回数")]),
      el("div", { className: "stat-box" }, [el("div", { className: "stat-num" }, String(streak)), el("div", { className: "stat-label" }, "連続日数")]),
    ]),
    el("h3", {}, "種目別の伸び"),
    exerciseIds.length === 0
      ? notice("まだ記録がありません。")
      : el(
          "div",
          { className: "chart-list" },
          exerciseIds.map((id) => {
            const ex = exerciseById(id);
            if (!ex || ex.phase) return null; // 準備・整理運動は量が固定なので「伸び」には出さない
            return el("div", { className: "chart-item" }, [el("p", { className: "chart-title" }, ex.name), renderChart(id)]);
          }).filter(Boolean)
        ),
  ]);
}

// ---------- 設定 ----------
function download(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = el("a", { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function renderSettings() {
  if (settingsDraft === null) {
    settingsDraft = state.profile ? { ...state.profile } : defaultProfile();
  }

  const dangerZone = el("div", { className: "danger-zone" }, [
    el("h3", {}, "データ"),
    el(
      "button",
      {
        className: "secondary-btn",
        onClick: () => download("pocketgym-data.json", JSON.stringify(state, null, 2)),
      },
      "JSONエクスポート"
    ),
    el("h3", {}, "JSONインポート（バックアップから復元）"),
    el("input", {
      type: "file",
      "aria-label": "JSONインポート（バックアップから復元）",
      accept: "application/json",
      onChange: (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (file.size > MAX_BYTES) {
          importError = "ファイルが大きすぎます(4MBまで)";
          renderApp();
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(String(reader.result));
            const result = validateImport(parsed);
            if (!result.ok) {
              importError = result.errors.join(" / ");
              renderApp();
              return;
            }
            state = result.data;
            settingsDraft = null;
            importError = "";
            persist();
            renderApp();
          } catch {
            importError = "JSONの読み込みに失敗しました。";
            renderApp();
          }
        };
        reader.readAsText(file);
      },
    }),
    importError ? el("p", { className: "error-text" }, importError) : null,
    el("h3", {}, "全消去"),
    resetConfirmStep === 0
      ? el(
          "button",
          {
            className: "danger-btn",
            onClick: () => {
              resetConfirmStep = 1;
              renderApp();
            },
          },
          "全データを消去する"
        )
      : el("div", {}, [
          notice("本当に全データを消去しますか?この操作は取り消せません。"),
          el(
            "button",
            {
              className: "danger-btn",
              onClick: () => {
                state = emptyState();
                settingsDraft = null;
                persist();
                resetConfirmStep = 0;
                onboardingDraft = defaultProfile();
                renderApp();
              },
            },
            "はい、消去する"
          ),
          el(
            "button",
            {
              className: "secondary-btn",
              onClick: () => {
                resetConfirmStep = 0;
                renderApp();
              },
            },
            "やめる"
          ),
        ]),
  ]);

  return el("div", { className: "card" }, [
    el("h2", {}, "設定"),
    renderCounselingForm(
      settingsDraft,
      (profile) => {
        state = { ...state, profile };
        settingsDraft = null;
        persist();
        renderApp();
      },
      "この内容で保存"
    ),
    el("p", { className: "disclaimer" }, "このアプリは医療・診断の助言はしません。痛みが出たらすぐに中止し、持病がある方は医師に相談してください。"),
    el("hr"),
    dangerZone,
  ]);
}

// ---------- 全体レンダリング ----------
function renderTabBar() {
  return el(
    "nav",
    { className: "tab-bar" },
    TABS.map((tab) =>
      el(
        "button",
        {
          type: "button",
          className: "tab-btn" + (currentTab === tab ? " tab-btn-active" : ""),
          "aria-current": currentTab === tab ? "page" : null,
          onClick: () => switchTab(tab),
        },
        TAB_LABELS[tab]
      )
    )
  );
}

function renderApp() {
  clear(root);
  const header = el("header", { className: "app-header" }, [el("h1", {}, "ポケットジム")]);
  let body;
  if (currentTab === "today") body = renderToday();
  else if (currentTab === "log") body = renderLog();
  else if (currentTab === "reflect") body = renderReflect();
  else body = renderSettings();

  root.appendChild(el("div", { className: "app-shell" }, [header, el("main", { className: "app-main" }, body), renderTabBar()]));
}

renderApp();
