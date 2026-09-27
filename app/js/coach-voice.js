// コーチのセリフ音声を再生する。app/voice/<coachId>/<lineId>.m4a があれば鳴らし、
// 無ければ(ファイル未生成・再生失敗・Audio未対応環境)何もせず文字表示だけで進める。
// 例外は外に出さない(ネットワーク/端末側の都合でトレーニングを止めないため)。
//
// iOS Safari はユーザー操作なしの再生を許可しないため、最初のクリックで同じ<audio>要素を
// 1回だけ鳴らして「解錠」し、以後の再生はその要素を使い回す(要素を毎回新規生成すると
// 解錠状態が引き継がれない端末があるため)。

let sharedAudio = null;
let unlockAttempted = false;

function hasAudioSupport() {
  // typeof は未宣言のグローバルでも例外を投げないため、Node(node:test)など
  // Audio が存在しない環境でも安全に判定できる。
  return typeof Audio !== "undefined";
}

/** 最初のユーザー操作(クリック等)のハンドラから呼ぶ。2回目以降は何もしない */
export function unlockVoice() {
  if (unlockAttempted || !hasAudioSupport()) return;
  unlockAttempted = true;
  try {
    const audio = new Audio();
    audio.muted = true;
    const played = audio.play();
    if (played && typeof played.catch === "function") played.catch(() => {});
    sharedAudio = audio;
  } catch {
    // Audio が使えない、または再生が拒否された環境でも致命的にしない
  }
}

/** コーチのセリフ音声を再生する。enabled が false なら何もしない(設定「声オフ」) */
export function playLine(coachId, lineId, enabled) {
  if (!enabled || !coachId || !lineId || !hasAudioSupport()) return;
  try {
    const audio = sharedAudio || new Audio();
    audio.muted = false;
    audio.src = `./voice/${coachId}/${lineId}.m4a`;
    audio.currentTime = 0;
    const played = audio.play();
    if (played && typeof played.catch === "function") played.catch(() => {});
  } catch {
    // 音声ファイルが無い・再生に失敗しても文字表示だけで進める
  }
}
