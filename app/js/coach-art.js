// コーチキャラの見た目をコードで組み立てるモジュール。画像ファイルは一切使わず、
// svgEl() だけで丸くてぷにっとした「オリジナル」の姿を描く。
//
// 他社キャラクターのシルエット・配色の組み合わせ・パーツ形状は避けている:
// - 体は完全な円ではなく縦横比のある楕円(いわゆる特定キャラの丸い体型そのものにしない)
// - 手足は体と同系色(特定キャラに見られる「体色+差し色の手足」の組み合わせを避ける)
// - 頭の飾りはコーチごとに単発のとんがり房/リボン/ヘアバンドという独自形状(双子の丸い飾りは使わない)
// - 目は円+白いハイライトのみのシンプルな造形(特定キャラ特有の目の形は使わない)
//
// DOM構築は dom.js の svgEl() のみを使う(innerHTML禁止のCSPルールに従う)。

import { svgEl } from "./dom.js";

/** 新規プロフィールの既定コーチ */
export const DEFAULT_COACH_ID = "mochimaru";

/**
 * コーチの一覧。声は VOICEVOX の「ずんだもん」のスタイル違いを割り当てる
 * (voicevoxSpeaker/voicevoxStyle は scripts/gen-voices.mjs が /speakers 検索に使う)。
 */
export const COACHES = [
  {
    id: "mochimaru",
    name: "もちまる",
    personality: "元気",
    tagline: "元気いっぱい応援するのだ",
    color: "#8fce3a",
    colorDark: "#5f9a1f",
    voicevoxSpeaker: "ずんだもん",
    voicevoxStyle: "ノーマル",
  },
  {
    id: "purun",
    name: "ぷるん",
    personality: "やさしい",
    tagline: "むりせず、いっしょにいこうね",
    color: "#f6b8c6",
    colorDark: "#df8ea1",
    voicevoxSpeaker: "ずんだもん",
    voicevoxStyle: "あまあま",
  },
  {
    id: "koron",
    name: "ころん",
    personality: "ちょっと厳しめ",
    tagline: "そこ、もう一声いけるでしょ",
    color: "#7fd0e6",
    colorDark: "#4a9fb8",
    voicevoxSpeaker: "ずんだもん",
    voicevoxStyle: "ツンツン",
  },
];

const EXPRESSION_LABELS = { normal: "ふつう", smile: "にっこり", ganbare: "がんばれ" };

/** id からコーチ情報を返す。未知のidは既定コーチにフォールバックする */
export function coachById(id) {
  return COACHES.find((c) => c.id === id) || COACHES[0];
}

// 頭の飾り。コーチごとに違うシルエットにして、色だけでなく形でも見分けられるようにする。
function accessory(coachId, cx, topY, colorDark) {
  if (coachId === "purun") {
    // やさしい担当: 頭の横につけた小さなリボン
    const bx = cx + 26;
    const by = topY + 10;
    return svgEl("g", {}, [
      svgEl("path", { d: `M${bx},${by} L${bx - 14},${by - 8} L${bx - 14},${by + 8} Z`, fill: colorDark }),
      svgEl("path", { d: `M${bx},${by} L${bx + 14},${by - 8} L${bx + 14},${by + 8} Z`, fill: colorDark }),
      svgEl("circle", { cx: bx, cy: by, r: 4.5, fill: colorDark }),
    ]);
  }
  if (coachId === "koron") {
    // ちょっと厳しめ担当: 額を横切るスポーツ用ヘアバンド
    return svgEl("path", {
      d: `M${cx - 30},${topY + 16} Q${cx},${topY - 10} ${cx + 30},${topY + 16}`,
      fill: "none",
      stroke: colorDark,
      "stroke-width": 9,
      "stroke-linecap": "round",
    });
  }
  // 元気担当(既定): 頭の上にひとふさだけ立った房
  return svgEl("path", {
    d: `M${cx - 8},${topY + 8} Q${cx},${topY - 20} ${cx + 8},${topY + 8} Q${cx},${topY} ${cx - 8},${topY + 8} Z`,
    fill: colorDark,
  });
}

// 表情パーツ(目・眉・口)。2〜3種類を描き分ける。
function faceParts(expression, cx, cy) {
  const eyeDx = 16;
  const eyeY = cy - 6;
  const parts = [];

  if (expression === "smile") {
    // にっこり: 目は弧を描いて閉じ、口は開いた笑顔
    for (const sign of [-1, 1]) {
      const ex = cx + sign * eyeDx;
      parts.push(
        svgEl("path", {
          d: `M${ex - 7},${eyeY + 2} Q${ex},${eyeY - 8} ${ex + 7},${eyeY + 2}`,
          fill: "none",
          stroke: "#2a2a2a",
          "stroke-width": 3,
          "stroke-linecap": "round",
        })
      );
    }
    parts.push(
      svgEl("path", {
        d: `M${cx - 12},${cy + 12} Q${cx},${cy + 26} ${cx + 12},${cy + 12} Q${cx},${cy + 19} ${cx - 12},${cy + 12} Z`,
        fill: "#a83b4a",
      })
    );
  } else if (expression === "ganbare") {
    // がんばれ: 眉を寄せ、口は一文字。がんばりの汗をひとつ添える
    for (const sign of [-1, 1]) {
      const ex = cx + sign * eyeDx;
      parts.push(svgEl("ellipse", { cx: ex, cy: eyeY, rx: 7, ry: 8, fill: "#2a2a2a" }));
      parts.push(svgEl("circle", { cx: ex - sign * 2, cy: eyeY - 3, r: 1.6, fill: "#ffffff" }));
      parts.push(
        svgEl("line", {
          x1: ex - 8 * sign,
          y1: eyeY - 12,
          x2: ex + 4 * sign,
          y2: eyeY - 15,
          stroke: "#2a2a2a",
          "stroke-width": 3,
          "stroke-linecap": "round",
        })
      );
    }
    parts.push(
      svgEl("line", {
        x1: cx - 9,
        y1: cy + 18,
        x2: cx + 9,
        y2: cy + 18,
        stroke: "#2a2a2a",
        "stroke-width": 3,
        "stroke-linecap": "round",
      })
    );
    parts.push(
      svgEl("path", {
        d: `M${cx + 30},${cy - 24} Q${cx + 35},${cy - 12} ${cx + 30},${cy - 4} Q${cx + 25},${cy - 12} ${cx + 30},${cy - 24} Z`,
        fill: "#bfe6f2",
        opacity: 0.85,
      })
    );
  } else {
    // ふつう: 丸い目とやわらかい口
    for (const sign of [-1, 1]) {
      const ex = cx + sign * eyeDx;
      parts.push(svgEl("circle", { cx: ex, cy: eyeY, r: 8, fill: "#2a2a2a" }));
      parts.push(svgEl("circle", { cx: ex - sign * 2.5, cy: eyeY - 3, r: 2, fill: "#ffffff" }));
    }
    parts.push(
      svgEl("path", {
        d: `M${cx - 8},${cy + 14} Q${cx},${cy + 19} ${cx + 8},${cy + 14}`,
        fill: "none",
        stroke: "#2a2a2a",
        "stroke-width": 3,
        "stroke-linecap": "round",
      })
    );
  }
  return parts;
}

/**
 * コーチのSVGを組み立てて返す。
 * @param {string} coachId
 * @param {"normal"|"smile"|"ganbare"} [expression]
 * @param {{size?: number, animated?: boolean, className?: string}} [opts]
 */
export function coachSvg(coachId, expression = "normal", opts = {}) {
  const coach = coachById(coachId);
  const size = opts.size || 96;
  const cx = 60;
  const cy = 74;
  const bodyRx = 44;
  const bodyRy = 40;
  const topY = cy - bodyRy;
  const classes = ["coach-avatar"];
  if (opts.animated !== false) classes.push("coach-bounce");
  if (opts.className) classes.push(opts.className);

  return svgEl(
    "svg",
    {
      viewBox: "0 0 120 132",
      width: size,
      height: Math.round((size * 132) / 120),
      class: classes.join(" "),
      role: "img",
      "aria-label": `${coach.name}(${EXPRESSION_LABELS[expression] || EXPRESSION_LABELS.normal})`,
    },
    [
      // 足(体と同系色の濃淡だけで、特定キャラの差し色の足にはしない)
      svgEl("ellipse", { cx: cx - 20, cy: cy + 34, rx: 14, ry: 9, fill: coach.colorDark }),
      svgEl("ellipse", { cx: cx + 20, cy: cy + 34, rx: 14, ry: 9, fill: coach.colorDark }),
      // 手
      svgEl("ellipse", {
        cx: cx - 45,
        cy: cy + 2,
        rx: 10,
        ry: 15,
        fill: coach.color,
        transform: `rotate(-18 ${cx - 45} ${cy + 2})`,
      }),
      svgEl("ellipse", {
        cx: cx + 45,
        cy: cy + 2,
        rx: 10,
        ry: 15,
        fill: coach.color,
        transform: `rotate(18 ${cx + 45} ${cy + 2})`,
      }),
      // 本体(円ではなく縦横比のある楕円)
      svgEl("ellipse", { cx, cy, rx: bodyRx, ry: bodyRy, fill: coach.color }),
      accessory(coach.id, cx, topY, coach.colorDark),
      // ほっぺ
      svgEl("ellipse", { cx: cx - 24, cy: cy + 10, rx: 7, ry: 4.5, fill: coach.colorDark, opacity: 0.45 }),
      svgEl("ellipse", { cx: cx + 24, cy: cy + 10, rx: 7, ry: 4.5, fill: coach.colorDark, opacity: 0.45 }),
      ...faceParts(expression, cx, cy),
      // つやのハイライト
      svgEl("ellipse", {
        cx: cx - 16,
        cy: cy - 18,
        rx: 12,
        ry: 7,
        fill: "#ffffff",
        opacity: 0.55,
        transform: `rotate(-20 ${cx - 16} ${cy - 18})`,
      }),
    ]
  );
}
