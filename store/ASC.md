# App Store Connect 登録控え

- 登録名: ポケットジム
- Apple ID: 6814961139
- Bundle ID: jp.co.ryoseiworld.pocketgym
- SKU: pocketgym-ios-001
- 登録確認日時: 2026-09-23 05:05:09 JST
- プラットフォーム: iOS
- プライマリ言語: 日本語
- ユーザアクセス: フルアクセス（アクセス制限なし）
- App ID: Explicit（説明: PocketGym、Capabilities は既定のまま）
- アプリ情報: https://appstoreconnect.apple.com/apps/6814961139/distribution/info
- スクリーンショット: [asc-app-information.png](控え/asc-app-information.png)
- 依頼台帳: R1855

上記の初回登録時点では、審査への提出、価格・配信地域・トレーダーステータス・契約の変更は行っていない。


## 入力済み項目の一覧（R1857）

- 確認日時: 2026-09-23T05:12:36+09:00
- 対象: Apple ID `6814961139` / `jp.co.ryoseiworld.pocketgym` / iOS `1.0` / 日本語 `ja`
- 文面の正本: [ASC_コピペシート.md](ASC_コピペシート.md)。指定のiPhone版の振動・画面消灯防止の1文も正本とASC双方に反映。

| 項目 | 入力値・確認結果 |
| --- | --- |
| プライマリカテゴリ | `HEALTH_AND_FITNESS`（ヘルスケア／フィットネス） |
| サブタイトル | 今日の筋トレメニューと記録、休憩タイマー |
| プライバシーURL | https://ryoseiimai.github.io/pocket-gym/privacy.html |
| 年齢制限 | シートの回答どおり。`healthOrWellnessTopics=true`、ほかのコンテンツ頻度は `NONE`、該当機能は `false`。子ども向け指定なし、年齢上書きなし。Web自動算定は原則9+（旧OSは4+、地域例外あり） |
| 説明文 | 正本全文。「■ 1セットずつ進める」末尾に指定の1文を追加 |
| キーワード・プロモーション用テキスト | 正本どおり |
| サポートURL・マーケティングURL | https://ryoseiimai.github.io/pocket-gym/ |
| 著作権 | 2026 Ryosei Imai |
| 審査連絡先 | Ryosei Imai / +81 90-3433-5181 / kaeru3160@gmail.com |
| デモアカウント・審査メモ | 不要（`demoAccountRequired=false`）。メモは正本全文 |
| コンテンツ配信権 | `DOES_NOT_USE_THIRD_PARTY_CONTENT` |
| 価格 | 無料。基準地域JPNの手動価格と174地域の自動価格を読み戻し、すべて0を確認 |
| 配信地域 | 現行175地域中148地域を有効、EU27か国を無効。新規地域の自動追加は無効 |
| スクリーンショット | 日本語6.9インチ枠、API表示タイプ `APP_IPHONE_67`。1320×2868の01〜05を順に登録。全5枚 `COMPLETE`、ファイルMD5・寸法・順序一致 |
| Appのプライバシー | Webで「データを収集しません」を回答・公開。「公開済み」「データの収集なし」を確認 |

EU除外地域: AUT, BEL, BGR, HRV, CYP, CZE, DNK, EST, FIN, FRA, DEU, GRC, HUN, IRL, ITA, LVA, LTU, LUX, MLT, NLD, POL, PRT, ROU, SVK, SVN, ESP, SWE。

### スクリーンショット再撮影と検証

`shot.py` は9月9日〜22日の14日間に10回、同じプロフィールの架空記録を本番メニュー生成・レベル調整関数で作成。メイン種目は「楽」を記録。`validateImport` の成功と補正なしを検証。05で見える5種目はすべて2点以上、右上がり（低下なし）を機械検証・目視確認済み。データ更新に伴い02・03も同じ状態から再撮影した。`sample-state.json` と `capture-info.json` に再現用データと検証結果を保存。

### 控え・未実施事項

- API読み戻し: `控え/verified-*.json`（AppプライバシーのみAPI非対応のためWeb確認）。
- Web控え: [プライバシー公開済み](控え/asc-privacy-published.png)、[バージョン1.0](控え/asc-version.png)、[6.9インチ枠の画面テキスト](控え/asc-screenshots-69.txt)。画面テキストも保存。`screencapture`・保存ダイアログは不使用。
- 指定された入力項目に未完了はない。審査提出は未実施、バージョン状態 `PREPARE_FOR_SUBMISSION`。ビルドの関連付けは `null` を読み戻して確認。
- トレーダーステータス・契約・銀行・税の変更なし。パスワード・2段階認証の入力なし。
- 別途、ASCに「規制対象の医療用デバイス」の申告を求める表示あり（EU／EEA、英国、米国向け）。今回の指定入力・回答シートにないため未申告。実際の提出前に別途対応する。
- Daily NoteはOSのアクセス制限（Operation not permitted）で参照・更新できず。依頼台帳と本ファイルに記録。`irai done` は成功したが、`irai render` のVault反映も同じOS制限で失敗（台帳のローカル保存は成功）。
- `控え/` はコミット対象外。秘密鍵・Issuer ID・JWTをファイルやログに保存していない。pushはしない。

### 確認した公式資料

- [Apple App Store Connect API OpenAPI定義](https://developer.apple.com/sample-code/app-store-connect/app-store-connect-openapi-specification.zip)（取得時の定義更新日2026-07-16、年齢制限の最新属性名とScreenshotDisplayTypeを確認）
- [年齢制限API](https://developer.apple.com/documentation/appstoreconnectapi/ageratingdeclarationupdaterequest/data-data.dictionary/attributes-data.dictionary)
- [スクリーンショット仕様](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)
- [EU加盟国一覧](https://european-union.europa.eu/principles-countries-history/eu-countries_en)
