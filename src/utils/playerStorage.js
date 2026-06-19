import localforage from 'localforage';
import { enrichPlayer } from './player';

export function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

export async function loadLocalPlayerEntries() {
  const entries = await localforage.getItem('players');
  if (!Array.isArray(entries) || entries.length === 0) return [];

  const results = await Promise.all(
    entries
      .filter((entry) => entry?.id)
      .map(async (entry) => {
        const stored = (await localforage.getItem(`player_data_${entry.id}`)) || {};
        const merged = { ...stored, ...entry };
        if (!merged.name) return null;
        return enrichPlayer(entry.id, merged);
      }),
  );

  return results.filter(Boolean);
}

export async function persistPlayerLocally(playerId, playerData) {
  if (!playerId || !playerData) return;
  const clean = { ...playerData, isCloudSync: playerData.isCloudSync !== false };
  await localforage.setItem(`player_data_${playerId}`, clean);

  const entries = (await localforage.getItem('players')) || [];
  const nextEntry = {
    id: playerId,
    name: clean.name,
    isCloudSync: clean.isCloudSync !== false,
    isArchived: clean.isArchived === true,
  };
  const index = entries.findIndex((entry) => entry.id === playerId);
  if (index >= 0) {
    entries[index] = { ...entries[index], ...nextEntry };
  } else {
    entries.push(nextEntry);
  }
  await localforage.setItem('players', entries);
}

function pickNewerPlayer(existing, incoming) {
  const existingTime = existing.lastUpdatedAt ? new Date(existing.lastUpdatedAt).getTime() : 0;
  const incomingTime = incoming.lastUpdatedAt ? new Date(incoming.lastUpdatedAt).getTime() : 0;
  if (incomingTime >= existingTime) return incoming;
  return existing;
}

export function mergeCloudAndLocalPlayers(cloudMap, localPlayers) {
  const byId = new Map(localPlayers.map((player) => [player.id, player]));

  if (cloudMap) {
    Object.entries(cloudMap).forEach(([docId, data]) => {
      if (!data?.name) return;
      const existingById = byId.get(docId);
      const existingByName = [...byId.values()].find((player) => player.name === data.name);
      const existing = existingById || existingByName;
      const cloudPlayer = enrichPlayer(existing?.id || docId, {
        ...(existing || {}),
        ...data,
        id: existing?.id || docId,
      });

      if (existing) {
        byId.set(existing.id, pickNewerPlayer(existing, cloudPlayer));
      } else {
        byId.set(cloudPlayer.id, cloudPlayer);
      }
    });
  }

  return [...byId.values()];
}

export async function persistMergedPlayers(players) {
  if (!players?.length) return;
  void Promise.all(players.map((player) => persistPlayerLocally(player.id, player))).catch(() => {});
}

export async function loadTagMaster() {
  const stored = await localforage.getItem('tagMaster');
  return Array.isArray(stored) ? stored.filter(Boolean) : [];
}

export async function saveTagMaster(tags) {
  const unique = [...new Set(tags.filter(Boolean))].sort();
  await localforage.setItem('tagMaster', unique);
  return unique;
}

export function collectAllTags(players, tagMaster = []) {
  const tags = new Set(tagMaster);
  players.forEach((player) => (player.tags || []).forEach((tag) => tags.add(tag)));
  return [...tags].sort();
}
