# コントリビュート方法(はじめての人向け)

Pull Requestを送る一番シンプルな流れです。

1. このリポジトリを右上の「Fork」ボタンで自分のアカウントにコピーする。
2. 自分のフォークをクローンして編集する。
   ```bash
   git clone https://github.com/<あなたのユーザー名>/pocket-gym.git
   cd pocket-gym
   ```
3. 変更用のブランチを作って編集する。
   ```bash
   git checkout -b my-change
   ```
4. アプリ本体(`app/`)を変更した場合はテストを回す。
   ```bash
   node --test app/tests/*.test.js
   ```
5. 変更をコミットしてフォークにpushし、GitHub上でこのリポジトリへPull Requestを作る。
   ```bash
   git add -A
   git commit -m "変更内容を一言で"
   git push origin my-change
   ```

## 変更する場所の目安

- 種目やトレーニングロジックの追加 → `app/js/`、詳しくは [app/CONTRIBUTING.md](./app/CONTRIBUTING.md)。
- 紹介ページ(このリポジトリのルートの `index.html` / `lp.css`)の文言・見た目の修正。
- ドキュメント(README・このファイルなど)の誤字修正・分かりやすさの改善。

## 守ってほしいこと

- 依存ライブラリ・外部CDN・外部フォント・Analyticsは追加しない(ビルド不要の素のHTML/CSS/ES Modulesのまま)。
- `app/` の DOM 構築は `app/js/dom.js` の `el()` / `svgEl()` のみを使い、`innerHTML` は使わない。
- 個人情報を扱う機能は追加しない(全データはブラウザの localStorage のみ)。

迷ったら、まず [Issue](https://github.com/Ryoseiimai/pocket-gym/issues) か [Discussions](https://github.com/Ryoseiimai/pocket-gym/discussions) で聞いてください。
