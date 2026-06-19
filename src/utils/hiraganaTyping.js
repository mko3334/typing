import { ROMAJI_TABLE } from '../constants';
import { HIRAGANA_ROWS } from '../data/hiraganaRows';

export function getRomajiList(kana) {
  return ROMAJI_TABLE[kana] || [];
}

export function getDefaultHiraganaProgress() {
  return {
    clearedRowIds: [],
    charStats: {},
    allRowsRewardClaimed: false,
    shuffleClearCount: 0,
  };
}

export function normalizeHiraganaProgress(raw) {
  if (!raw || typeof raw !== 'object') return getDefaultHiraganaProgress();
  return {
    clearedRowIds: Array.isArray(raw.clearedRowIds) ? raw.clearedRowIds : [],
    charStats: raw.charStats && typeof raw.charStats === 'object' ? raw.charStats : {},
    allRowsRewardClaimed: raw.allRowsRewardClaimed === true,
    shuffleClearCount:
      Number.isFinite(Number(raw.shuffleClearCount)) && Number(raw.shuffleClearCount) >= 0
        ? Number(raw.shuffleClearCount)
        : 0,
  };
}

export function getCurrentStageRowIndex(clearedRowIds) {
  if (clearedRowIds.length >= HIRAGANA_ROWS.length) {
    return HIRAGANA_ROWS.length - 1;
  }
  return clearedRowIds.length;
}

export function isRowUnlockedForStage(rowIndex, clearedRowIds) {
  return rowIndex <= getCurrentStageRowIndex(clearedRowIds);
}

export function isRowCleared(rowId, clearedRowIds) {
  return clearedRowIds.includes(rowId);
}

export function recordCharResult(charStats, kana, success) {
  const prev = charStats[kana] || { attempts: 0, correct: 0, misses: 0 };
  return {
    ...charStats,
    [kana]: {
      attempts: prev.attempts + 1,
      correct: prev.correct + (success ? 1 : 0),
      misses: prev.misses + (success ? 0 : 1),
    },
  };
}

export function getCharAccuracy(stat) {
  if (!stat?.attempts) return null;
  return Math.round((stat.correct / stat.attempts) * 100);
}

export function getWeakChars(charStats, limit = 8) {
  return Object.entries(charStats)
    .map(([kana, stat]) => ({
      kana,
      ...stat,
      accuracy: getCharAccuracy(stat),
    }))
    .filter((entry) => entry.attempts >= 2)
    .sort((a, b) => {
      const missDiff = b.misses - a.misses;
      if (missDiff !== 0) return missDiff;
      return (a.accuracy ?? 0) - (b.accuracy ?? 0);
    })
    .slice(0, limit);
}

export function getRowSummary(row, charStats) {
  let attempts = 0;
  let correct = 0;
  let misses = 0;
  for (const kana of row.chars) {
    const stat = charStats[kana];
    if (!stat) continue;
    attempts += stat.attempts;
    correct += stat.correct;
    misses += stat.misses;
  }
  return {
    attempts,
    correct,
    misses,
    accuracy: attempts > 0 ? Math.round((correct / attempts) * 100) : null,
  };
}

function shuffleArray(array) {
  const next = [...array];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function buildPracticeQueue(rowIds, mode) {
  const rows = HIRAGANA_ROWS.filter((row) => rowIds.includes(row.id));
  const items = rows.flatMap((row) => row.chars.map((kana) => ({ kana, rowId: row.id })));
  if (mode === 'shuffle') return shuffleArray(items);
  return items;
}

export function matchesRomajiInput(kana, typed) {
  const list = getRomajiList(kana);
  return list.some((romaji) => romaji.startsWith(typed));
}

export function isRomajiComplete(kana, typed) {
  return getRomajiList(kana).includes(typed);
}
