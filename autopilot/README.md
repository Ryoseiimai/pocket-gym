# autopilot（毎日自動改善ループ）

10/15まで、本人のMacが落ちていてもGitHub Actionsだけで「募集ポストへの返信＆Issue/Discussionを読む→1日1件改善→テスト→PR→自動マージ→本番反映→Xで報告」を回す仕組みです。

## 構成図（テキスト）

```
[毎日 07:23 JST頃 / 手動]
  collect.yml  … X(conversation_id)返信・引用 + Issues/Discussions新着を取得
                 → autopilot/inbox/YYYY-MM-DD.json に正規化して保存
                 → improve.yml を明示的に起動 (workflow_dispatch)
                 ※ Xの鍵(X_CONSUMER_KEY/SECRET)を使うのはここだけ

  improve.yml  … claude-code-action が inbox / open issue を「信用できない入力」として読み、
                 1日1件だけ改善を実装 → node --test → PRを作成
                 (PR本文末尾に <!-- autopilot: {"title":..,"summary":..} --> を必ず入れる)
                 → 許可パス/差分行数/CI結果を機械的にチェックして自動マージ or needs-human
                 → マージできたら announce.yml を起動
                 ※ Xの鍵はここには渡さない

  announce.yml … Pagesのビルド完了を同期待機 → 本番をPlaywrightでスクショ
                 → PRのautopilot JSONからテンプレで文言を組み立て(LLM不使用)
                 → 募集ポストのスレッドに画像付きで返信 → threads.jsonを更新
```

## 止め方

- リポジトリ変数 `AUTOPILOT_ENABLED` を `true` 以外にする（`ghp variable set AUTOPILOT_ENABLED --body false --repo Ryoseiimai/pocket-gym`）。全workflowが最初のステップで即終了します。
- 10/16以降は日付チェックにより自動で止まります（JST基準）。

## 鍵（secrets）一覧

| secret | 用途 | 使う段 |
|---|---|---|
| `X_CONSUMER_KEY` / `X_CONSUMER_SECRET` | X API app-only bearer生成(検索) / OAuth1署名(投稿) | collect / announce |
| `X_ACCESS_TOKEN` / `X_ACCESS_TOKEN_SECRET` | X API OAuth1ユーザー鍵(投稿) | announce |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude Code(Max定額プラン)の認証 | improve |
| `GITHUB_TOKEN` | GitHub Actions既定（issue/PR操作） | 全段 |

variables: `AUTOPILOT_ENABLED`（true/false）

## 月額見込み

X API従量課金（2026-09時点の公式単価）:
- 検索・読み取り: $0.005/件 × 最大100件/日 ≒ $0.50/日
- 投稿（画像付き・URL無し）: $0.015/件 × 1日1投稿 ≒ $0.015/日

10/15までの残日数分（約22日）で概算 **$11〜13程度**（クレジット残高は本人のX Developer Portalで要確認・枯渇時は `needs-human` Issueが自動で立つ）。

## 意図的な簡略化・既知の限界

- X検索はrecent search（直近7日のみ）。それ以前の返信は拾えない
- 1日の改善は1件のみ。大きな改善は複数日に分割される前提
- 自動マージの安全判定は「許可パス・差分400行以下・CI成功・NEEDS-HUMAN宣言なし」の機械チェックのみ。内容の妥当性はCI（`node --test` + 禁止パターン検出）に委ねている
- Discussionsの取得はGraphQLのdiscussions機能が有効な場合のみ動作（未有効なら黙ってスキップ）
