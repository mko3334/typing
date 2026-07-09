import { GACHA_ITEMS } from '../constants';

// 効果の定義 (10パワーあたりの効果量)
export const GEAR_POWER_RATES = {
  score: 0.02,   // +2% スコアアップ
  time: 2,       // +2秒 延長
  combo: 0.2,    // +0.2x コンボ倍率アップ
  guard: 10,     // 10% ミス無効化確率
  special: 0.03, // +3% 激アツ率アップ
};

// 装備枠とレアリティによるパワー設定
export const RARITY_POWER_RATES = {
  'ノーマル': { main: 10, sub: 3 },
  'レア': { main: 15, sub: 5 },
  '✨激レア✨': { main: 20, sub: 7 },
  '🌟超激レア🌟': { main: 30, sub: 10 },
  '✨レジェンド✨': { main: 50, sub: 15 }
};

export const getItemPowerPoints = (itemName, isMain, level = 0) => {
  const item = GACHA_ITEMS.find(i => i.name === itemName);
  if (!item) return 0;
  const rates = RARITY_POWER_RATES[item.rarity] || RARITY_POWER_RATES['ノーマル'];
  const base = isMain ? rates.main : rates.sub;
  
  // レベルが上がるほど上昇量が緩やかになるように平方根を使用
  // レジェンドアイテムの価値を維持するための調整
  return base * (1 + Math.sqrt(level) * 0.15);
};

export const formatPowerPoint = (key, points) => {
  if (points === 0) return '0';
  if (key === 'score') return `+${Math.round(points * (GEAR_POWER_RATES.score / 10) * 100)}%`;
  if (key === 'time') return `+${(points * (GEAR_POWER_RATES.time / 10)).toFixed(1).replace(/\.0$/, '')}秒`;
  if (key === 'combo') return `+${(points * (GEAR_POWER_RATES.combo / 10)).toFixed(1).replace(/\.0$/, '')}倍`;
  if (key === 'guard') return `+${Math.round(points * (GEAR_POWER_RATES.guard / 10))}%`;
  if (key === 'special') return `+${Math.round(points * (GEAR_POWER_RATES.special / 10) * 100)}%`;
  return `+${points.toFixed(1)}`;
};

// アイテムの読みがな（タイピング用）
export const ITEM_READINGS = {
  'おもちゃのロボ': 'おもちゃのろぼ',
  'とくだいバーガー': 'とくだいばーがー',
  'まっかなリンゴ': 'まっかなりんご',
  'あまいバナナ': 'あまいばなな',
  'サッカーボール': 'さっかーぼーる',
  'バスケットボール': 'ばすけっとぼーる',
  'テディベア': 'てでぃべあ',
  'たいこ': 'たいこ',
  'ぶろっく': 'ぶろっく',
  'かぜぐるま': 'かぜぐるま',
  'こいのぼり': 'こいのぼり',
  'けん玉': 'けんだま',
  'おりがみ': 'おりがみ',
  'わたがし': 'わたがし',
  'きのこ': 'きのこ',
  'ろけっと': 'ろけっと',
  'すーぱーかー': 'すーぱーかー',
  'まほうのステッキ': 'まほうのすてっき',
  'おおきなケーキ': 'おおきなけーき',
  'でかいアイス': 'でかいあいす',
  'にんじゃかたな': 'にんじゃかたな',
  'たからのちず': 'たからのちず',
  'でんきゅう': 'でんきゅう',
  'やきゅうボール': 'やきゅうぼーる',
  'ゴーカート': 'ごーかーと',
  'おうかん': 'おうかん',
  'ほうせき': 'ほうせき',
  'きょうりゅう': 'きょうりゅう',
  'ゆにこーん': 'ゆにこーん',
  'てんしのつばさ': 'てんしのつばさ',
  'にじいろのかぎ': 'にじいろのかぎ',
  'まほうのぼうし': 'まほうのぼうし',
  'ゴールドコイン': 'ごーるどこいん',
  '星のネックレス': 'ほしのねっくれす',
  '金のハープ': 'きんはーぷ',
  '虹のふきん': 'にじのふきん',
  '冒険者のバッグ': 'ぼうけんしゃのばっぐ',
  'サファイアリング': 'さふぁいありんぐ',
  'ねむりのひつじ': 'ねむりのひつじ',
  '海賊旗': 'かいぞくき',
  '光のたま': 'ひかりのたま',
  'タイムマシン': 'たいむましん',
  '虹のクリスタル': 'にじのくりすたる',
  '黄金のペガサス': 'おうごんのぺがさす',
  '流星群': 'りゅうせいぐん',
  'でんせつの宝箱': 'でんせつのたからばこ',
  'アルティメットロボ': 'あるてぃめっとろぼ',
  'でんせつのけん': 'でんせつのけん',
  'でんせつのたて': 'でんせつのたて',
  '氷のおしろ': 'こおりのおしろ',
  '古代の化石': 'こだいのかせき',
  'まほうのランプ': 'まほうのらんぷ',
  '雷の弓': 'かみなりのゆみ',
  'でんせつのドラゴン': 'でんせつのどらごん',
  'ほのおのとり': 'ほのおのとり',
  'マスターソード': 'ますたーそーど',
  'しんかいのくじら': 'しんかいのくじら',
  '不死鳥の羽': 'ふしちょうのはね',
  'ダーククリスタル': 'だーくくりすたる',
  'コスモスペースシップ': 'こすもすぺーすしっぷ',
  'まほうのグリモア': 'まほうのぐりもあ'
};

// アイテム名 -> 効果キー のマッピング
// 61種類のアイテムに均等に割り当てる
export const ITEM_GEAR_POWERS = {
  // --- スコアアップ (score) ---
  'ゴールドトロフィー': 'score',
  'おうかん': 'score',
  'ほうせき': 'score',
  'ゴールドコイン': 'score',
  'たからのちず': 'score',
  'まっかなリンゴ': 'score',
  'あまいバナナ': 'score',
  'きのこ': 'score',
  'わたがし': 'score',
  'おおきなケーキ': 'score',
  'でかいアイス': 'score',
  'サファイアリング': 'score',

  // --- タイムプラス (time) ---
  'タイムマシン': 'time',
  'コスモスペースシップ': 'time',
  'ろけっと': 'time',
  'すーぱーかー': 'time',
  'ゴーカート': 'time',
  'ぎんがの舟': 'time',
  '黄金のペガサス': 'time',
  'かぜぐるま': 'time',
  'こいのぼり': 'time',
  'やきゅうボール': 'time',

  // --- コンボ強化 (combo) ---
  'マスターソード': 'combo',
  'でんせつのけん': 'combo',
  'にんじゃかたな': 'combo',
  '雷の弓': 'combo',
  'たいこ': 'combo',
  'けん玉': 'combo',
  'ぶろっく': 'combo',
  'サッカーボール': 'combo',
  'バスケットボール': 'combo',
  'おもちゃのロボ': 'combo',
  'アルティメットロボ': 'combo',

  // --- ミスガード (guard) ---
  'でんせつのたて': 'guard',
  'てんしのつばさ': 'guard',
  'ねむりのひつじ': 'guard',
  '氷のおしろ': 'guard',
  '古代の化石': 'guard',
  'おりがみ': 'guard',
  'テディベア': 'guard',
  'まほうのぼうし': 'guard',
  '冒険者のバッグ': 'guard',
  '海賊旗': 'guard',
  'ドラゴンのたまご': 'guard',
  'とくだいバーガー': 'guard',

  // --- 激アツ率UP (special) ---
  'でんせつのドラゴン': 'special',
  'ほのおのとり': 'special',
  '虹のクリスタル': 'special',
  '流星群': 'special',
  'まほうのランプ': 'special',
  'まほうのステッキ': 'special',
  'でんせつの宝箱': 'special',
  'にじいろのかぎ': 'special',
  '光のたま': 'special',
  '星のネックレス': 'special',
  '金のハープ': 'special',
  '虹のふきん': 'special',
  'しんかいのくじら': 'special',
  '不死鳥の羽': 'special',
  'ダーククリスタル': 'special',
  'でんきゅう': 'special',
  'まほうのグリモア': 'special',
};

// 安全のため、マップにないアイテムはデフォルトで score にする
export const getPowerType = (itemName) => {
  return ITEM_GEAR_POWERS[itemName] || 'score';
};

export const GEAR_POWER_LABELS = {
  score: { label: 'スコアアップ', icon: '🪙', color: 'text-yellow-600', bg: 'bg-yellow-100', desc: '獲得スコアが増える' },
  time: { label: 'タイムプラス', icon: '⏳', color: 'text-sky-600', bg: 'bg-sky-100', desc: '制限時間が長くなる' },
  combo: { label: 'コンボ強化', icon: '🎯', color: 'text-green-600', bg: 'bg-green-100', desc: 'コンボ倍率が上がりやすくなる' },
  guard: { label: 'ミスガード', icon: '🛡️', color: 'text-indigo-600', bg: 'bg-indigo-100', desc: 'ミスしてもコンボが途切れない確率' },
  special: { label: '激アツ率UP', icon: '✨', color: 'text-rose-600', bg: 'bg-rose-100', desc: '高得点ワードが出やすくなる' },
};

/**
 * プレイヤーの装備情報から、総合的なアイテムスキルを計算する
 * 
 * @param {Object} gears { main: string[], sub: string[] } 
 * @param {Object} itemLevels { [itemName]: number }
 * @returns {Object} 各効果の最終値 { scoreBoost, timePlus, comboBoost, missGuardProb, specialRateUp, points }
 */
export const calculateGearPowers = (gears, itemLevels = {}) => {
  const powerPoints = {
    score: 0,
    time: 0,
    combo: 0,
    guard: 0,
    special: 0,
  };

  if (!gears) return {
    scoreBoost: 0, timePlus: 0, comboBoost: 0, missGuardProb: 0, specialRateUp: 0, points: powerPoints
  };

  const mains = Array.isArray(gears.main) ? gears.main : [];
  const subs = Array.isArray(gears.sub) ? gears.sub : [];

  // メインの計算
  mains.forEach(itemName => {
    if (itemName) {
      const type = getPowerType(itemName);
      const level = itemLevels[itemName] || 0;
      powerPoints[type] += getItemPowerPoints(itemName, true, level);
    }
  });

  // サブの計算
  subs.forEach(itemName => {
    if (itemName) {
      const type = getPowerType(itemName);
      const level = itemLevels[itemName] || 0;
      powerPoints[type] += getItemPowerPoints(itemName, false, level);
    }
  });

  // 効果値に変換
  return {
    scoreBoost: powerPoints.score * (GEAR_POWER_RATES.score / 10),       // 割合 (例: 0.114)
    timePlus: powerPoints.time * (GEAR_POWER_RATES.time / 10),           // 秒 (例: 11.4)
    comboBoost: powerPoints.combo * (GEAR_POWER_RATES.combo / 10),       // 倍率 (例: 1.14)
    missGuardProb: powerPoints.guard * (GEAR_POWER_RATES.guard / 10),    // 確率(%) (例: 57)
    specialRateUp: powerPoints.special * (GEAR_POWER_RATES.special / 10),// 割合 (例: 0.171)
    
    // UI表示用
    points: powerPoints
  };
};
