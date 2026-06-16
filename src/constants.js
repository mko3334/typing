export 

export const BACKGROUNDS = [
  { id: 'default', name: 'いつものへや', url: '/bg.png' },
  { id: 'space', name: 'うちゅう', url: '/space_bg.png' },
  { id: 'forest', name: 'もりのなか', url: '/forest_bg.png' },
  { id: 'ocean', name: 'うみのそこ', url: '/underwater_bg.png' },
  { id: 'castle', name: 'おしろ', url: '/castle_bg.png' },
  { id: 'dino', name: 'きょうりゅう', url: '/dino_bg.png' },
  { id: 'candy', name: 'おかしのくに', url: '/candy_bg.png' }
];

export const TITLES = [
  { id: 'beginner', name: 'しょしんしゃ', color: 'text-gray-600', bg: 'bg-gray-100' },
  { id: 'speedstar', name: 'スピードスター', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  { id: 'master', name: 'タイピングマスター', color: 'text-purple-600', bg: 'bg-purple-100' },
  { id: 'legend', name: 'でんせつのゆうしゃ', color: 'text-red-600', bg: 'bg-red-100' }
];

export const GACHA_ITEMS = [
  { id: 'bg_space', type: 'background', bgId: 'space', name: 'うちゅうの背景', rarity: 'rare' },
  { id: 'bg_forest', type: 'background', bgId: 'forest', name: 'もりの背景', rarity: 'normal' },
  { id: 'bg_ocean', type: 'background', bgId: 'ocean', name: 'うみの背景', rarity: 'rare' },
  { id: 'bg_castle', type: 'background', bgId: 'castle', name: 'おしろの背景', rarity: 'epic' },
  { id: 'bg_dino', type: 'background', bgId: 'dino', name: 'きょうりゅうの背景', rarity: 'epic' },
  { id: 'bg_candy', type: 'background', bgId: 'candy', name: 'おかしの背景', rarity: 'epic' },
  { id: 'title_speedstar', type: 'title', titleId: 'speedstar', name: '称号：スピードスター', rarity: 'rare' },
  { id: 'title_master', type: 'title', titleId: 'master', name: '称号：タイピングマスター', rarity: 'epic' },
  { id: 'title_legend', type: 'title', titleId: 'legend', name: '称号：でんせつのゆうしゃ', rarity: 'legendary' }
];
