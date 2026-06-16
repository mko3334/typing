const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Replace WORDS
const newWordsStr = `const WORDS = {
  easy: [
    { kana: 'あり', romaji: ['ari'], emoji: '🐜' },
    { kana: 'いぬ', romaji: ['inu'], emoji: '🐶' },
    { kana: 'うし', romaji: ['usi', 'ushi'], emoji: '🐄' },
    { kana: 'かめ', romaji: ['kame'], emoji: '🐢' },
    { kana: 'さる', romaji: ['saru'], emoji: '🐵' },
    { kana: 'たこ', romaji: ['tako'], emoji: '🐙' },
    { kana: 'ねこ', romaji: ['neko'], emoji: '🐱' },
    { kana: 'はな', romaji: ['hana'], emoji: '🌸' },
    { kana: 'ふね', romaji: ['fune'], emoji: '🚢' },
    { kana: 'ほし', romaji: ['hosi', 'hoshi'], emoji: '⭐' },
    { kana: 'まど', romaji: ['mado'], emoji: '🪟' },
    { kana: 'ゆき', romaji: ['yuki'], emoji: '⛄' },
    { kana: 'よる', romaji: ['yoru'], emoji: '🌃' },
    { kana: 'くま', romaji: ['kuma'], emoji: '🐻' },
    { kana: 'とり', romaji: ['tori'], emoji: '🐦' },
    { kana: 'つき', romaji: ['tuki', 'tsuki'], emoji: '🌙' },
    { kana: 'もも', romaji: ['momo'], emoji: '🍑' },
    { kana: 'なし', romaji: ['nasi', 'nashi'], emoji: '🍐' },
    { kana: 'くつ', romaji: ['kutu', 'kutsu'], emoji: '👟' },
    { kana: 'かさ', romaji: ['kasa'], emoji: '☂️' },
    { kana: 'えき', romaji: ['eki'], emoji: '🚉' },
    { kana: 'うみ', romaji: ['umi'], emoji: '🌊' },
    { kana: 'そら', romaji: ['sora'], emoji: '☁️' },
    { kana: 'やま', romaji: ['yama'], emoji: '⛰️' },
    { kana: 'かわ', romaji: ['kawa'], emoji: '🏞️' }
  ],
  normal: [
    { kana: 'りんご', romaji: ['ringo'], emoji: '🍎' },
    { kana: 'みかん', romaji: ['mikan'], emoji: '🍊' },
    { kana: 'ぶどう', romaji: ['budou'], emoji: '🍇' },
    { kana: 'めろん', romaji: ['meron'], emoji: '🍈' },
    { kana: 'いちご', romaji: ['itigo', 'ichigo'], emoji: '🍓' },
    { kana: 'ごりら', romaji: ['gorira'], emoji: '🦍' },
    { kana: 'ぱんだ', romaji: ['panda'], emoji: '🐼' },
    { kana: 'うさぎ', romaji: ['usagi'], emoji: '🐰' },
    { kana: 'きりん', romaji: ['kirin'], emoji: '🦒' },
    { kana: 'らいおん', romaji: ['raion'], emoji: '🦁' },
    { kana: 'ちょこ', romaji: ['tyoko', 'cyoko', 'choco'], emoji: '🍫' },
    { kana: 'けーき', romaji: ['ke-ki'], emoji: '🍰' },
    { kana: 'とけい', romaji: ['tokei'], emoji: '⌚' },
    { kana: 'じゅーす', romaji: ['zyu-su', 'ju-su'], emoji: '🧃' },
    { kana: 'えんぴつ', romaji: ['enpitu', 'enpitsu'], emoji: '✏️' },
    { kana: 'れもん', romaji: ['remon', 'lemon'], emoji: '🍋' },
    { kana: 'ひまわり', romaji: ['himawari'], emoji: '🌻' },
    { kana: 'つくえ', romaji: ['tukue', 'tsukue'], emoji: '🪑' },
    { kana: 'にんじゃ', romaji: ['ninja', 'ninzya'], emoji: '🥷' },
    { kana: 'よっと', romaji: ['yotto'], emoji: '⛵' },
    { kana: 'ごはん', romaji: ['gohan'], emoji: '🍚' },
    { kana: 'おんぷ', romaji: ['onpu'], emoji: '🎵' }
  ],
  hard: [
    { kana: 'ハンバーグ', romaji: ['hanba-gu'], emoji: '🍽️' },
    { kana: 'スパゲッティ', romaji: ['supagetti'], emoji: '🍝' },
    { kana: 'アイスクリーム', romaji: ['aisukuri-mu'], emoji: '🍦' },
    { kana: 'チョコレート', romaji: ['tyokore-to', 'chokore-to'], emoji: '🍫' },
    { kana: 'オムライス', romaji: ['omuraisu'], emoji: '🍳' },
    { kana: 'しょうぼうしゃ', romaji: ['syoubousya', 'shoubousha'], emoji: '🚒' },
    { kana: 'きゅうきゅうしゃ', romaji: ['kyuukyuusya', 'kyuukyuusha'], emoji: '🚑' },
    { kana: 'パトロールカー', romaji: ['patoro-ruka-'], emoji: '🚓' },
    { kana: 'ティラノサウルス', romaji: ['tiranosaurusu'], emoji: '🦖' },
    { kana: 'トリケラトプス', romaji: ['torikeratopusu'], emoji: '🦕' },
    { kana: 'マトリョーシカ', romaji: ['matoryo-sika', 'matoryo-shika'], emoji: '🪆' },
    { kana: 'プラネタリウム', romaji: ['puranetariumu'], emoji: '🌌' },
    { kana: 'スマートフォン', romaji: ['suma-tofon'], emoji: '📱' },
    { kana: 'プロジェクター', romaji: ['purozyekuta-', 'purojekuta-'], emoji: '📽️' },
    { kana: 'コミュニケーション', romaji: ['komyunike-syon', 'komyunike-shon'], emoji: '🗣️' },
    { kana: 'キャタピラー', romaji: ['kyatapira-'], emoji: '🐛' },
    { kana: 'トランペット', romaji: ['toranpetto'], emoji: '🎺' },
    { kana: 'ジャックオランタン', romaji: ['zyakkuorantan', 'jakkuorantan'], emoji: '🎃' }
  ]
};`;

code = code.replace(/const WORDS = \{[\s\S]*?\n\};\n/m, newWordsStr + '\n');

// Replace GACHA_ITEMS
const newGachaStr = `const GACHA_ITEMS = [
  { name: 'でんせつのドラゴン', emoji: '🐉', rarity: '✨レジェンド✨', color: 'text-yellow-600 drop-shadow-md' },
  { name: 'コスモスペースシップ', emoji: '🛸', rarity: '✨レジェンド✨', color: 'text-purple-600 drop-shadow-md' },
  { name: 'マスターソード', emoji: '🗡️', rarity: '✨レジェンド✨', color: 'text-blue-600 drop-shadow-md' },
  { name: 'まほうのグリモア', emoji: '📖', rarity: '✨レジェンド✨', color: 'text-pink-600 drop-shadow-md' },
  { name: 'アルティメットロボ', emoji: '🤖', rarity: '✨レジェンド✨', color: 'text-gray-800 drop-shadow-md' },
  
  { name: 'おうかん', emoji: '👑', rarity: '✨激レア✨', color: 'text-yellow-500' },
  { name: 'ほうせき', emoji: '💎', rarity: '✨激レア✨', color: 'text-blue-400' },
  { name: 'きょうりゅう', emoji: '🦕', rarity: '✨激レア✨', color: 'text-green-500' },
  { name: 'ゆにこーん', emoji: '🦄', rarity: '✨激レア✨', color: 'text-pink-400' },
  
  { name: 'ろけっと', emoji: '🚀', rarity: 'レア', color: 'text-red-500' },
  { name: 'すーぱーかー', emoji: '🏎️', rarity: 'レア', color: 'text-sky-500' },
  { name: 'まほうのステッキ', emoji: '🪄', rarity: 'レア', color: 'text-pink-300' },
  { name: 'おおきなケーキ', emoji: '🎂', rarity: 'レア', color: 'text-orange-400' },
  
  { name: 'おもちゃのロボ', emoji: '🤖', rarity: 'ノーマル', color: 'text-gray-500' },
  { name: 'とくだいバーガー', emoji: '🍔', rarity: 'ノーマル', color: 'text-orange-500' },
  { name: 'まっかなリンゴ', emoji: '🍎', rarity: 'ノーマル', color: 'text-red-400' },
  { name: 'あまいバナナ', emoji: '🍌', rarity: 'ノーマル', color: 'text-yellow-400' },
  { name: 'サッカーボール', emoji: '⚽', rarity: 'ノーマル', color: 'text-gray-600' },
  { name: 'バスケットボール', emoji: '🏀', rarity: 'ノーマル', color: 'text-orange-600' },
  { name: 'テディベア', emoji: '🧸', rarity: 'ノーマル', color: 'text-amber-600' }
];`;

code = code.replace(/const GACHA_ITEMS = \[[\s\S]*?\n\];\n/m, newGachaStr + '\n');

// Replace handleSpinGacha logic to filter Legendaries
code = code.replace(
  `const randomItem = GACHA_ITEMS[Math.floor(Math.random() * GACHA_ITEMS.length)];`,
  `const availableItems = difficulty === 'hard' ? GACHA_ITEMS : GACHA_ITEMS.filter(item => item.rarity !== '✨レジェンド✨');\n      const randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];`
);

// Replace handleShopPull logic
code = code.replace(
  `pulls.push(GACHA_ITEMS[Math.floor(Math.random() * GACHA_ITEMS.length)]);`,
  `const availableItems = difficulty === 'hard' ? GACHA_ITEMS : GACHA_ITEMS.filter(item => item.rarity !== '✨レジェンド✨');\n        pulls.push(availableItems[Math.floor(Math.random() * availableItems.length)]);`
);

fs.writeFileSync('src/App.jsx', code);
