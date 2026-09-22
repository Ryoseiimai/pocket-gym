import test from "node:test";
import assert from "node:assert/strict";
import { generateMenu, exerciseCountFor, bodyPartForDate, planFor, hashString, seededShuffle, seededRandom } from "../js/menu.js";
import { EXERCISES, availableEquipment, maxDifficultyFor } from "../js/exercises.js";

function baseProfile(overrides = {}) {
  return {
    goal: "tighten",
    experience: "beginner",
    place: "home-none",
    daysPerWeek: 3,
    minutes: 30,
    onboarded: true,
    ...overrides,
  };
}

test("generateMenu は同じ入力なら常に同じメニューを返す(決定的)", () => {
  const profile = baseProfile();
  const a = generateMenu(profile, "2026-10-15", {});
  const b = generateMenu(profile, "2026-10-15", {});
  assert.deepEqual(a, b);
});

test("generateMenu は日付が変わるとメニューも変わりうる", () => {
  const profile = baseProfile();
  const a = generateMenu(profile, "2026-10-15", {});
  const b = generateMenu(profile, "2026-10-16", {});
  assert.notDeepEqual(a.map((m) => m.exerciseId), b.map((m) => m.exerciseId));
});

test("generateMenu は器具なしプロファイルでは equipment=none の種目しか選ばない", () => {
  const profile = baseProfile({ place: "home-none" });
  const menu = generateMenu(profile, "2026-10-15", {});
  for (const item of menu) {
    const ex = EXERCISES.find((e) => e.id === item.exerciseId);
    assert.equal(ex.equipment, "none");
  }
});

test("generateMenu は経験に応じて最大difficultyを超える種目を選ばない", () => {
  const profile = baseProfile({ experience: "beginner", place: "gym" });
  const menu = generateMenu(profile, "2026-10-15", {});
  const maxDiff = maxDifficultyFor("beginner");
  for (const item of menu) {
    const ex = EXERCISES.find((e) => e.id === item.exerciseId);
    assert.ok(ex.difficulty <= maxDiff);
  }
});

test("generateMenu は profile が null なら空配列", () => {
  assert.deepEqual(generateMenu(null, "2026-10-15", {}), []);
});

test("exerciseCountFor は時間に応じて3〜8件にクランプされる", () => {
  assert.equal(exerciseCountFor(15), Math.max(3, Math.min(8, Math.round(15 / 6))));
  assert.ok(exerciseCountFor(15) >= 3);
  assert.ok(exerciseCountFor(45) <= 8);
});

test("bodyPartForDate は daysPerWeek のサイクルの範囲内の値を返す", () => {
  const part = bodyPartForDate("2026-10-15", 3);
  assert.ok(["upper", "lower", "full"].includes(part));
});

test("planFor はレベルが上がるほど回数/秒数が増える", () => {
  const repsExercise = EXERCISES.find((e) => e.unit === "reps");
  const low = planFor(repsExercise, -1);
  const high = planFor(repsExercise, 2);
  assert.ok(high.amount > low.amount);
});

test("planFor は最低回数/秒数を下回らない", () => {
  const repsExercise = EXERCISES.find((e) => e.unit === "reps");
  const plan = planFor(repsExercise, -2);
  assert.ok(plan.amount >= 5);
});

test("hashString は同じ文字列に対して常に同じ値を返す", () => {
  assert.equal(hashString("abc"), hashString("abc"));
  assert.notEqual(hashString("abc"), hashString("abd"));
});

test("seededShuffle はシードが同じなら同じ結果、元配列は変更しない", () => {
  const arr = [1, 2, 3, 4, 5];
  const a = seededShuffle(arr, seededRandom(42));
  const b = seededShuffle(arr, seededRandom(42));
  assert.deepEqual(a, b);
  assert.deepEqual(arr, [1, 2, 3, 4, 5]);
});

test("availableEquipment はジムなら全ての器具レベルを含む", () => {
  const set = availableEquipment("gym");
  assert.ok(set.has("none") && set.has("dumbbell") && set.has("gym"));
});

test("自宅・器具なしだけで週3回組める量として25種目以上ある", () => {
  const noneOnly = EXERCISES.filter((e) => e.equipment === "none");
  assert.ok(noneOnly.length >= 25, `expected >=25, got ${noneOnly.length}`);
});

test("全プロファイルで準備75秒・整理60秒を専用IDで固定し、メインだけ時間設定に従う", () => {
  for (const experience of ["beginner", "some", "experienced"]) {
    for (const place of ["home-none", "home-dumbbell", "gym"]) {
      for (const goal of ["tighten", "stamina", "strength", "posture"]) {
        for (const minutes of [15, 30, 45]) {
          for (const daysPerWeek of [2, 3, 4]) {
            const profile = baseProfile({ experience, place, goal, minutes, daysPerWeek });
            const menu = generateMenu(profile, "2026-10-15");
            assert.equal(menu[0].phase, "warmup");
            assert.equal(menu.at(-1).phase, "cooldown");
            assert.deepEqual(menu.map((m) => m.phase), [
              "warmup", "warmup", ...Array(exerciseCountFor(minutes)).fill("main"), "cooldown", "cooldown",
            ]);
            assert.equal(new Set(menu.map((m) => m.exerciseId)).size, menu.length);
            for (const phase of ["warmup", "cooldown"]) {
              const items = menu.filter((m) => m.phase === phase);
              assert.equal(items.reduce((sum, m) => sum + m.amount, 0), phase === "warmup" ? 75 : 60);
              for (const item of items) {
                const ex = EXERCISES.find((e) => e.id === item.exerciseId);
                assert.equal(ex.phase, phase);
                assert.equal(ex.difficulty, 1);
                assert.equal(ex.equipment, "none");
                assert.notEqual(ex.impact, "high");
                assert.equal(item.sets, 1);
                assert.equal(item.unit, "seconds");
                assert.equal(item.restSeconds, 0);
              }
            }
            assert.ok(menu.filter((m) => m.phase === "main").every((m) => !EXERCISES.find((e) => e.id === m.exerciseId).phase));
          }
        }
      }
    }
  }
});

test("準備・整理運動はセッション評価で保存レベルが変わっても量を変えない", async () => {
  const { applySessionResults } = await import("../js/progress.js");
  const profile = baseProfile();
  const menu = generateMenu(profile, "2026-10-15");
  const fixed = menu.filter((m) => m.phase !== "main");
  for (const feel of ["easy", "hard"]) {
    const state = applySessionResults({}, Object.fromEntries(menu.map((m) => [m.exerciseId, [feel]])));
    const next = generateMenu(profile, "2026-10-15", state);
    assert.deepEqual(next.filter((m) => m.phase !== "main"), fixed);
    assert.notDeepEqual(next.filter((m) => m.phase === "main"), menu.filter((m) => m.phase === "main"));
  }
});

test("少しあるはジャンプ系・バーピー・片脚スクワットを全日程と目的で除外", () => {
  const excluded = new Set(["jump-squat", "jump-lunge", "jumping-jack", "burpee", "pistol-squat"]);
  const experiencedSeen = new Set();
  for (let day = 1; day <= 28; day++) {
    for (const goal of ["tighten", "stamina", "strength", "posture"]) {
      for (const place of ["home-none", "home-dumbbell", "gym"]) {
        const profile = baseProfile({ experience: "some", goal, place, minutes: 45 });
        const date = `2026-10-${String(day).padStart(2, "0")}`;
        assert.ok(generateMenu(profile, date).every((m) => !excluded.has(m.exerciseId)));
        for (const item of generateMenu({ ...profile, experience: "experienced" }, date)) experiencedSeen.add(item.exerciseId);
      }
    }
  }
  for (const id of excluded) assert.ok(experiencedSeen.has(id), id);
});

test("目的別メニューは同条件でも変わり、決定性と部位の優先を維持する", () => {
  const menus = ["tighten", "stamina", "strength", "posture"].map((goal) => {
    const profile = baseProfile({ goal, place: "gym", minutes: 30 });
    const menu = generateMenu(profile, "2026-10-15");
    assert.deepEqual(menu, generateMenu(profile, "2026-10-15"));
    return menu;
  });
  for (let i = 0; i < menus.length; i++) {
    for (let j = i + 1; j < menus.length; j++) assert.notDeepEqual(menus[i], menus[j]);
  }
  for (const item of menus[2].filter((m) => m.phase === "main")) {
    assert.equal(item.sets, item.unit === "reps" ? 4 : 3);
  }
  // 週2回は全身の日なので、目的ごとの優先順位を直接確認できる。
  for (const goal of ["stamina", "posture"]) {
    const main = generateMenu(baseProfile({ goal, daysPerWeek: 2, minutes: 15 }), "2026-10-15").filter((m) => m.phase === "main");
    for (const item of main) {
      const ex = EXERCISES.find((e) => e.id === item.exerciseId);
      assert.ok(goal === "stamina" ? ex.unit === "seconds" : ex.bodyPart === "core" || ex.id === "superman");
    }
  }
});

test("ダンベルロウの易しい代替に押す種目を指定しない", () => {
  assert.equal(EXERCISES.find((e) => e.id === "db-row").easierId, null);
});
