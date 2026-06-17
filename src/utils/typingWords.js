import { WORDS, WORDS_PER_ROUND } from '../constants';

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function markSpecialWord(words) {
  if (words.length < 2) return;
  let idx1 = Math.floor(Math.random() * words.length);
  let idx2 = Math.floor(Math.random() * words.length);
  while (idx1 === idx2) idx2 = Math.floor(Math.random() * words.length);

  const a = words[idx1];
  const b = words[idx2];
  const romaji = [];
  for (const r1 of a.romaji) {
    for (const r2 of b.romaji) {
      romaji.push(`${r1}to${r2}`);
    }
  }

  words[idx1] = {
    kana: `${a.kana}と${b.kana}`,
    romaji,
    emoji: `${a.emoji}${b.emoji}`,
    isSpecial: true,
  };
}

/**
 * @param {string} difficulty
 * @param {boolean} forceSpecial
 * @param {number} playCount
 * @param {boolean} specialWordTriggered
 */
export function pickGameWords(
  difficulty,
  forceSpecial = false,
  playCount = 0,
  specialWordTriggered = false,
  count = WORDS_PER_ROUND,
) {
  const pool = WORDS[difficulty] || WORDS.normal;
  const words = shuffle([...pool]).slice(0, Math.min(count, pool.length));

  if (forceSpecial) {
    if (difficulty !== 'alphabet_quiz' && Math.random() < 0.2) {
      markSpecialWord(words);
    }
    return { words, newPlayCount: playCount, newTriggered: specialWordTriggered };
  }

  let shouldSpecial = false;
  let newTriggered = specialWordTriggered;
  const newPlayCount = playCount + 1;

  if (!specialWordTriggered && newPlayCount <= 5 && (newPlayCount === 5 || Math.random() < 0.2)) {
    shouldSpecial = true;
  }

  if (
    difficulty !== 'alphabet_quiz' &&
    (shouldSpecial || (newPlayCount > 5 && Math.random() < 0.2))
  ) {
    markSpecialWord(words);
    if (newPlayCount <= 5) {
      newTriggered = true;
    }
  }

  return { words, newPlayCount, newTriggered };
}
