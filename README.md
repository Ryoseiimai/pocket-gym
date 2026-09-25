# ポケットジム

パーソナルジムに通わなくても、携帯だけで「初回カウンセリング → 今日のメニュー → 実行 → 記録して自動調整 → 振り返り」が完結するトレーニングアプリです。ログイン不要・課金なし・データは端末の中だけ。

妹の誕生日(10/15)に贈るために作り始めたOSSで、10/15まで毎日みんなの意見を取り入れながら改善していきます。

- 紹介ページ: https://ryoseiimai.github.io/pocket-gym/
- アプリ本体: https://ryoseiimai.github.io/pocket-gym/app/

## 使い方

1. 紹介ページの「使ってみる」からアプリを開く。
2. 初回カウンセリングで目的・経験・場所と器具・週の回数・1回の時間を答える。
3. 「今日のメニュー」から始めて、1種目ずつセットをこなし「きつさ」を記録する。
4. 次回はその記録をもとに回数や秒数が自動で調整され、「振り返り」タブで伸びが見える。

アプリ本体の詳しい仕様は [app/SPEC.md](./app/SPEC.md)、アプリ単体のREADMEは [app/README.md](./app/README.md) を参照してください。

## 10/15までのロードマップ

- **Day 1（公開日）**: v1公開。初回カウンセリング・今日のメニュー自動生成・実行画面・記録による自動調整・振り返りが一通り動く状態。
- **Day 2以降**: 毎日1つずつ改善する。改善案は X (`#ポケットジム` 等での投稿) と GitHub Issue / Discussions から拾う。
- **10/15**: Claude Build Night でその時点の完成版をお披露目。

進捗は日々の Pull Request の履歴で追えます。

## 参加のしかた

初めてのOSS運営なので、やり方自体を試行錯誤しながらやっています。歓迎する参加のしかた:

- **種目を追加する** — `app/js/exercises.js` に種目を1件追加。手順は [app/CONTRIBUTING.md](./app/CONTRIBUTING.md)。
- **バグ報告** — [Issue](https://github.com/Ryoseiimai/pocket-gym/issues/new/choose) の「バグ報告」テンプレートから。
- **アイデア・改善提案** — [Issue](https://github.com/Ryoseiimai/pocket-gym/issues/new/choose) の「アイデア」テンプレート、または [Discussions](https://github.com/Ryoseiimai/pocket-gym/discussions) へ。
- **OSS初心者への教訓** — 「こうしておくとよかった」「これはやめたほうがいい」等、運営そのものへのフィードバックも [Discussions](https://github.com/Ryoseiimai/pocket-gym/discussions) で募集中です。

Pull Requestを送る場合のやり方は [CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

## 一緒に作る人へ

### 5分で動かす

```bash
git clone https://github.com/Ryoseiimai/pocket-gym.git
cd pocket-gym
python3 -m http.server 8080
# http://localhost:8080/app/ をブラウザで開く（紹介ページは http://localhost:8080/）
node --test app/tests/*.test.js
```

依存ライブラリ・ビルドは不要です（ビルド不要の素の HTML/CSS/ES Modules）。

### 構成

```
index.html, lp.css      … 紹介ページ（ルート）
app/
  index.html             … アプリ本体のエントリ
  js/
    app.js                … 画面遷移・イベント配線
    dom.js                 … DOM構築（el()/svgEl()のみ。innerHTML禁止）
    store.js                … localStorage(キー pocketgym.v1)の読み書き・スキーマ検証
    exercises.js             … 種目データ
    menu.js                   … 今日のメニュー生成ロジック
    progress.js                … セット完了時の自動調整(楽/ちょうど/きつい)
    stats.js                     … 記録・振り返り集計
    native.js                     … Capacitor(iOS)プラグイン連携。Webでは何もしない
  tests/                  … node --test 用のユニットテスト
  SPEC.md, SECURITY.md, CONTRIBUTING.md … 詳しい仕様・セキュリティ要件・種目追加手順
autopilot/               … 毎日1件、Issue/Discussions/Xの声から自動改善PRを作って自動マージする仕組み
  README.md               … 仕組みの構成図・止め方・鍵一覧
.github/workflows/       … CI(ci.yml)とautopilotの3段(collect/improve/announce)
```

### テスト・静的検査

```bash
node --test app/tests/*.test.js                      # ユニットテスト
for f in app/js/*.js; do node --check "$f"; done      # 構文チェック
bash .github/scripts/static-checks.sh .               # innerHTML禁止・CSP等の禁止パターン検出
```

PRを送るとCI（`.github/workflows/ci.yml`）が同じ検査を自動で回します。

### iOSビルド

[iOS でビルドする](#ios-でビルドする) を参照してください。

### 最初の一歩によい課題

ラベル [`good first issue`](https://github.com/Ryoseiimai/pocket-gym/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) が付いたIssueから選んでください。困ったら [Discussions](https://github.com/Ryoseiimai/pocket-gym/discussions) か Issue へのコメントで聞いてもらえれば答えます。

### PRの流れ

[CONTRIBUTING.md](./CONTRIBUTING.md) の手順（フォーク→ブランチ→テスト→PR）でお願いします。守ってほしいこと（依存追加禁止・`innerHTML`禁止・個人情報を扱う機能を追加しない）も同ファイルに書いてあります。

### 毎朝の自動改善ループ（autopilot）との付き合い方

10/15まで、GitHub Actionsが毎朝 `autopilot/` 以下の声（X返信・Issue/Discussions）を読み、1日1件だけ小さな改善を実装して `autopilot/YYYY-MM-DD` ブランチでPRを作り、許可パス（`app/`・`index.html`・`lp.css`・`assets/`・`LESSONS.md`・`README.md`）内かつテスト・静的検査が通る場合だけ自動マージします。`.github/**` や `autopilot/scripts/**` には触らず、触る必要がある提案は `needs-human` ラベルが付いて人（本人）の確認待ちになります。仕組みの詳細は [autopilot/README.md](./autopilot/README.md) を参照してください。あなたが送るPRとautopilotのPRが競合しても、通常のPRと同じくレビューで調整します。

### 音声ファイルについて（coach-characters ブランチ）

未マージのブランチ `coach-characters` にはコーチキャラの音声合成ファイル（VOICEVOX「ずんだもん」で生成した `app/voice/**/*.m4a`）が含まれます。**リポジトリ本体は MIT License ですが、この音声ファイルは MIT の対象外**で、VOICEVOX とずんだもんそれぞれの利用規約に従う必要があります（詳細は同ブランチの `app/voice/README.md`）。再配布・改変する場合は必ず規約を確認し、クレジット表記を残してください。

## ローカルで動かす

```bash
git clone https://github.com/Ryoseiimai/pocket-gym.git
cd pocket-gym
python3 -m http.server 8080
# ブラウザで http://localhost:8080/ (紹介ページ) または http://localhost:8080/app/ (アプリ) を開く
```

依存ライブラリ・ビルドは一切不要です。

## iOS でビルドする

Web 本体は引き続き依存ゼロです。iOS 外殻だけ Capacitor 8 と Swift Package Manager を使います。
必要なものは macOS、Xcode 26 以降（iOS Simulator SDK を含む）、Node.js 22 以降と npm です。対応 OS は iOS 15 以降、iPhone・縦向き専用です。

リポジトリのルートで実行します。シミュレータ向けのビルドには Apple Developer の有料契約や配布用証明書は不要です。

```bash
npm ci
bash scripts/sync-ios.sh
xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -configuration Debug build
# Xcode で開く場合
npm run open:ios
```

`scripts/sync-ios.sh` は `app/` の `index.html`、`css/`、`js/`、`icon.svg`、`manifest.webmanifest` だけを `www-ios/` にコピーし、`npx cap sync ios` でネイティブプロジェクトへ同期します。テスト・ドキュメント・紹介ページはアプリに含めません。`app/` を編集したら再度同期してください。生成先の `www-ios/` や `ios/App/App/public/` は直接編集しません。

実機で試す場合は、Xcode の App ターゲット → Signing & Capabilities で自分の Team を選び、Bundle Identifier を自分の一意な値へ変更してください。`capacitor.config.json` の `appId` も同じ値にして再同期します。既定は `jp.co.ryoseiworld.pocketgym`、Team `X72629Z4T6` の自動署名、Version `1.0.0` / Build `1` です。

休憩終了は成功通知、セット完了は軽い触覚フィードバック、トレーニング中は画面ロックを防止します。`app/js/native.js` がネイティブに注入された `window.Capacitor.Plugins` を使うため、Web 版に npm パッケージの import は不要です。Web では振動 API がある場合だけ振動し、非対応やプラグインの失敗でも操作を続けられます。

AppIcon は `app/icon.svg` 由来の 1024 × 1024・アルファなし PNG を同梱しています。SVG を変更した場合は、`rsvg-convert`（librsvg）と ImageMagick を用意して次で再生成できます。

```bash
rsvg-convert -w 1024 -h 1024 --background-color '#1f7a4d' app/icon.svg \
  | magick png:- -alpha off -define png:color-type=2 \
    ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
```

ビルド成功だけでは WebView 内の JavaScript や実機の触覚フィードバックの動作は保証できません。配布前に別途起動して確認してください。上記コマンドはアーカイブ・アップロード・シミュレータ起動を行いません。

## テスト

```bash
node --test app/tests/*.test.js
```

## 注意

このアプリは医療・診断の助言はしません。痛みが出たらすぐに中止し、持病がある方は医師に相談してください。

## セキュリティ

[app/SECURITY.md](./app/SECURITY.md) を参照してください。全データはブラウザの localStorage のみに保存され、外部送信は一切行いません。

## ライセンス

MIT License。詳細は [app/LICENSE](./app/LICENSE) を参照してください。
