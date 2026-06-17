export const TITLE_ACCESS_PASSWORD = '0001';
export const ADMIN_PASSWORD = '0001';

const DIFFICULTY_LABELS = {
  easy: 'イージー',
  normal: 'ノーマル',
  hard: 'ハード',
  very_hard: 'ベリーハード',
};

export function getDifficultyLabel(key) {
  return DIFFICULTY_LABELS[key] || 'イージー';
}

function hasSymbolOrNumber(text) {
  return /[！？!?。、,.\d０-９]/.test(text);
}

export function suggestDifficultyKey(kana) {
  const word = kana || '';
  const len = word.length;
  if (hasSymbolOrNumber(word)) return 'very_hard';
  if (len <= 2) return 'easy';
  if (len <= 5) return 'normal';
  return 'hard';
}

export function suggestDifficultyLabel(kana) {
  return getDifficultyLabel(suggestDifficultyKey(kana));
}
