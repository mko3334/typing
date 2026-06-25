import { getWordCorrections } from '../firebase';

let correctionsCache = [];

export function buildMainWordKey(kana) {
  return `main:${kana}`;
}

export function buildSubEventWordKey(eventId, kana) {
  return `sub:${eventId}:${kana}`;
}

export async function refreshWordCorrections() {
  correctionsCache = await getWordCorrections();
  return correctionsCache;
}

export function getCachedWordCorrections() {
  return correctionsCache;
}

function findCorrection(sourceKey) {
  return correctionsCache.find((entry) => entry.sourceKey === sourceKey) || null;
}

export function applyCorrectionToWord(word, difficulty) {
  if (!word?.kana) return word;
  const correction =
    findCorrection(buildMainWordKey(word.kana)) ||
    findCorrection(word.kana);
  if (!correction) return word;
  return {
    ...word,
    kana: correction.kana || word.kana,
    reading: correction.reading || word.reading,
    romaji: Array.isArray(correction.romaji) ? correction.romaji : word.romaji,
    emoji: correction.emoji ?? word.emoji,
  };
}

export function applyCorrectionToRally(rally, eventId) {
  if (!rally) return rally;
  const correction =
    (eventId ? findCorrection(buildSubEventWordKey(eventId, rally.kana)) : null) ||
    findCorrection(buildSubEventWordKey('global', rally.kana)) ||
    findCorrection(rally.kana);
  if (!correction) return rally;
  return {
    ...rally,
    kana: correction.kana || rally.kana,
    romaji: Array.isArray(correction.romaji) ? correction.romaji : rally.romaji,
    kanaDisplay: correction.kanaDisplay || correction.kana || rally.kanaDisplay,
    ...(correction.textDisplay ? { textDisplay: correction.textDisplay } : {}),
  };
}

export function parseRomajiInput(text) {
  return String(text || '')
    .split(/[/,、\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}
