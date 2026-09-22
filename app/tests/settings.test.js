import test from "node:test";
import assert from "node:assert/strict";
import { defaultProfile, emptyState, STORAGE_KEY, MAX_BYTES } from "../js/store.js";

// Minimal DOM surface used by dom.js; exercise the real form event handlers.
class TestNode {
  constructor(tag, text = "") {
    this.tag = tag;
    this.text = text;
    this.children = [];
    this.attrs = {};
    this.events = {};
  }
  appendChild(node) { this.children.push(node); return node; }
  removeChild(node) { this.children.splice(this.children.indexOf(node), 1); }
  get firstChild() { return this.children[0]; }
  setAttribute(key, value) { this.attrs[key] = value; }
  addEventListener(name, handler) { this.events[name] = handler; }
  get textContent() { return this.text + this.children.map(n => n.textContent).join(""); }
}

let instance = 0;
async function setup(t) {
  const root = new TestNode("root");
  let stored = JSON.stringify({ ...emptyState(), profile: { ...defaultProfile(), onboarded: true } });
  const originals = new Map(["window", "document", "FileReader"].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  t.after(() => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  globalThis.document = {
    getElementById: () => root,
    createElement: tag => new TestNode(tag),
    createTextNode: text => new TestNode("text", text),
  };
  globalThis.window = {
    localStorage: {
      getItem: key => key === STORAGE_KEY ? stored : null,
      setItem: (key, value) => { assert.equal(key, STORAGE_KEY); stored = value; },
    },
    alert: message => assert.fail(message),
  };
  await import(`../js/app.js?settings-test=${instance++}`);
  const nodes = (node = root) => [node, ...node.children.flatMap(child => nodes(child))];
  const button = label => nodes().find(n => n.tag === "button" && n.textContent === label);
  const click = label => { assert.ok(button(label), label); button(label).events.click(); };
  const selected = label => assert.equal(button(label).attrs["aria-pressed"], "true", label);
  click("設定");
  return { root, nodes, button, click, selected, saved: () => JSON.parse(stored) };
}

test("設定の全項目は再描画をまたいで保持され、保存時にだけプロフィールへ反映される", async t => {
  const ui = await setup(t);
  ui.click("今日");
  const beforeMenu = ui.nodes().filter(n => n.className === "menu-item").map(n => n.textContent);
  ui.click("設定");
  for (const label of ["筋力アップ", "慣れている", "ジム", "週4回", "45分"]) {
    ui.click(label);
    ui.selected(label);
  }
  assert.equal(ui.saved().profile.goal, "tighten");
  ui.click("設定");
  ui.selected("筋力アップ");
  ui.click("この内容で保存");
  assert.deepEqual(ui.saved().profile, {
    goal: "strength", experience: "experienced", place: "gym", daysPerWeek: 4, minutes: 45, onboarded: true,
  });
  ui.click("体力づくり");
  assert.equal(ui.saved().profile.goal, "strength");
  ui.click("今日");
  const afterMenu = ui.nodes().filter(n => n.className === "menu-item").map(n => n.textContent);
  assert.notDeepEqual(afterMenu, beforeMenu);
  ui.click("設定");
  ui.selected("筋力アップ");
  assert.equal(ui.button("設定").attrs["aria-current"], "page");
  assert.equal(ui.button("今日").attrs["aria-current"], undefined);
  assert.equal(ui.button("体力づくり").attrs["aria-pressed"], "false");
  assert.deepEqual(ui.nodes().filter(n => n.attrs.role === "group").map(n => n.attrs["aria-label"]),
    ["目的", "経験", "場所と器具", "週の回数", "1回の時間"]);
});

test("インポートは読み込み前に4MB上限を確認し、成功時に設定ドラフトを更新する", async t => {
  const ui = await setup(t);
  ui.click("筋力アップ");
  let reads = 0;
  const restored = { ...emptyState(), profile: { ...defaultProfile(), goal: "posture", onboarded: true } };
  globalThis.FileReader = class {
    readAsText() { reads++; this.result = JSON.stringify(restored); this.onload(); }
  };
  const upload = size => ui.nodes().find(n => n.attrs.type === "file").events.change({ target: { files: [{ size }] } });
  upload(MAX_BYTES + 1);
  assert.equal(reads, 0);
  assert.ok(ui.root.textContent.includes("ファイルが大きすぎます(4MBまで)"));
  ui.selected("筋力アップ");
  upload(MAX_BYTES);
  assert.equal(reads, 1);
  assert.deepEqual(ui.saved(), restored);
  ui.selected("姿勢改善");
  assert.equal(ui.nodes().find(n => n.attrs.type === "file").attrs["aria-label"], "JSONインポート（バックアップから復元）");
});

test("全消去は確認とキャンセルを維持し、確定後は設定ドラフトを初期化する", async t => {
  const ui = await setup(t);
  ui.click("筋力アップ");
  ui.click("全データを消去する");
  assert.notEqual(ui.saved().profile, null);
  ui.selected("筋力アップ");
  ui.click("やめる");
  ui.selected("筋力アップ");
  ui.click("全データを消去する");
  ui.click("はい、消去する");
  assert.deepEqual(ui.saved(), emptyState());
  ui.selected("体を引き締める");
});
