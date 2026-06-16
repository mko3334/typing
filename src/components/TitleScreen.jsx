import React, { useState, useEffect } from 'react';
import { User, Plus, Trash2, Settings, Play } from 'lucide-react';
import { loadAllCloudPlayers, saveCloudPlayer } from '../firebase';
import { BACKGROUNDS, TITLES } from '../constants';

export default function TitleScreen({ onSelectPlayer }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewPlayer, setShowNewPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setLoading(true);
    const loaded = await loadAllCloudPlayers();
    setPlayers(loaded || []);
    setLoading(false);
  };

  const handleCreatePlayer = async () => {
    if (!newPlayerName.trim()) return;
    const newPlayer = {
      id: 'player_' + Date.now(),
      name: newPlayerName.trim(),
      points: 0,
      tickets: 0,
      playCount: 0,
      totalPlayTime: 0,
      lastActiveTime: Date.now(),
      isPlaying: false,
      currentBackground: 'default',
      currentTitle: 'beginner',
      collection: [],
      mallConfig: {}
    };
    await saveCloudPlayer(newPlayer.id, newPlayer);
    setNewPlayerName('');
    setShowNewPlayer(false);
    await loadPlayers();
  };

  const playDecideSound = () => {
    // Implement global decide sound
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center p-4">
      {/* Background Image Setup */}
      <div className="absolute inset-0 z-[-1] pointer-events-none transition-all duration-1000 ease-in-out bg-sky-200">
        <img 
          src="/candy_bg.png" 
          alt="Title Background" 
          className="absolute inset-0 w-full h-full object-cover object-center opacity-80" 
        />
      </div>

      <div className="glass-card p-8 sm:p-12 w-full max-w-4xl flex flex-col items-center gap-8 bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-white/50">
        <h1 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 drop-shadow-md text-center py-2 animate-bounce">
          タイピングアドベンチャー
        </h1>

        <div className="w-full bg-white/50 p-6 rounded-2xl border border-white">
          <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center justify-center gap-2">
            <User className="text-sky-500" /> だれがあそぶ？
          </h2>

          {loading ? (
            <div className="text-center text-gray-500 py-8">よみこみ中...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {players.map(player => {
                const bgItem = BACKGROUNDS.find(b => b.id === (player.currentBackground || 'default')) || BACKGROUNDS[0];
                const titleItem = TITLES.find(t => t.id === (player.currentTitle || 'beginner')) || TITLES[0];

                return (
                  <button
                    key={player.id}
                    onClick={() => {
                      playDecideSound();
                      onSelectPlayer(player);
                    }}
                    className="relative overflow-hidden group flex flex-col items-center p-4 bg-white rounded-2xl shadow-md border-2 border-transparent hover:border-sky-400 hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-30 transition-opacity">
                      <img src={bgItem.url} alt="bg" className="w-full h-full object-cover" />
                    </div>
                    <div className="relative z-10 w-full flex flex-col items-center gap-2">
                      <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm mb-2">
                        <User className="w-8 h-8 text-sky-500" />
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${titleItem.bg} ${titleItem.color}`}>
                        {titleItem.name}
                      </span>
                      <span className="text-xl font-black text-gray-800">{player.name}</span>
                      <div className="flex gap-4 mt-2 text-sm font-bold text-gray-600">
                        <span>🪙 {player.points || 0}</span>
                        <span>🎟️ {player.tickets || 0}</span>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* 新しいプレイヤーを作成するボタン */}
              <button
                onClick={() => setShowNewPlayer(true)}
                className="flex flex-col items-center justify-center p-4 bg-dashed bg-gray-50 border-4 border-dashed border-gray-300 rounded-2xl hover:bg-sky-50 hover:border-sky-300 hover:text-sky-600 transition-colors text-gray-400 gap-3 min-h-[180px]"
              >
                <Plus className="w-12 h-12" />
                <span className="font-bold text-lg">あたらしくつくる</span>
              </button>
            </div>
          )}
        </div>

        {/* 新規プレイヤー作成モーダル */}
        {showNewPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col gap-6 animate-in zoom-in-95">
              <h2 className="text-2xl font-black text-center text-gray-800">あたらしくつくる</h2>
              <p className="text-gray-600 text-center text-sm font-bold">なまえをいれてね！</p>
              
              <input
                type="text"
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                placeholder="なまえ"
                className="w-full text-center text-2xl p-4 bg-gray-100 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:outline-none focus:ring-4 ring-sky-200 transition-all font-bold"
                autoFocus
              />

              <div className="flex gap-4 mt-4">
                <button
                  onClick={() => setShowNewPlayer(false)}
                  className="flex-1 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold text-lg transition-colors"
                >
                  やめる
                </button>
                <button
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

      </div>
    </div>
  );
}
