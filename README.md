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

## ローカルで動かす

```bash
git clone https://github.com/Ryoseiimai/pocket-gym.git
cd pocket-gym
python3 -m http.server 8080
# ブラウザで http://localhost:8080/ (紹介ページ) または http://localhost:8080/app/ (アプリ) を開く
```

依存ライブラリ・ビルドは一切不要です。

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
