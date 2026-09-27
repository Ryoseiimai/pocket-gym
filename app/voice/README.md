# コーチの声(音声ファイル)について

このフォルダの `<coachId>/<lineId>.m4a` は、ローカルで起動した [VOICEVOX ENGINE](https://github.com/VOICEVOX/voicevox_engine)
の「ずんだもん」(スタイル: ノーマル/あまあま/ツンツン)を使って `../scripts/gen-voices.mjs` が生成した音声です。

- もちまる(元気) = ずんだもん ノーマル
- ぷるん(やさしい) = ずんだもん あまあま
- ころん(ちょっと厳しめ) = ずんだもん ツンツン

## ライセンスについて(重要)

このリポジトリ本体は MIT License ですが、**この `voice/` フォルダの音声ファイルは MIT の対象外**です。
音声の利用は VOICEVOX および「ずんだもん」それぞれの利用規約に従ってください。

- VOICEVOX 利用規約: https://voicevox.hiroshiba.jp/term/
- ずんだもん(東北ずん子/ずんだもんプロジェクト)キャラクター利用に関する規約: https://zunko.jp/con_ongen_kiyaku.html

再配布・改変時は、上記規約の範囲内であることを確認し、クレジット表記(「VOICEVOX:ずんだもん」)を残してください。
アプリ内では設定タブの下部にクレジットを表示しています。

## 再生成する場合

```bash
cd app
# Apple Silicon の場合、arm64対応イメージが取得される
docker run -d --name voicevox-coach -p 50021:50021 voicevox/voicevox_engine:cpu-latest
node scripts/gen-voices.mjs
docker stop voicevox-coach && docker rm voicevox-coach
```

セリフ本文は `js/coach-lines.js` の `LINES` を参照します。
