import { BACKGROUNDS, GACHA_ITEMS, getRarityWeight } from '../constants';
import { BGM_LIST, SE_LIST } from '../audio';

const REWARD_PULL_COSTS = {
  1: 100,
  6: 500,
  15: 1000,
};

function pickWeighted(items) {
  if (!items.length) return null;
  const total = items.reduce((sum, item) => sum + getRarityWeight(item.rarity), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= getRarityWeight(item.rarity);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

export function pullRewardItems(count = 1) {
  const pool = GACHA_ITEMS.filter((item) => item.rarity !== '✨レジェンド✨');
  return Array.from({ length: count }, () => pickWeighted(pool)).filter(Boolean);
}

export function pullLegendItem() {
  const pool = GACHA_ITEMS.filter(
    (item) => item.rarity === '✨激レア✨' || item.rarity === '✨レジェンド✨',
  );
  return pickWeighted(pool);
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

export function getHotColorForRarity(rarity) {
  if (rarity === '✨レジェンド✨') {
    return { hex: '#a855f7', rarity, name: 'purple' };
  }
  if (rarity === '✨激レア✨') {
    return { hex: '#eab308', rarity, name: 'yellow' };
  }
  if (rarity === 'レア') {
    return { hex: '#22c55e', rarity, name: 'green' };
  }
  return { hex: '#3b82f6', rarity, name: 'blue' };
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
