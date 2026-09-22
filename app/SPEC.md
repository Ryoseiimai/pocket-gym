# ポケットジム 仕様書 v1

## 目的
パーソナルジムに通わなくても、携帯だけで「初回カウンセリング → 今日のメニュー → 実行 → 記録して自動調整」が完結するトレーニングアプリ。
最初のユーザーは妹（すず）。公開OSSとして誰でも種目・練習メニューを追加できる形にする。

## 絶対条件
- **バックエンドなし・ログインなし・個人情報を扱わない。** 全データはブラウザの localStorage のみ（キー `pocketgym.v1`）。
- **依存ライブラリなし**（ビルド不要の素の HTML/CSS/ES Modules。外部 CDN・外部スクリプト・外部フォント・Analytics 一切禁止）。
- GitHub Pages でそのまま動く静的サイト（`index.html` をルートに置く）。
- 日本語UI。スマホ（幅375px）で片手操作できることを最優先。
- 医療・診断の助言はしない。痛みが出たら中止・持病がある人は医師に相談、を初回と設定に明記する。

## セキュリティ要件（`~/dev/2026-09-23-smash-note` と同一水準）
1. DOM構築は `js/dom.js` の `el()`/`clear()`/`svgEl()` のみを使い、`innerHTML`/`outerHTML`/`insertAdjacentHTML`/`srcdoc` は一切使わない。ユーザー入力は必ず `textContent`（`el()`経由）で出す。
2. CSP: `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; manifest-src 'self'; base-uri 'none'; form-action 'none'`(`frame-ancestors` は meta要素では無効なブラウザ警告が出るため付けない)
3. `eval` / `new Function` / `javascript:` URL / `document.write` 禁止。
4. JSONインポートはスキーマ検証（型・必須キー・配列長上限10,000・文字列長上限500）を通してから保存。失敗時は何も上書きしない。
5. localStorage キーは `pocketgym.v1` の1本。保存前に4MB上限を確認。
6. `SECURITY.md`・`.github/dependabot.yml`（github-actions のみ）・`.github/workflows/ci.yml`（node --check・禁止パターンgrep・node --test）を用意。
7. 外部リンクは `rel="noopener noreferrer"`。

## 機能（実装順）

### 1. 初回カウンセリング
質問: 目的（体を引き締める/筋力アップ/体力づくり/姿勢改善）、経験（はじめて/少しある/慣れている）、場所と器具（自宅・器具なし／自宅・ダンベルあり／ジム）、週の回数（2〜4）、1回の時間（15/30/45分）。
回答は `profile` として保存。設定タブからいつでも変更可。

### 2. 今日のメニュー自動生成（`js/menu.js`）
- 日付＋プロファイル＋各種目の現在レベル（`exerciseState`）から**決定的なルール**で種目・セット数・回数(または秒数)・休憩秒を組む。乱数は使わず、日付文字列から導出した整数シードで再現可能にする。
- 週内で部位（全身/上半身/下半身/体幹）をローテーションする。
- 場所・器具・経験に合わない種目は候補から除外する。

### 3. トレーニング実行画面
1種目ずつ大きく表示。フォームのポイント3行。セット完了ボタン。休憩タイマー（カウントダウン表示、音なし・終了時は対応端末で振動）。375px幅で操作完結。
各セット完了時に「きつさ」（楽/ちょうど/きつい）を記録する。

### 4. 記録と自動調整（`js/progress.js`）
セットごとの実施回数と「きつさ」を `logs` に記録。
調整ルール（決定的・テスト可能）:
- そのセッションの全セットが「楽」→ 次回そのレベル+1
- いずれかのセットが「きつい」→ 次回そのレベル-1（下限あり）
- それ以外（「ちょうど」中心）→ 変化なし
レベルは種目ごとの基準回数/秒数・休憩秒に反映される。

### 5. 振り返り
今週の実施回数、連続日数（streak）、種目別の伸び（レベル推移）を手書きSVG折れ線で表示（外部ライブラリ禁止）。

### 6. データ
JSONエクスポート/インポート（スキーマ検証、失敗時は上書きしない）。全消去は2段階確認。

### 7. 種目データ（`js/exercises.js`）
1種目 = `{ id, name, bodyPart, equipment: ['none'|'dumbbell'|'gym'], difficulty: 1-3, unit: 'reps'|'seconds', points: [string,string,string], easierId, harderId }`。
自宅・器具なしだけで週3回組める量として最低25種目以上を収録。`CONTRIBUTING.md` に追加方法を書く。

## 画面構成
下タブ4つ: `今日` `記録` `振り返り` `設定`。

## デザイン
白黒ベース＋アクセント1色（有彩色5%未満）。本文16px以上。ボタン高さ44px以上。`prefers-color-scheme` でダークモード対応。

## ファイル構成
```
index.html
css/style.css
js/dom.js         (innerHTML禁止のためのDOM構築ヘルパー)
js/store.js       (localStorage・スキーマ検証)
js/exercises.js   (種目データ)
js/menu.js        (今日のメニュー生成・決定的ルール)
js/progress.js    (セット記録からの自動調整ルール)
js/stats.js       (週次集計・streak・SVG折れ線用の座標計算)
js/app.js         (状態・ルーティング・描画)
manifest.webmanifest / icon.svg
README.md / LICENSE(MIT) / SECURITY.md / CONTRIBUTING.md / .github/
tests/            (node:test で menu.js / progress.js / store.js の単体テスト。ブラウザ不要)
```

## 完了条件
- `node --test tests/*.test.js` が通る（メニュー生成・自動調整ロジック含む）。
- CI と同じ静的チェックがローカルで通る（innerHTML/eval/外部URLゼロ）。
- `python3 -m http.server` で配信し、375px幅で4画面（初回カウンセリング・今日のメニュー・実行中/休憩タイマー・振り返り）のスクリーンショットを `verification/` に保存。コンソールエラー0。

## やらないこと（v1）
- クラウド同期・共有・ログイン・課金。
- 音・バイブ通知。
- Capacitor/iOSネイティブ化（別タスク）。
