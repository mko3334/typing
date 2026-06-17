import { BACKGROUNDS, GACHA_ITEMS } from '../constants';
import { BGM_LIST, SE_LIST } from '../audio';

const REWARD_PULL_COSTS = {
  1: 100,
  6: 500,
  15: 1000,
};

/** ごほうびガacha：レアリティ別の出率（アイテム数に左右されない） */
const REWARD_TIER_WEIGHTS = {
  '✨レジェンド✨': 1,
  '🌟超激レア🌟': 4,
  '🔥激レア🔥': 4,
  '✨激レア✨': 8,
  '⭐レア⭐': 27,
  レア: 27,
  ノーマル: 60,
};

/** 超激レア以上ガacha：超激レア vs レジェンド（レジェンドは低め） */
const PREMIUM_GACHA_TIER_WEIGHTS = {
  '🌟超激レア🌟': 82,
  '🔥激レア🔥': 82,
  '✨レジェンド✨': 18,
};

const PREMIUM_GACHA_RARITIES = new Set(['🌟超激レア🌟', '🔥激レア🔥', '✨レジェンド✨']);

function pickByTierWeights(pool, tierWeights) {
  if (!pool.length) return null;

  const tiers = Object.entries(tierWeights).filter(([tier]) => pool.some((item) => item.rarity === tier));
  if (!tiers.length) return pool[Math.floor(Math.random() * pool.length)];

  const total = tiers.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;

  for (const [tier, weight] of tiers) {
    roll -= weight;
    if (roll <= 0) {
      const tierItems = pool.filter((item) => item.rarity === tier);
      return tierItems[Math.floor(Math.random() * tierItems.length)];
    }
  }

  const fallbackTier = tiers[tiers.length - 1][0];
  const fallbackItems = pool.filter((item) => item.rarity === fallbackTier);
  return fallbackItems[Math.floor(Math.random() * fallbackItems.length)];
}

export function pullRewardItems(count = 1) {
  const pool = GACHA_ITEMS;
  return Array.from({ length: count }, () => pickByTierWeights(pool, REWARD_TIER_WEIGHTS)).filter(Boolean);
}

export function pullLegendItem() {
  const pool = GACHA_ITEMS.filter((item) => PREMIUM_GACHA_RARITIES.has(item.rarity));
  return pickByTierWeights(pool, PREMIUM_GACHA_TIER_WEIGHTS);
}

export function pullBackground(backgrounds = ['default']) {
  const owned = new Set(backgrounds);
  const pool = BACKGROUNDS.filter((bg) => bg.id !== 'default' && !owned.has(bg.id));
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pullBgm(unlockedBgms = ['default']) {
  const owned = new Set(unlockedBgms);
  const pool = BGM_LIST.filter((bgm) => !owned.has(bgm.id));
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pullSe(unlockedSes = ['default']) {
  const owned = new Set(unlockedSes);
  const pool = SE_LIST.filter((se) => !owned.has(se.id));
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getRewardPullCost(count) {
  return REWARD_PULL_COSTS[count] ?? null;
}

const HOT_TIER_ORDER = { yellow: 1, red: 2, purple: 3 };

export function getHotTierForRarity(rarity) {
  if (rarity === '✨レジェンド✨') return 'purple';
  if (rarity === '🌟超激レア🌟' || rarity === '🔥激レア🔥') return 'red';
  if (rarity === '✨激レア✨') return 'yellow';
  return null;
}

export function getHighestHotTierFromItems(items = []) {
  let best = null;
  for (const item of items) {
    const tier = getHotTierForRarity(item?.rarity);
    if (!tier) continue;
    if (!best || HOT_TIER_ORDER[tier] > HOT_TIER_ORDER[best]) best = tier;
  }
  return best;
}

export function getHotColorForRarity(rarity) {
  const tier = getHotTierForRarity(rarity);
  if (tier === 'purple') {
    return { hex: '#a855f7', rarity, name: 'purple', tier };
  }
  if (tier === 'red') {
    return { hex: '#ef4444', rarity, name: 'red', tier };
  }
  if (tier === 'yellow') {
    return { hex: '#eab308', rarity, name: 'yellow', tier };
  }
  if (rarity === 'レア') {
    return { hex: '#22c55e', rarity, name: 'green', tier: null };
  }
  return { hex: '#3b82f6', rarity, name: 'blue', tier: null };
}

export function getHotTierStyles(tier) {
  if (tier === 'purple') {
    return {
      text: '#9333ea',
      border: '#a855f7',
      flash: 'animate-thunder-flash-purple',
      strike: 'animate-thunder-strike-purple',
    };
  }
  if (tier === 'red') {
    return {
      text: '#dc2626',
      border: '#ef4444',
      flash: 'animate-thunder-flash-red',
      strike: 'animate-thunder-strike-red',
    };
  }
  return {
    text: '#ca8a04',
    border: '#eab308',
    flash: 'animate-thunder-flash-yellow',
    strike: 'animate-thunder-strike-yellow',
  };
}

export function applyCollectionPulls(collection, items) {
  const next = { ...collection };
  const newNames = [];
  for (const item of items) {
    const prev = next[item.name] || 0;
    next[item.name] = prev + 1;
    if (prev === 0) newNames.push(item.name);
  }
  return { collection: next, newNames };
}

export function computeAchievements(player, collection) {
  const achievements = new Set(Array.isArray(player?.achievements) ? player.achievements : ['rookie']);
  const ownedCount = Object.keys(collection).filter((key) => collection[key] > 0).length;

  if (ownedCount >= 15) achievements.add('collection_15');
  if ((player?.points || 0) >= 1000) achievements.add('points_1000');

  const hasLegend = GACHA_ITEMS.some(
    (item) => item.rarity === '✨レジェンド✨' && (collection[item.name] || 0) > 0,
  );
  if (hasLegend) achievements.add('legend_hunter');

  const allCollected = GACHA_ITEMS.every((item) => (collection[item.name] || 0) > 0);
  if (allCollected) achievements.add('collection_complete');

  return [...achievements];
}

export function mergeNewItems(existing = [], added = []) {
  const set = new Set(existing);
  added.forEach((name) => set.add(name));
  return [...set];
}
