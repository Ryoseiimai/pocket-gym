# コントリビュート方法

## 種目を追加する

1. `js/exercises.js` の `EXERCISES` 配列に1件追加する。
   ```js
   { id: "unique-id", name: "種目名", bodyPart: "upper"|"lower"|"core"|"full",
     equipment: "none"|"dumbbell"|"gym", difficulty: 1|2|3, unit: "reps"|"seconds",
     points: ["フォームのポイント1", "ポイント2", "ポイント3"],
     easierId: "もっと楽な種目のid、なければnull",
     harderId: "もっときつい種目のid、なければnull" }
   ```
2. `id` は他と重複しない英数字とハイフンのみ。
3. `points` は必ず3つ、初心者でも分かる短い文で。ダンベル種目は「最初は○kg前後から、10回がちょうどきつい重さ」のような重さの目安を4つ目のpointsとして足してよい。
4. `difficulty` の目安: 1=はじめてでもできる, 2=少し経験があれば, 3=慣れている人向け。
5. `node --test tests/*.test.js` を実行して既存テストが壊れていないことを確認する。
6. 可能であれば `tests/menu.test.js` に、その種目が意図した条件で選ばれることを確認するテストを足す。

## 練習メニューのロジックを直す

`js/menu.js`（メニュー生成）・`js/progress.js`（記録からの自動調整）は純粋関数のみで書かれており、
ブラウザなしで `node --test` から検証できます。ロジックを変える場合は必ずテストを更新してください。

## コーディング規約

- 依存ライブラリ・外部CDN・外部フォントは追加しない。
- DOM構築は `js/dom.js` の `el()` / `svgEl()` のみを使い、`innerHTML` は使わない。
- ユーザー入力を保存する前は `js/store.js` のスキーマ検証を必ず通す。
