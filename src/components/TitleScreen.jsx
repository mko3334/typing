import React, { useState, useEffect, useMemo } from 'react';
import { User, Plus, Search, X, Tag } from 'lucide-react';
import { loadAllCloudPlayers, saveCloudPlayer } from '../firebase';
import localforage from 'localforage';
import PlayerCard from './PlayerCard';

function enrichPlayer(id, data) {
  const collection = data.collection || {};
  const ownedCount = Object.keys(collection).filter((k) => collection[k] > 0).length;
  return {
    id,
    name: data.name,
    points: data.points || 0,
    collection,
    collectionCount: ownedCount,
    currentTitle: data.currentTitle || 'rookie',
    currentIcon: data.currentIcon || null,
    currentBackground: data.currentBackground || 'default',
    currentBgm: data.currentBgm || 'default',
    currentSe: data.currentSe || 'default',
    unlockedBgms: Array.isArray(data.unlockedBgms) ? data.unlockedBgms : ['default'],
    unlockedSes: Array.isArray(data.unlockedSes) ? data.unlockedSes : ['default'],
    achievements: Array.isArray(data.achievements) ? data.achievements : ['rookie'],
    backgrounds: Array.isArray(data.backgrounds) ? data.backgrounds : ['default'],
    currentTitle: data.currentTitle || 'rookie',
    currentIcon: data.currentIcon ?? null,
    assistSettings: data.assistSettings || null,
    specialTickets: data.specialTickets || 0,
    legendTickets: data.legendTickets || 0,
    bgmTickets: data.bgmTickets || 0,
    seTickets: data.seTickets || 0,
    newItems: data.newItems || [],
    tags: data.tags || [],
    isArchived: data.isArchived || false,
    lastUpdatedAt: data.lastUpdatedAt || null,
  };
}

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

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      const cloudPlayersMap = await loadAllCloudPlayers();
      const list = [];

      if (cloudPlayersMap) {
        Object.entries(cloudPlayersMap).forEach(([docId, data]) => {
          if (!data?.name || data.isArchived) return;
          list.push(enrichPlayer(docId, data));
        });
      }

      list.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
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
    return players.filter((p) => {
      const matchTag = !selectedTag || (p.tags && p.tags.includes(selectedTag));
      const matchName =
        !searchNameInput ||
        (p.name || '').toLowerCase().includes(searchNameInput.toLowerCase());
      return matchTag && matchName;
    });
  }, [players, selectedTag, searchNameInput]);

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
      <main className="w-full min-h-screen flex flex-col items-center justify-center py-6 px-4 animate-fade-in">
        <h1 className="w-full max-w-[340px] sm:max-w-[460px] md:max-w-[500px] mb-8 transition-all hover:scale-105 active:scale-95 duration-300 flex flex-col items-center select-none animate-pop-out">
          <img
            src="/logo.png"
            alt="ガチャっとタイピング！"
            className="w-full h-auto rounded-2xl"
            style={{
              filter:
                'drop-shadow(3px 0 0 white) drop-shadow(-3px 0 0 white) drop-shadow(0 3px 0 white) drop-shadow(0 -3px 0 white) drop-shadow(2px 2px 0 white) drop-shadow(-2px 2px 0 white) drop-shadow(2px -2px 0 white) drop-shadow(-2px -2px 0 white) drop-shadow(0 8px 16px rgba(0,0,0,0.2))',
            }}
          />
        </h1>

        <div className="bg-white border-[6px] border-white rounded-3xl shadow-[0_12px_32px_rgba(0,0,0,0.15)] p-5 sm:p-6 text-center w-full max-w-xs flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={handleStart}
            className="w-full premium-button bg-sky-500 hover:bg-sky-600 text-white text-xl py-3.5 shadow-lg flex justify-center items-center gap-1.5 active:scale-95 transition-transform font-black"
          >
            スタート！
          </button>
        </div>
      </main>

      {showPlayerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="glass-card bg-white/95 w-full max-w-6xl p-4 sm:p-6 max-h-[92vh] flex flex-col shadow-2xl rounded-3xl relative overflow-hidden">
            {/* ヘッダー */}
            <div className="flex flex-col gap-3 mb-4 shrink-0">
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      playDecideSoundExternal(playDecideSound);
                      setModalTab('players');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
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
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                      modalTab === 'admin'
                        ? 'bg-orange-500 text-white shadow-md border-b-2 border-orange-700'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    ⚙️ 管理者モード
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
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="relative flex items-center w-full sm:max-w-xs shrink-0">
                    <span className="absolute left-3 text-gray-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="おなまえ検索..."
                      value={searchNameInput}
                      onChange={(e) => setSearchNameInput(e.target.value)}
                      className="w-full pl-9 pr-8 py-1.5 bg-gray-50 border-2 border-indigo-100 focus:border-indigo-400 focus:bg-white rounded-xl text-xs font-bold text-gray-700 outline-none transition-all shadow-sm"
                    />
                    {searchNameInput && (
                      <button
                        type="button"
                        onClick={() => setSearchNameInput('')}
                        className="absolute right-2.5 p-0.5 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    )}
                  </div>

                  {allTags.length > 0 && (
                    <div className="flex items-center gap-1 overflow-x-auto max-w-full py-0.5 px-1 scroll-smooth shrink-0 scrollbar-hide">
                      <button
                        type="button"
                        onClick={() => {
                          playDecideSoundExternal(playDecideSound);
                          setSelectedTag('');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all shadow-sm border shrink-0 cursor-pointer ${
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
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all shadow-sm border shrink-0 cursor-pointer ${
                            selectedTag === tag
                              ? 'bg-indigo-500 text-white border-indigo-500'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* コンテンツ */}
            <div className="flex-1 min-h-0 flex flex-col relative pb-14">
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
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
                  <span className="text-4xl mb-3">⚙️</span>
                  <p className="font-black text-gray-600 mb-1">管理者モード</p>
                  <p className="text-xs font-bold">この機能は復元作業中です</p>
                </div>
              )}
            </div>

            {modalTab === 'players' && (
              <div className="absolute bottom-0 left-0 z-20 flex gap-2 shrink-0 bg-white/80 backdrop-blur-md p-2 rounded-2xl border border-gray-100 shadow-sm">
                <button
                  type="button"
                  onClick={() => playDecideSound()}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-sm rounded-2xl shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Tag className="w-4 h-4" /> タグ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playDecideSoundExternal(playDecideSound);
                    setShowNewPlayer(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-sm rounded-2xl shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> 新規作成
                </button>
              </div>
            )}
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
