/** セーブデータカード用フレーム（ひらがなチャレンジ達成ガチャ） */
export const SAVE_FRAMES = [
  {
    id: 'sakura',
    name: 'さくらフレーム',
    emoji: '🌸',
    pool: 'practice',
  },
  {
    id: 'mint',
    name: 'ミントフレーム',
    emoji: '🍃',
    pool: 'practice',
  },
  {
    id: 'sky',
    name: 'そらフレーム',
    emoji: '☁️',
    pool: 'practice',
  },
  {
    id: 'lemon',
    name: 'レモンフレーム',
    emoji: '🍋',
    pool: 'practice',
  },
  {
    id: 'lavender',
    name: 'ラベンダーフレーム',
    emoji: '💜',
    pool: 'practice',
  },
  {
    id: 'gold',
    name: 'ゴールドフレーム',
    emoji: '👑',
    pool: 'test',
  },
  {
    id: 'diamond',
    name: 'ダイヤフレーム',
    emoji: '💎',
    pool: 'test',
  },
  {
    id: 'fire',
    name: 'ファイヤーフレーム',
    emoji: '🔥',
    pool: 'test',
  },
  {
    id: 'star',
    name: 'スターフレーム',
    emoji: '⭐',
    pool: 'test',
  },
  {
    id: 'trophy',
    name: 'トロフィーフレーム',
    emoji: '🏆',
    pool: 'test',
  },
];

export const FRAME_GACHA_LABELS = {
  practice: {
    title: 'れんしゅう ぜん行クリア！',
    subtitle: 'セーブデータ用 フレームガチャ',
  },
  test: {
    title: 'テスト ぜん行クリア！',
    subtitle: 'セーブデータ用 フレームガチャ',
  },
};

export function getSaveFrame(frameId) {
  return SAVE_FRAMES.find((frame) => frame.id === frameId) || null;
}

export function getSaveFramesByPool(pool) {
  return SAVE_FRAMES.filter((frame) => frame.pool === pool);
}
