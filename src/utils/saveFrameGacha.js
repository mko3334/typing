import { SAVE_FRAMES } from '../constants/saveFrames';
import { HIRAGANA_ROWS } from '../data/hiraganaRows';

export function isAllRowsTestSelection(selectedRowIds = []) {
  if (selectedRowIds.length !== HIRAGANA_ROWS.length) return false;
  const selected = new Set(selectedRowIds);
  return HIRAGANA_ROWS.every((row) => selected.has(row.id));
}

export function pullSaveFrame(pool, unlockedFrames = []) {
  const owned = new Set(unlockedFrames || []);
  const poolFrames =
    pool === 'any'
      ? SAVE_FRAMES
      : SAVE_FRAMES.filter((frame) => frame.pool === pool);
  const available = poolFrames.filter((frame) => !owned.has(frame.id));

  if (available.length === 0) {
    return { frame: null, allOwned: true };
  }

  const frame = available[Math.floor(Math.random() * available.length)];
  return { frame, allOwned: false };
}

export function applySaveFrameUnlock(player, frame) {
  if (!frame) return {};

  const unlockedFrames = [...new Set([...(player?.unlockedFrames || []), frame.id])];
  return {
    unlockedFrames,
    currentFrame: frame.id,
  };
}

export function normalizeUnlockedFrames(raw) {
  if (!Array.isArray(raw)) return [];
  const validIds = new Set(SAVE_FRAMES.map((frame) => frame.id));
  return raw.filter((id) => validIds.has(id));
}
