// コーチのセリフ集。「場面 × コーチ × 2通り」を持ち、日付や回数から導いた決定的な
// シードで選ぶ(乱数は使わない。menu.js と同じ FNV-1aベースの hashString を再利用する)。
// 医療・効果を断定する言い方はしない(継続・がんばりへの声かけだけにする)。
//
// lineId は voice/<coachId>/<lineId>.m4a のファイル名にもそのまま使う。

import { hashString } from "./menu.js";

const LINES = {
  greeting: {
    mochimaru: [
      { id: "greeting-mochimaru-1", text: "今日のメニューができたのだ!いっしょにがんばろう" },
      { id: "greeting-mochimaru-2", text: "おかえりなのだ!今日はどこまでいけるかな" },
    ],
    purun: [
      { id: "greeting-purun-1", text: "おかえりなさい。今日のメニュー、準備できましたよ" },
      { id: "greeting-purun-2", text: "無理のない範囲で、今日もいっしょにやっていきましょう" },
    ],
    koron: [
      { id: "greeting-koron-1", text: "お、来たわね。今日の分、ちゃんと用意してあるから" },
      { id: "greeting-koron-2", text: "さぼらず続けてるじゃない。今日も行くわよ" },
    ],
  },
  workoutStart: {
    mochimaru: [
      { id: "workoutStart-mochimaru-1", text: "スタートなのだ!まずは体をほぐしていくのだ" },
      { id: "workoutStart-mochimaru-2", text: "よーし、いくのだ!最初の種目からいくよ" },
    ],
    purun: [
      { id: "workoutStart-purun-1", text: "それでは始めましょう。呼吸を止めずにゆっくりでいいですよ" },
      { id: "workoutStart-purun-2", text: "ここから始めますね。自分のペースで大丈夫です" },
    ],
    koron: [
      { id: "workoutStart-koron-1", text: "じゃあ始めるわよ。フォームだけは崩さないでね" },
      { id: "workoutStart-koron-2", text: "スタート。最初から手を抜かないでいくわよ" },
    ],
  },
  setCompleteEasy: {
    mochimaru: [
      { id: "setCompleteEasy-mochimaru-1", text: "楽勝だったのだ!次もその調子なのだ" },
      { id: "setCompleteEasy-mochimaru-2", text: "余裕そうなのだ!いいペースだよ" },
    ],
    purun: [
      { id: "setCompleteEasy-purun-1", text: "楽にできたんですね、よかったです" },
      { id: "setCompleteEasy-purun-2", text: "無理なくできましたね、その調子でいきましょう" },
    ],
    koron: [
      { id: "setCompleteEasy-koron-1", text: "楽だったなら、次はもう少し攻めてもいいかもね" },
      { id: "setCompleteEasy-koron-2", text: "余裕そうね。ちゃんと効かせられてる?" },
    ],
  },
  setCompleteOk: {
    mochimaru: [
      { id: "setCompleteOk-mochimaru-1", text: "ちょうどいい感じなのだ!いいぞいいぞ" },
      { id: "setCompleteOk-mochimaru-2", text: "そのペースで合ってるのだ、続けよう" },
    ],
    purun: [
      { id: "setCompleteOk-purun-1", text: "ちょうどいい強さでできましたね" },
      { id: "setCompleteOk-purun-2", text: "いい感じです。無理せずこのまま行きましょう" },
    ],
    koron: [
      { id: "setCompleteOk-koron-1", text: "ちょうどいいなら、それが今のあなたの実力ね" },
      { id: "setCompleteOk-koron-2", text: "悪くないわ。そのまま集中していきましょう" },
    ],
  },
  setCompleteHard: {
    mochimaru: [
      { id: "setCompleteHard-mochimaru-1", text: "きつかったのだ!よくがんばったのだ" },
      { id: "setCompleteHard-mochimaru-2", text: "しんどかったね、でもちゃんとやりきったのだ" },
    ],
    purun: [
      { id: "setCompleteHard-purun-1", text: "きつかったですよね、よくがんばりました" },
      { id: "setCompleteHard-purun-2", text: "無理しなくて大丈夫ですよ、少し呼吸を整えましょう" },
    ],
    koron: [
      { id: "setCompleteHard-koron-1", text: "きつかったのね、それだけやれてる証拠よ" },
      { id: "setCompleteHard-koron-2", text: "そこまで追い込めたなら十分。次は加減してね" },
    ],
  },
  restStart: {
    mochimaru: [
      { id: "restStart-mochimaru-1", text: "休憩なのだ!水分もとって一息つくのだ" },
      { id: "restStart-mochimaru-2", text: "ここで一休みなのだ、しっかり休もう" },
    ],
    purun: [
      { id: "restStart-purun-1", text: "少し休みましょう。呼吸を整えてくださいね" },
      { id: "restStart-purun-2", text: "ここで休憩です。ゆっくりしていいですよ" },
    ],
    koron: [
      { id: "restStart-koron-1", text: "休憩よ。ただし、だらけすぎないでね" },
      { id: "restStart-koron-2", text: "ここで一旦休憩。次に向けて息を整えて" },
    ],
  },
  restAlmostDone: {
    mochimaru: [
      { id: "restAlmostDone-mochimaru-1", text: "もうすぐ再開なのだ!心の準備をするのだ" },
      { id: "restAlmostDone-mochimaru-2", text: "あと少しで休憩終わりなのだ、いくよ!" },
    ],
    purun: [
      { id: "restAlmostDone-purun-1", text: "もうすぐ再開ですよ。ゆっくり準備してくださいね" },
      { id: "restAlmostDone-purun-2", text: "あと少しで休憩終わりです。無理のない姿勢で待っていて" },
    ],
    koron: [
      { id: "restAlmostDone-koron-1", text: "もうすぐ終わるわよ。気持ち切り替えて" },
      { id: "restAlmostDone-koron-2", text: "残りわずか。集中し直しなさい" },
    ],
  },
  restEnd: {
    mochimaru: [
      { id: "restEnd-mochimaru-1", text: "休憩終わりなのだ!次のセット、いくのだ" },
      { id: "restEnd-mochimaru-2", text: "再開なのだ!体は温まったかな" },
    ],
    purun: [
      { id: "restEnd-purun-1", text: "休憩終わりです。無理のない範囲で再開しましょう" },
      { id: "restEnd-purun-2", text: "それでは再開しますね。ゆっくりで大丈夫です" },
    ],
    koron: [
      { id: "restEnd-koron-1", text: "再開よ。ここからまた集中していきましょう" },
      { id: "restEnd-koron-2", text: "休憩終わり。気を抜かずにいくわよ" },
    ],
  },
  allDone: {
    mochimaru: [
      { id: "allDone-mochimaru-1", text: "全部終わったのだ!今日もお疲れさまなのだ!" },
      { id: "allDone-mochimaru-2", text: "やりきったのだ!すごいぞ、今日のがんばりなのだ" },
    ],
    purun: [
      { id: "allDone-purun-1", text: "今日の分、全部終わりましたね。お疲れさまでした" },
      { id: "allDone-purun-2", text: "最後までできましたね。ゆっくり休んでくださいね" },
    ],
    koron: [
      { id: "allDone-koron-1", text: "終わったわね。今日もちゃんとやりきったじゃない" },
      { id: "allDone-koron-2", text: "お疲れさま。続けてるのは普通にすごいことよ" },
    ],
  },
  reflect: {
    mochimaru: [
      { id: "reflect-mochimaru-1", text: "ここまでの記録、見てみるのだ!積み重ねてきたのだ" },
      { id: "reflect-mochimaru-2", text: "続けてきた分だけ記録が伸びてるのだ、いいぞ" },
    ],
    purun: [
      { id: "reflect-purun-1", text: "ここまでの記録です。少しずつでも積み重ねていますね" },
      { id: "reflect-purun-2", text: "無理なく続けられているみたいで、なによりです" },
    ],
    koron: [
      { id: "reflect-koron-1", text: "記録、見てみなさい。ちゃんと積み上がってるでしょ" },
      { id: "reflect-koron-2", text: "サボらず続けてる証拠がここに出てるわよ" },
    ],
  },
};

/** 音声生成スクリプト用に、全セリフをフラットな配列で返す */
export function allLines() {
  const out = [];
  for (const scene of Object.keys(LINES)) {
    for (const coachId of Object.keys(LINES[scene])) {
      for (const line of LINES[scene][coachId]) {
        out.push({ scene, coachId, id: line.id, text: line.text });
      }
    }
  }
  return out;
}

/**
 * scene × coachId のセリフを、日付や回数などのseedから決定的に1つ選ぶ(乱数は使わない)。
 * @returns {{id: string, text: string} | null}
 */
export function pickLine(scene, coachId, seed) {
  const variants = LINES[scene]?.[coachId];
  if (!variants || variants.length === 0) return null;
  const idx = hashString(`${scene}|${coachId}|${seed}`) % variants.length;
  return variants[idx];
}
