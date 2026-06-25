import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { User, Plus, Search, X, Tag, RefreshCcw } from 'lucide-react';
import { loadAllCloudPlayers, saveCloudPlayer } from '../firebase';
import PlayerCard from './PlayerCard';
import AdminPanel from './AdminPanel';
import PlayerTagEditModal from './PlayerTagEditModal';
import TagManagePanel from './TagManagePanel';
import { enrichPlayer } from '../utils/player';
import {
  loadLocalPlayerEntries,
  mergeCloudAndLocalPlayers,
  persistMergedPlayers,
  persistPlayerLocally,
  withTimeout,
  loadTagMaster,
  saveTagMaster,
  collectAllTags,
} from '../utils/playerStorage';
import { optimizedAssetUrl, preloadImages } from '../utils/assetImages';
import { resolveBackground } from '../constants';
import {
  getDeviceSessionId,
  isPlayerLockedElsewhere,
  PLAYING_TIMEOUT_MS,
} from '../utils/playerSession';
import ConfirmModal from './ConfirmModal';

function dedupePlayersByName(players) {
  const byName = new Map();
  for (const player of players) {
    const existing = byName.get(player.name);
    if (!existing) {
      byName.set(player.name, player);
      continue;
    }
    const existingTime = existing.lastUpdatedAt ? new Date(existing.lastUpdatedAt).getTime() : 0;
    const playerTime = player.lastUpdatedAt ? new Date(player.lastUpdatedAt).getTime() : 0;
    if (playerTime >= existingTime) {
      byName.set(player.name, player);
    }
  }
  return [...byName.values()];
}

function getPlayerRecentTime(player) {
  const stamp = player.lastPlayedAt || player.lastUpdatedAt;
  return stamp ? new Date(stamp).getTime() : 0;
}

export function sortPlayers(players, sortMode) {
  const copy = [...players];
  switch (sortMode) {
    case 'name-desc':
      return copy.sort((a, b) => b.name.localeCompare(a.name, 'ja'));
    case 'recent-desc':
      return copy.sort((a, b) => getPlayerRecentTime(b) - getPlayerRecentTime(a));
    case 'recent-asc':
      return copy.sort((a, b) => getPlayerRecentTime(a) - getPlayerRecentTime(b));
    case 'name-asc':
      return copy.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    default:
      return copy.sort((a, b) => getPlayerRecentTime(b) - getPlayerRecentTime(a));
  }
}

export const PLAYER_SORT_OPTIONS = [
  { value: 'recent-desc', label: '最近プレイ（新しい順）' },
  { value: 'recent-asc', label: '最近プレイ（古い順）' },
  { value: 'name-asc', label: 'あいうえお順（昇順）' },
  { value: 'name-desc', label: 'あいうえお順（降順）' },
];

function playDecideSoundExternal(playDecideSound) {
  if (playDecideSound) {
    playDecideSound();
    return;
  }
  try {
    const audio = new Audio('/sounds/decide_cancel/decide.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

export default function TitleScreen({ onSelectPlayer, playDecideSound }) {
  const [players, setPlayers] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [prefetching, setPrefetching] = useState(true);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [modalTab, setModalTab] = useState('players');
  const [searchNameInput, setSearchNameInput] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [sortMode, setSortMode] = useState('recent-desc');
  const [loadNotice, setLoadNotice] = useState('');
  const [pendingPlayer, setPendingPlayer] = useState(null);
  const [pendingTakeover, setPendingTakeover] = useState(false);
  const [lockTick, setLockTick] = useState(0);
  const [showTagManagePanel, setShowTagManagePanel] = useState(false);
  const [tagMaster, setTagMaster] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [tagEditTarget, setTagEditTarget] = useState(null);
  const [isBulkTagMode, setIsBulkTagMode] = useState(false);
  const [bulkSelectedPlayerIds, setBulkSelectedPlayerIds] = useState([]);
  const loadRequestRef = useRef(0);

  const loadPlayers = useCallback(async ({ showSpinner = true } = {}) => {
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;
    if (showSpinner) setListLoading(true);
    setLoadNotice('');

    try {
      const localList = await loadLocalPlayerEntries();
      if (loadRequestRef.current !== requestId) return;

      if (localList.length > 0) {
        setPlayers(dedupePlayersByName(localList));
        setListLoading(false);
      }

      setCloudSyncing(true);
      const cloudPlayersMap = await withTimeout(loadAllCloudPlayers(), 5000, null);
      if (loadRequestRef.current !== requestId) return;

      const merged = mergeCloudAndLocalPlayers(cloudPlayersMap, localList);
      setPlayers(dedupePlayersByName(merged));
      void persistMergedPlayers(merged);

      if (cloudPlayersMap === null) {
        setLoadNotice(
          merged.length > 0
            ? 'クラウドと つながらないので、この端末の セーブを 表示しています。'
            : 'クラウドから セーブを 読み込めませんでした。ネットワークを 確認するか、新しく つくってください。',
        );
      }
    } catch (e) {
      console.error(e);
      if (loadRequestRef.current !== requestId) return;
      const fallback = await loadLocalPlayerEntries();
      setPlayers(dedupePlayersByName(fallback));
      setLoadNotice('セーブの 読み込みに 失敗しました。この端末に 保存があれば 表示しています。');
    } finally {
      if (loadRequestRef.current === requestId) {
        setListLoading(false);
        setCloudSyncing(false);
        setPrefetching(false);
      }
    }
  }, []);

  useEffect(() => {
    loadPlayers({ showSpinner: false });
  }, [loadPlayers]);

  useEffect(() => {
    if (showPlayerModal && modalTab === 'admin') {
      loadPlayers({ showSpinner: false });
    }
  }, [showPlayerModal, modalTab, loadPlayers]);

  useEffect(() => {
    if (!showPlayerModal || modalTab !== 'players') return undefined;
    const timer = setInterval(() => {
      setLockTick((tick) => tick + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, [showPlayerModal, modalTab]);

  useEffect(() => {
    if (!showPlayerModal || modalTab !== 'players') return undefined;
    const timer = setInterval(() => {
      loadPlayers({ showSpinner: false });
    }, PLAYING_TIMEOUT_MS / 3);
    return () => clearInterval(timer);
  }, [showPlayerModal, modalTab, loadPlayers]);

  useEffect(() => {
    loadTagMaster().then(setTagMaster).catch(() => {});
  }, []);

  useEffect(() => {
    if (!pendingPlayer) return;
    const bg = resolveBackground(pendingPlayer.currentBackground);
    preloadImages([
      optimizedAssetUrl('/mall_home_bg.png'),
      bg.url,
    ]);
  }, [pendingPlayer]);

  const allTags = useMemo(
    () => collectAllTags(players, tagMaster),
    [players, tagMaster],
  );

  const persistPlayerUpdates = useCallback(async (updatedPlayers, changedIds = null) => {
    setPlayers(updatedPlayers);
    const targets = changedIds
      ? updatedPlayers.filter((player) => changedIds.includes(player.id))
      : updatedPlayers;
    void persistMergedPlayers(targets);
    for (const player of targets) {
      saveCloudPlayer(player.id, player).catch(() => {});
    }
  }, []);

  const updatePlayersByIds = useCallback(
    async (playerIds, updater) => {
      const idSet = new Set(playerIds);
      const updatedPlayers = players.map((player) => {
        if (!idSet.has(player.id)) return player;
        return updater(player);
      });
      await persistPlayerUpdates(updatedPlayers, playerIds);
    },
    [players, persistPlayerUpdates],
  );

  const registerTagInMaster = useCallback(async (tag) => {
    const trimmed = tag?.trim();
    if (!trimmed) return;
    if (tagMaster.includes(trimmed)) return;
    const next = await saveTagMaster([...tagMaster, trimmed]);
    setTagMaster(next);
  }, [tagMaster]);

  const handleCreateMasterTag = useCallback(async (rawTag) => {
    const trimmed = rawTag?.trim();
    if (!trimmed) return;
    await registerTagInMaster(trimmed);
    setNewTagInput('');
    playDecideSoundExternal(playDecideSound);
  }, [registerTagInMaster, playDecideSound]);

  const handleDeleteTagEverywhere = useCallback(async (tag) => {
    if (!tag) return;
    if (!window.confirm(`タグ「${tag}」を すべての プレイヤーから 削除しますか？`)) return;

    const updatedPlayers = players.map((player) => ({
      ...player,
      tags: (player.tags || []).filter((entry) => entry !== tag),
      lastUpdatedAt: new Date().toISOString(),
    }));
    const nextMaster = await saveTagMaster(tagMaster.filter((entry) => entry !== tag));
    setTagMaster(nextMaster);
    setSelectedTag('');
    await persistPlayerUpdates(updatedPlayers);
    playDecideSoundExternal(playDecideSound);
  }, [players, tagMaster, persistPlayerUpdates, playDecideSound]);

  const openSingleTagEdit = useCallback((player) => {
    playDecideSoundExternal(playDecideSound);
    setTagEditTarget({
      mode: 'set',
      playerIds: [player.id],
      initialTags: player.tags || [],
      title: `「${player.name}」の タグ`,
      subtitle: 'タップで ON/OFF して 保存してね',
    });
  }, [playDecideSound]);

  const openBulkTagEdit = useCallback(() => {
    if (bulkSelectedPlayerIds.length === 0) return;
    playDecideSoundExternal(playDecideSound);
    setTagEditTarget({
      mode: 'add',
      playerIds: bulkSelectedPlayerIds,
      initialTags: [],
      title: 'まとめて タグ付け',
      subtitle: `${bulkSelectedPlayerIds.length}人に つけるタグを えらんでね`,
    });
  }, [bulkSelectedPlayerIds, playDecideSound]);

  const handleSavePlayerTags = useCallback(async (selectedTags, pendingNewTag) => {
    if (!tagEditTarget) return;
    const { mode, playerIds } = tagEditTarget;
    const trimmedNewTag = pendingNewTag?.trim();
    const tags = [...selectedTags];
    if (trimmedNewTag && !tags.includes(trimmedNewTag)) {
      tags.push(trimmedNewTag);
    }

    for (const tag of tags) {
      await registerTagInMaster(tag);
    }

    await updatePlayersByIds(playerIds, (player) => {
      if (mode === 'add') {
        return {
          ...player,
          tags: [...new Set([...(player.tags || []), ...tags])],
          lastUpdatedAt: new Date().toISOString(),
        };
      }
      return {
        ...player,
        tags,
        lastUpdatedAt: new Date().toISOString(),
      };
    });

    setTagEditTarget(null);
    if (mode === 'add') {
      setIsBulkTagMode(false);
      setBulkSelectedPlayerIds([]);
    }
    playDecideSoundExternal(playDecideSound);
  }, [tagEditTarget, registerTagInMaster, updatePlayersByIds, playDecideSound]);

  const toggleBulkPlayer = useCallback((playerId) => {
    setBulkSelectedPlayerIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId],
    );
  }, []);

  const filteredPlayers = useMemo(() => {
    void lockTick;
    const filtered = players.filter((p) => {
      if (p.isArchived) return false;
      const matchTag = !selectedTag || (p.tags && p.tags.includes(selectedTag));
      const matchName =
        !searchNameInput ||
        (p.name || '').toLowerCase().includes(searchNameInput.toLowerCase());
      return matchTag && matchName;
    });
    return sortPlayers(filtered, sortMode);
  }, [players, selectedTag, searchNameInput, sortMode, lockTick]);

  const handleStart = () => {
    playDecideSoundExternal(playDecideSound);
    preloadImages([optimizedAssetUrl('/mall_home_bg.png')]);
    setShowPlayerModal(true);
    setModalTab('players');
    if (players.length === 0) {
      setListLoading(true);
    }
    if (!cloudSyncing) {
      loadPlayers({ showSpinner: players.length === 0 });
    }
  };

  const handleCreatePlayer = async () => {
    if (!newPlayerName.trim()) return;
    const id = 'player_' + Date.now();
    const newData = {
      name: newPlayerName.trim(),
      points: 0,
      collection: {},
      achievements: ['rookie'],
      currentTitle: 'rookie',
      backgrounds: ['default'],
      currentBackground: 'default',
      unlockedBgms: ['default'],
      currentBgm: 'default',
      unlockedSes: ['default'],
      currentSe: 'default',
      specialTickets: 0,
      legendTickets: 0,
      bgmTickets: 0,
      seTickets: 0,
      playCount: 0,
      specialWordTriggered: false,
      isCloudSync: true,
    };
    await saveCloudPlayer(id, newData);
    await persistPlayerLocally(id, { ...newData, id });
    setNewPlayerName('');
    setShowNewPlayer(false);
    await loadPlayers();
  };

  const handleSelect = (player) => {
    if (isBulkTagMode) {
      toggleBulkPlayer(player.id);
      return;
    }
    playDecideSoundExternal(playDecideSound);
    setPendingTakeover(isPlayerLockedElsewhere(player, getDeviceSessionId()));
    setPendingPlayer(player);
  };

  const handleConfirmSelect = () => {
    if (!pendingPlayer) return;
    playDecideSoundExternal(playDecideSound);
    const player = pendingPlayer;
    setPendingPlayer(null);
    setPendingTakeover(false);
    onSelectPlayer(player);
    setShowPlayerModal(false);
  };

  return (
    <>
      <main className="relative w-full h-[100dvh] min-h-0 flex flex-col items-center px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] overflow-hidden animate-fade-in">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${optimizedAssetUrl('/title_bg.png')})` }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-sky-100/30 via-transparent to-indigo-100/40 pointer-events-none"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center w-full max-w-[min(500px,94vw)] flex-1 min-h-0 justify-center gap-2 sm:gap-3 landscape:gap-1.5">
          <h1 className="w-full min-h-0 max-h-[calc(100dvh-7.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] landscape:max-h-[calc(100dvh-5.75rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex items-center justify-center shrink transition-all hover:scale-[1.02] active:scale-[0.98] duration-300 select-none animate-pop-out">
            <img
              src={optimizedAssetUrl('/logo.png')}
              alt="ガチャっとタイピング！"
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-2xl"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              style={{
                filter:
                  'drop-shadow(3px 0 0 white) drop-shadow(-3px 0 0 white) drop-shadow(0 3px 0 white) drop-shadow(0 -3px 0 white) drop-shadow(2px 2px 0 white) drop-shadow(-2px 2px 0 white) drop-shadow(2px -2px 0 white) drop-shadow(-2px -2px 0 white) drop-shadow(0 8px 16px rgba(0,0,0,0.2))',
              }}
            />
          </h1>

          <div className="shrink-0 w-full max-w-xs bg-white/95 backdrop-blur-sm border-[5px] sm:border-[6px] border-white rounded-3xl shadow-[0_12px_32px_rgba(0,0,0,0.18)] p-3.5 sm:p-5 text-center">
            <button
              type="button"
              onClick={handleStart}
              disabled={prefetching && players.length === 0}
              className="w-full premium-button bg-sky-500 hover:bg-sky-600 disabled:bg-sky-400 disabled:cursor-wait text-white text-lg sm:text-xl py-3 sm:py-3.5 shadow-lg flex justify-center items-center gap-1.5 active:scale-95 transition-transform font-black"
            >
              {prefetching && players.length === 0 ? (
                <>
                  <RefreshCcw className="w-5 h-5 animate-spin" />
                  セーブを よみこみ中...
                </>
              ) : (
                'スタート！'
              )}
            </button>
          </div>
        </div>
      </main>

      {showPlayerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="glass-card bg-white/95 w-full max-w-6xl p-3 sm:p-4 max-h-[95vh] flex flex-col shadow-2xl rounded-3xl relative overflow-hidden">
            {/* ヘッダー */}
            <div className="flex flex-col gap-2 mb-2 shrink-0">
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      playDecideSoundExternal(playDecideSound);
                      setModalTab('players');
                    }}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                      modalTab === 'players'
                        ? 'bg-indigo-500 text-white shadow-md border-b-2 border-indigo-700'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    👤 だれがあそぶ？
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playDecideSoundExternal(playDecideSound);
                      setModalTab('admin');
                    }}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                      modalTab === 'admin'
                        ? 'bg-orange-500 text-white shadow-md border-b-2 border-orange-700'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    ⚙️ 管理者
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPlayerModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors shrink-0"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {modalTab === 'players' && (
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide py-0.5">
                  <div className="relative flex items-center w-[132px] sm:w-[152px] shrink-0">
                    <span className="absolute left-2.5 text-gray-400">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="おなまえ検索..."
                      value={searchNameInput}
                      onChange={(e) => setSearchNameInput(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border-2 border-indigo-100 focus:border-indigo-400 focus:bg-white rounded-xl text-[11px] font-bold text-gray-700 outline-none transition-all shadow-sm"
                    />
                    {searchNameInput && (
                      <button
                        type="button"
                        onClick={() => setSearchNameInput('')}
                        className="absolute right-2 p-0.5 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        playDecideSoundExternal(playDecideSound);
                        setSelectedTag('');
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all shadow-sm border shrink-0 cursor-pointer ${
                        !selectedTag
                          ? 'bg-indigo-500 text-white border-indigo-500'
                          : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                      }`}
                    >
                      すべて
                    </button>
                    {allTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          playDecideSoundExternal(playDecideSound);
                          setSelectedTag(selectedTag === tag ? '' : tag);
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all shadow-sm border shrink-0 cursor-pointer ${
                          selectedTag === tag
                            ? 'bg-indigo-500 text-white border-indigo-500'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <select
                    id="player-sort"
                    value={sortMode}
                    onChange={(e) => {
                      playDecideSoundExternal(playDecideSound);
                      setSortMode(e.target.value);
                    }}
                    className="shrink-0 w-[118px] sm:w-[138px] py-1.5 px-2 bg-gray-50 border-2 border-indigo-100 focus:border-indigo-400 focus:bg-white rounded-xl text-[10px] font-bold text-gray-700 outline-none transition-all shadow-sm cursor-pointer"
                    aria-label="並び替え"
                  >
                    {PLAYER_SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      playDecideSoundExternal(playDecideSound);
                      setShowTagManagePanel(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-[10px] sm:text-xs rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <Tag className="w-3.5 h-3.5" /> タグ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playDecideSoundExternal(playDecideSound);
                      setShowNewPlayer(true);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-[10px] sm:text-xs rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" /> 新規作成
                  </button>
                </div>
              )}
            </div>

            {/* コンテンツ */}
            <div className="flex-1 min-h-0 flex flex-col">
              {loadNotice && modalTab === 'players' && !listLoading && (
                <div className="mb-2 shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800">
                  {loadNotice}
                </div>
              )}
              {cloudSyncing && modalTab === 'players' && !listLoading && filteredPlayers.length > 0 && (
                <div className="mb-2 shrink-0 flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-[11px] font-bold text-sky-700">
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin shrink-0" />
                  クラウドの セーブを 更新しています…
                </div>
              )}
              {modalTab === 'players' ? (
                listLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500 font-bold gap-3 py-12">
                    <RefreshCcw className="w-10 h-10 animate-spin text-sky-500" />
                    <p className="text-sm sm:text-base">セーブデータを よみこんでいます…</p>
                  </div>
                ) : filteredPlayers.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 font-bold gap-2">
                    <User className="w-10 h-10 opacity-40" />
                    <p>プレイヤーが見つかりません</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 pr-1 pb-4">
                    {filteredPlayers.map((p) => (
                      <PlayerCard
                        key={p.id}
                        player={p}
                        onClick={() => handleSelect(p)}
                        onTagClick={isBulkTagMode ? undefined : openSingleTagEdit}
                        isLockedElsewhere={isPlayerLockedElsewhere(p, getDeviceSessionId())}
                        bulkSelectMode={isBulkTagMode}
                        bulkSelected={bulkSelectedPlayerIds.includes(p.id)}
                        onBulkToggle={() => toggleBulkPlayer(p.id)}
                      />
                    ))}
                  </div>
                )
              ) : (
                <AdminPanel
                  players={players}
                  onReloadPlayers={loadPlayers}
                  onBack={() => {
                    playDecideSoundExternal(playDecideSound);
                    setModalTab('players');
                  }}
                  playDecideSound={() => playDecideSoundExternal(playDecideSound)}
                />
              )}
            </div>

            {isBulkTagMode && modalTab === 'players' && (
              <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-white/95 backdrop-blur-md border border-indigo-100 rounded-2xl p-2.5 shadow-lg">
                <div className="text-xs sm:text-sm font-black text-indigo-800">
                  {bulkSelectedPlayerIds.length}人 えらんだよ
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkSelectedPlayerIds(filteredPlayers.map((player) => player.id))}
                    className="px-2 py-1 bg-white border border-indigo-200 rounded-lg text-[10px] font-bold text-indigo-600 hover:bg-indigo-50"
                  >
                    すべて
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkSelectedPlayerIds([])}
                    className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500 hover:bg-gray-50"
                  >
                    はずす
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBulkTagMode(false);
                      setBulkSelectedPlayerIds([]);
                    }}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-black text-xs rounded-xl"
                  >
                    やめる
                  </button>
                  <button
                    type="button"
                    disabled={bulkSelectedPlayerIds.length === 0}
                    onClick={openBulkTagEdit}
                    className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-black text-xs rounded-xl shadow-md"
                  >
                    タグを決定
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showTagManagePanel && (
        <TagManagePanel
          allTags={allTags}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
          newTagInput={newTagInput}
          onNewTagInputChange={setNewTagInput}
          onCreateTag={handleCreateMasterTag}
          onDeleteTag={handleDeleteTagEverywhere}
          onStartBulkTagMode={() => {
            setShowTagManagePanel(false);
            setIsBulkTagMode(true);
            setBulkSelectedPlayerIds([]);
            playDecideSoundExternal(playDecideSound);
          }}
          onClose={() => setShowTagManagePanel(false)}
        />
      )}

      <PlayerTagEditModal
        isOpen={!!tagEditTarget}
        title={tagEditTarget?.title || ''}
        subtitle={tagEditTarget?.subtitle || ''}
        availableTags={allTags}
        initialTags={tagEditTarget?.initialTags || []}
        mode={tagEditTarget?.mode || 'set'}
        onClose={() => setTagEditTarget(null)}
        onSave={handleSavePlayerTags}
      />

      {showNewPlayer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col gap-6 animate-pop-out">
            <h2 className="text-2xl font-black text-center text-gray-800">あたらしくつくる</h2>
            <p className="text-gray-600 text-center text-sm font-bold">なまえをいれてね！</p>
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="なまえ"
              className="w-full text-center text-2xl p-4 bg-gray-100 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:outline-none focus:ring-4 ring-sky-200 transition-all font-bold"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePlayer()}
            />
            <div className="flex gap-4 mt-2">
              <button
                type="button"
                onClick={() => setShowNewPlayer(false)}
                className="flex-1 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-lg transition-colors"
              >
                やめる
              </button>
              <button
                type="button"
                onClick={handleCreatePlayer}
                disabled={!newPlayerName.trim()}
                className="flex-1 py-4 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-xl font-bold text-lg shadow-lg transition-all"
              >
                けってい
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!pendingPlayer}
        title={pendingTakeover ? 'ほかの端末で あそんでいます' : 'このデータではじめますか？'}
        message={
          pendingPlayer
            ? pendingTakeover
              ? `「${pendingPlayer.name}」さんは ほかの端末で あそんでいるみたい。\nこの端末に 切り替えて あそびますか？`
              : `「${pendingPlayer.name}」さんの\nセーブデータで あそびますか？`
            : ''
        }
        confirmLabel={pendingTakeover ? '切り替える！' : 'はじめる！'}
        cancelLabel="やめる"
        confirmClassName="bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600"
        onCancel={() => {
          setPendingPlayer(null);
          setPendingTakeover(false);
        }}
        onConfirm={handleConfirmSelect}
      />
    </>
  );
}
