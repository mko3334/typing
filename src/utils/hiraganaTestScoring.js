export const HIRAGANA_TEST_BASE_POINTS = 60;
export const HIRAGANA_TEST_MISS_PENALTY = 30;
export const HIRAGANA_TEST_STREAK_BLOCK = 5;
export const HIRAGANA_TEST_MULTIPLIER_STEP = 0.2;

/** 全行・全46問パーフェクト時の目安（基本60pt × 倍率積み上げ） */
export const HIRAGANA_TEST_SESSION_PERFECT_REFERENCE = 5136;

export function formatTestMultiplier(multiplier) {
  return Number(multiplier.toFixed(1)).toString();
}

/** 連続正解数 → 倍率（5連続で×1.2、以降5連続ごとに+0.2） */
export function getTestComboMultiplier(combo) {
  if (combo < HIRAGANA_TEST_STREAK_BLOCK) return 1;
  const tier = Math.floor(combo / HIRAGANA_TEST_STREAK_BLOCK);
  return 1 + HIRAGANA_TEST_MULTIPLIER_STEP * tier;
}

export function getStreakProgress(combo) {
  if (combo <= 0) return { filled: 0, nextAt: HIRAGANA_TEST_STREAK_BLOCK, untilNext: HIRAGANA_TEST_STREAK_BLOCK };
  const mod = combo % HIRAGANA_TEST_STREAK_BLOCK;
  const filled = mod === 0 ? HIRAGANA_TEST_STREAK_BLOCK : mod;
  const nextAt = mod === 0 ? combo + HIRAGANA_TEST_STREAK_BLOCK : combo + (HIRAGANA_TEST_STREAK_BLOCK - mod);
  return {
    filled,
    nextAt,
    untilNext: nextAt - combo,
  };
}

export function scoreTestCorrectHit(combo) {
  const multiplier = getTestComboMultiplier(combo);
  return {
    combo,
    multiplier,
    points: Math.round(HIRAGANA_TEST_BASE_POINTS * multiplier),
  };
}

export function finalizeTestRowPoints(rowPoints, rowMisses) {
  return Math.max(0, rowPoints - rowMisses * HIRAGANA_TEST_MISS_PENALTY);
}

export function getComboTier(combo) {
  if (combo < HIRAGANA_TEST_STREAK_BLOCK || combo % HIRAGANA_TEST_STREAK_BLOCK !== 0) return null;
  const multiplier = getTestComboMultiplier(combo);
  const tier = Math.floor(combo / HIRAGANA_TEST_STREAK_BLOCK);
  const emojis = ['✨', '🔥', '⚡', '💫', '🌟', '🚀', '👑'];
  return {
    fromCombo: combo,
    multiplier,
    label: `×${formatTestMultiplier(multiplier)}`,
    emoji: emojis[Math.min(tier - 1, emojis.length - 1)],
  };
}
