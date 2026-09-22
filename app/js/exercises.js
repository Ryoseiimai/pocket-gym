// 種目データ。新しい種目を足したい場合は CONTRIBUTING.md を参照。
// 1種目 = { id, name, bodyPart, equipment: ['none'|'dumbbell'|'gym'], difficulty: 1-3,
//           unit: 'reps'|'seconds', points: [string,string,string], easierId, harderId }
// Optional: phase (専用の準備・整理運動), impact: "high", experiencedOnly: true, movement: "pull"
// bodyPart: 'full' | 'upper' | 'lower' | 'core'
// equipment: その種目を行うのに必要な最小限の器具(1つ)。'none' は自宅・器具なしでできる。

export const EXERCISES = [
  // ---- 固定の準備・整理運動（メイン候補・負荷調整とは別ID） ----
  { id: "warmup-march", name: "準備運動：ゆっくり足踏み", bodyPart: "full", equipment: "none", difficulty: 1, unit: "seconds", phase: "warmup",
    points: ["その場で小さく足踏みする", "跳ばずに片足ずつ静かに下ろす", "腕を軽く振り、楽な速さで動く"],
    easierId: null, harderId: null },
  { id: "warmup-shoulder-circle", name: "準備運動：肩回し", bodyPart: "upper", equipment: "none", difficulty: 1, unit: "seconds", phase: "warmup",
    points: ["腕を楽に下ろして立つ", "肩を小さくゆっくり回す", "前回しと後ろ回しを半分ずつ行う"],
    easierId: null, harderId: null },
  { id: "cooldown-shoulder-stretch", name: "整理運動：肩のストレッチ", bodyPart: "upper", equipment: "none", difficulty: 1, unit: "seconds", phase: "cooldown",
    points: ["片腕を胸の前に伸ばし反対の手で軽く支える", "反動をつけず楽に伸びる位置で保つ", "左右15秒ずつ、呼吸を止めずに行う"],
    easierId: null, harderId: null },
  { id: "cooldown-calf-stretch", name: "整理運動：ふくらはぎのストレッチ", bodyPart: "lower", equipment: "none", difficulty: 1, unit: "seconds", phase: "cooldown",
    points: ["壁に手を添え、足を前後に開く", "後ろのかかとを床につけ、反動をつけず保つ", "左右15秒ずつ、無理のない幅で行う"],
    easierId: null, harderId: null },

  // ---- 上半身・自宅器具なし ----
  { id: "pushup", name: "膝つき腕立て伏せ", bodyPart: "upper", equipment: "none", difficulty: 1, unit: "reps",
    points: ["手は肩の真下より少し外側につく", "膝から頭まで一直線を保つ", "胸が床に近づくまで下げる"],
    easierId: "wall-pushup", harderId: "pushup-standard" },
  { id: "wall-pushup", name: "壁腕立て伏せ", bodyPart: "upper", equipment: "none", difficulty: 1, unit: "reps",
    points: ["壁から一歩下がって立つ", "肘を曲げて胸を壁に近づける", "体は一直線のまま行う"],
    easierId: null, harderId: "pushup" },
  { id: "pushup-standard", name: "腕立て伏せ", bodyPart: "upper", equipment: "none", difficulty: 2, unit: "reps",
    points: ["手は肩幅よりやや広め", "つま先から頭まで一直線", "胸が拳1つ分まで下がる深さで"],
    easierId: "pushup", harderId: "diamond-pushup" },
  { id: "diamond-pushup", name: "ダイヤモンド腕立て伏せ", bodyPart: "upper", equipment: "none", difficulty: 3, unit: "reps",
    points: ["両手の親指と人差し指で三角形を作る", "肘を体に沿わせて曲げる", "反動を使わずゆっくり下ろす"],
    easierId: "pushup-standard", harderId: null },
  { id: "pike-pushup", name: "パイクプッシュアップ", bodyPart: "upper", equipment: "none", difficulty: 2, unit: "reps",
    points: ["お尻を高く上げて逆V字を作る", "頭のてっぺんを床に近づける", "肩まわりで押し上げる"],
    easierId: "wall-pushup", harderId: null },
  { id: "arm-circle", name: "アームサークル", bodyPart: "upper", equipment: "none", difficulty: 1, unit: "seconds",
    points: ["腕を肩の高さで真横に伸ばす", "小さい円から大きい円へ", "肩甲骨を意識して動かす"],
    easierId: null, harderId: null },
  { id: "tricep-dip", name: "椅子ディップス", bodyPart: "upper", equipment: "none", difficulty: 2, unit: "reps",
    points: ["椅子のふちに手をつき体を支える", "肘を後ろに曲げて腰を落とす", "肘が90度になったら押し上げる"],
    easierId: "arm-circle", harderId: null },
  { id: "superman", name: "スーパーマン", bodyPart: "upper", equipment: "none", difficulty: 1, unit: "seconds",
    points: ["うつ伏せで手足を伸ばす", "手足を同時に床から浮かせる", "腰を反りすぎない"],
    easierId: null, harderId: null },

  // ---- 下半身・自宅器具なし ----
  { id: "squat", name: "スクワット", bodyPart: "lower", equipment: "none", difficulty: 1, unit: "reps",
    points: ["足は肩幅より少し広め", "お尻を後ろに引くように下ろす", "膝がつま先より前に出過ぎない"],
    easierId: "chair-squat", harderId: "jump-squat" },
  { id: "chair-squat", name: "椅子スクワット", bodyPart: "lower", equipment: "none", difficulty: 1, unit: "reps",
    points: ["椅子の前に立ち腰を落とす", "お尻が軽く座面に触れたら立ち上がる", "背筋はまっすぐ保つ"],
    easierId: null, harderId: "squat" },
  { id: "jump-squat", impact: "high", name: "ジャンプスクワット", bodyPart: "lower", equipment: "none", difficulty: 2, unit: "reps",
    points: ["スクワットの姿勢から真上に跳ぶ", "着地は膝を軽く曲げて衝撃を吸収", "着地音を小さくするよう意識"],
    easierId: "squat", harderId: "pistol-squat" },
  { id: "pistol-squat", experiencedOnly: true, name: "片脚スクワット(補助あり)", bodyPart: "lower", equipment: "none", difficulty: 3, unit: "reps",
    points: ["壁や椅子に軽く手を添えて補助にする", "片脚を前に伸ばしたまま腰を落とす", "反対の脚は床につけない"],
    easierId: "jump-squat", harderId: null },
  { id: "lunge", name: "ランジ", bodyPart: "lower", equipment: "none", difficulty: 2, unit: "reps",
    points: ["前脚の膝は90度を目安に曲げる", "後ろ脚の膝は床すれすれまで下ろす", "上体は起こしたまま行う"],
    easierId: "chair-squat", harderId: "jump-lunge" },
  { id: "jump-lunge", impact: "high", name: "ジャンピングランジ", bodyPart: "lower", equipment: "none", difficulty: 3, unit: "reps",
    points: ["ランジの姿勢からジャンプして脚を入れ替える", "着地は柔らかく膝で吸収する", "上体をぶらさない"],
    easierId: "lunge", harderId: null },
  { id: "calf-raise", name: "カーフレイズ", bodyPart: "lower", equipment: "none", difficulty: 1, unit: "reps",
    points: ["かかとをゆっくり高く上げる", "つま先立ちで1秒キープ", "ゆっくりかかとを下ろす"],
    easierId: null, harderId: "single-calf-raise" },
  { id: "single-calf-raise", name: "片脚カーフレイズ", bodyPart: "lower", equipment: "none", difficulty: 2, unit: "reps",
    points: ["片脚立ちでバランスを取る", "壁に軽く手を添えてよい", "かかとを高く上げて1秒キープ"],
    easierId: "calf-raise", harderId: null },
  { id: "glute-bridge", name: "ヒップリフト", bodyPart: "lower", equipment: "none", difficulty: 1, unit: "reps",
    points: ["仰向けで膝を立てる", "お尻を締めながら持ち上げる", "体は肩から膝まで一直線に"],
    easierId: null, harderId: "single-leg-bridge" },
  { id: "single-leg-bridge", name: "片脚ヒップリフト", bodyPart: "lower", equipment: "none", difficulty: 2, unit: "reps",
    points: ["片脚を天井に伸ばしたまま構える", "お尻を締めて持ち上げる", "腰を反りすぎない"],
    easierId: "glute-bridge", harderId: null },
  { id: "wall-sit", name: "ウォールシット", bodyPart: "lower", equipment: "none", difficulty: 2, unit: "seconds",
    points: ["壁に背をつけ膝を90度に曲げる", "太ももが床と平行になる高さで止める", "呼吸を止めずキープする"],
    easierId: "chair-squat", harderId: null },

  // ---- 体幹・自宅器具なし ----
  { id: "plank", name: "プランク", bodyPart: "core", equipment: "none", difficulty: 1, unit: "seconds",
    points: ["肘は肩の真下につく", "頭からかかとまで一直線", "お尻が上下しないよう保つ"],
    easierId: "knee-plank", harderId: "side-plank" },
  { id: "knee-plank", name: "膝つきプランク", bodyPart: "core", equipment: "none", difficulty: 1, unit: "seconds",
    points: ["肘とひざを床につけて支える", "お腹に軽く力を入れる", "腰が反らないようにする"],
    easierId: null, harderId: "plank" },
  { id: "side-plank", name: "サイドプランク", bodyPart: "core", equipment: "none", difficulty: 2, unit: "seconds",
    points: ["肘を肩の真下について横向きに支える", "頭から足まで一直線を保つ", "腰が落ちないよう意識する"],
    easierId: "plank", harderId: null },
  { id: "crunch", name: "クランチ", bodyPart: "core", equipment: "none", difficulty: 1, unit: "reps",
    points: ["仰向けで膝を立てる", "みぞおちを丸めるように起こす", "反動を使わずゆっくり戻す"],
    easierId: null, harderId: "bicycle-crunch" },
  { id: "bicycle-crunch", name: "バイシクルクランチ", bodyPart: "core", equipment: "none", difficulty: 2, unit: "reps",
    points: ["肘と反対の膝を近づけるように捻る", "左右交互にペダルを漕ぐように", "首に力を入れすぎない"],
    easierId: "crunch", harderId: null },
  { id: "leg-raise", name: "レッグレイズ", bodyPart: "core", equipment: "none", difficulty: 2, unit: "reps",
    points: ["仰向けで脚をまっすぐ揃える", "脚を天井方向へゆっくり上げる", "腰が反らない範囲で下ろす"],
    easierId: "crunch", harderId: null },
  { id: "mountain-climber", name: "マウンテンクライマー", bodyPart: "core", equipment: "none", difficulty: 2, unit: "seconds",
    points: ["腕立ての姿勢から膝を交互に引き寄せる", "お尻が上がりすぎないようにする", "テンポよくリズムを保つ"],
    easierId: "knee-plank", harderId: null },
  { id: "dead-bug", name: "デッドバグ", bodyPart: "core", equipment: "none", difficulty: 1, unit: "reps",
    points: ["仰向けで手足を天井に上げる", "反対の手足をゆっくり伸ばす", "腰を床に押し付けたまま行う"],
    easierId: null, harderId: "leg-raise" },
  { id: "bird-dog", name: "バードドッグ", bodyPart: "core", equipment: "none", difficulty: 1, unit: "reps",
    points: ["四つん這いで姿勢を安定させる", "対角の手足を同時に伸ばす", "体幹がぶれないよう保つ"],
    easierId: null, harderId: null },

  // ---- 全身・自宅器具なし ----
  { id: "burpee", impact: "high", name: "バーピー", bodyPart: "full", equipment: "none", difficulty: 3, unit: "reps",
    points: ["しゃがんで手を床につく", "脚を後ろに伸ばして腕立ての姿勢に", "立ち上がりジャンプで締める"],
    easierId: "squat-thrust", harderId: null },
  { id: "squat-thrust", name: "スクワットスラスト", bodyPart: "full", equipment: "none", difficulty: 2, unit: "reps",
    points: ["しゃがんで手を床につく", "脚を後ろに伸ばしてまた戻す", "ジャンプは省いてよい"],
    easierId: null, harderId: "burpee" },
  { id: "jumping-jack", impact: "high", name: "ジャンピングジャック", bodyPart: "full", equipment: "none", difficulty: 1, unit: "seconds",
    points: ["脚を開くと同時に腕を頭上へ", "リズムよく繰り返す", "着地は膝を軽く曲げて吸収"],
    easierId: null, harderId: "burpee" },
  { id: "high-knees", name: "その場もも上げ", bodyPart: "full", equipment: "none", difficulty: 1, unit: "seconds",
    points: ["腿を腰の高さまで引き上げる", "腕も大きく振る", "テンポを一定に保つ"],
    easierId: null, harderId: "jumping-jack" },
  { id: "bear-crawl", name: "ベアクロール", bodyPart: "full", equipment: "none", difficulty: 2, unit: "seconds",
    points: ["四つん這いで膝を床から少し浮かせる", "対角の手足を同時に動かす", "腰の高さを一定に保つ"],
    easierId: "bird-dog", harderId: null },

  // ---- ダンベルあり ----
  { id: "db-goblet-squat", name: "ダンベルゴブレットスクワット", bodyPart: "lower", equipment: "dumbbell", difficulty: 2, unit: "reps",
    points: ["ダンベルを胸の前で両手で持つ", "スクワットと同じ要領でしゃがむ", "背筋をまっすぐ保つ"],
    easierId: "squat", harderId: null },
  { id: "db-row", movement: "pull", name: "ダンベルロウ", bodyPart: "upper", equipment: "dumbbell", difficulty: 2, unit: "reps",
    points: ["片手を椅子について前傾姿勢を作る", "肘を後ろに引くようにダンベルを引き上げる", "肩甲骨を寄せる意識で行う"],
    easierId: null, harderId: null },
  { id: "db-shoulder-press", name: "ダンベルショルダープレス", bodyPart: "upper", equipment: "dumbbell", difficulty: 2, unit: "reps",
    points: ["ダンベルを肩の高さで構える", "頭上へまっすぐ押し上げる", "反動を使わずゆっくり下ろす"],
    easierId: "pike-pushup", harderId: null },
  { id: "db-lunge", name: "ダンベルランジ", bodyPart: "lower", equipment: "dumbbell", difficulty: 3, unit: "reps",
    points: ["両手にダンベルを持ち体側で構える", "ランジと同じ要領で踏み込む", "上体をぶらさない"],
    easierId: "lunge", harderId: null },
  { id: "db-deadlift", name: "ダンベルデッドリフト", bodyPart: "lower", equipment: "dumbbell", difficulty: 3, unit: "reps",
    points: ["ダンベルを太もも前で構える", "股関節を折りたたむように前傾", "背中をまっすぐ保ったまま戻す"],
    easierId: "glute-bridge", harderId: null },

  // ---- ジム ----
  { id: "gym-leg-press", name: "レッグプレス", bodyPart: "lower", equipment: "gym", difficulty: 2, unit: "reps",
    points: ["足はプレート中央よりやや高めに置く", "膝がつま先の方向と揃うように押す", "膝を伸ばしきらず少し余裕を残す"],
    easierId: "squat", harderId: null },
  { id: "gym-lat-pulldown", movement: "pull", name: "ラットプルダウン", bodyPart: "upper", equipment: "gym", difficulty: 2, unit: "reps",
    points: ["バーは肩幅よりやや広めで握る", "胸を張って肩甲骨を寄せながら引く", "肘を体側に沿わせて下ろす"],
    easierId: "db-row", harderId: null },
  { id: "gym-chest-press", name: "チェストプレスマシン", bodyPart: "upper", equipment: "gym", difficulty: 2, unit: "reps",
    points: ["背もたれに肩甲骨をしっかりつける", "グリップを胸の高さで押し出す", "戻すときは肘を伸ばしきらない"],
    easierId: "pushup-standard", harderId: null },
  { id: "gym-treadmill", name: "トレッドミル速歩き", bodyPart: "full", equipment: "gym", difficulty: 1, unit: "seconds",
    points: ["姿勢はまっすぐ前を見る", "腕は自然に振る", "呼吸のリズムを一定に保つ"],
    easierId: "high-knees", harderId: null },
];

export function exerciseById(id) {
  return EXERCISES.find((e) => e.id === id) || null;
}

/** 器具レベル: none < dumbbell/gym。place設定から利用可能な器具集合を返す */
export function availableEquipment(place) {
  if (place === "gym") return new Set(["none", "dumbbell", "gym"]);
  if (place === "home-dumbbell") return new Set(["none", "dumbbell"]);
  return new Set(["none"]);
}

const EXPERIENCE_MAX_DIFFICULTY = { beginner: 2, some: 3, experienced: 3 };

/** 経験レベルに応じて許容する最大difficultyを返す */
export function maxDifficultyFor(experience) {
  return EXPERIENCE_MAX_DIFFICULTY[experience] || 2;
}

/** 「少しある」は上限3のうち衝撃系・片脚スクワットを除く（低難易度のジャンプも除外）。 */
export function suitableForExperience(exercise, experience) {
  return exercise.difficulty <= maxDifficultyFor(experience)
    && (experience !== "some" || (exercise.impact !== "high" && !exercise.experiencedOnly));
}
