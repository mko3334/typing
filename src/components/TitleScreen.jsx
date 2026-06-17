import React, { useState, useEffect, useMemo } from 'react';
import { User, Plus, Search, X, Tag } from 'lucide-react';
import { loadAllCloudPlayers, saveCloudPlayer } from '../firebase';
import localforage from 'localforage';
import PlayerCard from './PlayerCard';
import AdminPanel from './AdminPanel';
import { enrichPlayer } from '../utils/player';

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
    default:
      return copy.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
  }
}

export const PLAYER_SORT_OPTIONS = [
  { value: 'name-asc', label: 'あいうえお順（昇順）' },
  { value: 'name-desc', label: 'あいうえお順（降順）' },
  { value: 'recent-desc', label: '最近プレイ（新しい順）' },
  { value: 'recent-asc', label: '最近プレイ（古い順）' },
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
  const [loading, setLoading] = useState(true);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [modalTab, setModalTab] = useState('players');
  const [searchNameInput, setSearchNameInput] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [sortMode, setSortMode] = useState('name-asc');

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    if (showPlayerModal) {
      loadPlayers();
    }
  }, [showPlayerModal]);

  useEffect(() => {
    if (showPlayerModal && modalTab === 'admin') {
      loadPlayers();
    }
  }, [showPlayerModal, modalTab]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const cloudPlayersMap = await loadAllCloudPlayers();
      const list = [];

      if (cloudPlayersMap) {
        Object.entries(cloudPlayersMap).forEach(([docId, data]) => {
          if (!data?.name) return;
          list.push(enrichPlayer(docId, data));
        });
      }

      setPlayers(dedupePlayersByName(list));
    } catch (e) {
      console.error(e);
      setPlayers([]);
    }
    setLoading(false);
  };

  const allTags = useMemo(() => {
    const tags = new Set();
    players.forEach((p) => (p.tags || []).forEach((t) => tags.add(t)));
    return [...tags].sort();
  }, [players]);

  const filteredPlayers = useMemo(() => {
    const filtered = players.filter((p) => {
      if (p.isArchived) return false;
      const matchTag = !selectedTag || (p.tags && p.tags.includes(selectedTag));
      const matchName =
        !searchNameInput ||
        (p.name || '').toLowerCase().includes(searchNameInput.toLowerCase());
      return matchTag && matchName;
    });
    return sortPlayers(filtered, sortMode);
  }, [players, selectedTag, searchNameInput, sortMode]);

  const handleStart = () => {
    playDecideSoundExternal(playDecideSound);
    setShowPlayerModal(true);
    setModalTab('players');
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
    await localforage.setItem('player_data_' + id, newData);
    setNewPlayerName('');
    setShowNewPlayer(false);
    await loadPlayers();
  };

  const handleSelect = (player) => {
    playDecideSoundExternal(playDecideSound);
    onSelectPlayer(player);
  };

  return (
    <>
      <main className="relative w-full h-[100dvh] min-h-0 flex flex-col items-center px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] overflow-hidden animate-fade-in">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/title_bg.png)' }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-sky-100/30 via-transparent to-indigo-100/40 pointer-events-none"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col items-center w-full max-w-[min(500px,94vw)] flex-1 min-h-0 justify-center gap-2 sm:gap-3 landscape:gap-1.5">
          <h1 className="w-full min-h-0 max-h-[calc(100dvh-7.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] landscape:max-h-[calc(100dvh-5.75rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex items-center justify-center shrink transition-all hover:scale-[1.02] active:scale-[0.98] duration-300 select-none animate-pop-out">
            <img
              src="/logo.png"
              alt="ガチャっとタイピング！"
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-2xl"
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
              className="w-full premium-button bg-sky-500 hover:bg-sky-600 text-white text-lg sm:text-xl py-3 sm:py-3.5 shadow-lg flex justify-center items-center gap-1.5 active:scale-95 transition-transform font-black"
            >
              スタート！
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
                    onClick={() => playDecideSoundExternal(playDecideSound)}
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
              {modalTab === 'players' ? (
                loading ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">
                    よみこみ中...
                  </div>
                ) : filteredPlayers.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 font-bold gap-2">
                    <User className="w-10 h-10 opacity-40" />
                    <p>プレイヤーが見つかりません</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 pr-1 pb-4">
                    {filteredPlayers.map((p) => (
                      <PlayerCard key={p.id} player={p} onClick={() => handleSelect(p)} />
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
          </div>
        </div>
      )}

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
    </>
  );
}
