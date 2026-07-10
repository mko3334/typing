import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { listenOfficialShowRankings } from '../firebase';
import { GACHA_ITEMS } from '../constants';
import PlayerCard from './PlayerCard';
import GearEquipModal from './GearEquipModal';

export default function CustomAreaModal({ isOpen, onClose, player, playDecideSound, playCancelSound, onPlayCustomStage, onPlayerUpdate }) {
  const [officialRankings, setOfficialRankings] = useState([]);
  const [isGearModalOpen, setIsGearModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    setLoading(true);
    const unsubscribe = listenOfficialShowRankings((rankings) => {
      let currentRankings = [...rankings];
      if (player?.officialShowHighScore > 0) {
        const myScore = player.officialShowHighScore;
        const myIndex = currentRankings.findIndex(r => r.playerId === player.id && r.score >= myScore);
        if (myIndex === -1) {
          currentRankings = currentRankings.filter(r => r.playerId !== player.id);
          currentRankings.push({
            id: `local_high_${Date.now()}`,
            playerId: player.id,
            playerName: player.name,
            score: myScore,
            currentTitle: player.currentTitle || 'rookie',
            currentBackground: player.currentBackground || 'default',
            currentIcon: player.currentIcon || null,
            currentFrame: player.currentFrame || null,
            typingShowGears: player.typingShowGears || null,
          });
          currentRankings = currentRankings.sort((a, b) => b.score - a.score);
        }
      }
      setOfficialRankings(currentRankings.slice(0, 5));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isOpen, player]);

  if (!isOpen) return null;

  const handleClose = () => {
    playCancelSound?.();
    onClose();
  };

  return (
    <>
    <div className="fixed inset-4 sm:inset-8 lg:inset-12 z-50 flex flex-col bg-[url('/show_bg.png')] bg-cover bg-center animate-fade-in rounded-3xl border-4 border-yellow-400 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-amber-800/90 backdrop-blur shadow-xl p-4 shrink-0 flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black text-amber-50 flex items-center gap-2">
          🎭 タイピングショー
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-32 flex items-start justify-center relative">
        {loading ? (
          <div className="text-2xl font-bold text-white drop-shadow-md">よみこみ中...</div>
        ) : (
          <div className="bg-white/90 border-4 border-rose-300 rounded-2xl p-6 shadow-md flex flex-col items-center max-w-4xl w-full relative overflow-hidden">
            <div className="absolute -top-4 -right-4 text-8xl opacity-10 rotate-12 pointer-events-none">🔥</div>
            <h4 className="text-2xl font-black text-rose-600 mb-2 flex items-center gap-2">
              🔥 運営公式チャレンジ 🔥
            </h4>
            <p className="text-gray-600 font-bold mb-4">全難易度からランダム出題！1分間でどれだけ打てるかな？</p>
            
            {officialRankings.length > 0 && (
              <div className="w-full bg-rose-50 rounded-xl p-4 mb-2 border border-rose-100">
                <h5 className="text-sm font-black text-rose-800 mb-2 text-center">🏆 トップ5ランキング</h5>
                <div className="flex flex-col gap-1">
                  {officialRankings.map((r, i) => (
                    <div key={r.id} className="relative flex items-center mb-2">
                      <div className={`absolute -left-2 sm:-left-4 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-white shadow-md border-2 border-white ${i === 0 ? 'bg-yellow-400 text-lg sm:text-xl scale-110' : i === 1 ? 'bg-gray-400 text-base sm:text-lg' : i === 2 ? 'bg-amber-600 text-base sm:text-lg' : 'bg-rose-300 text-sm sm:text-base'}`}>
                        {i + 1}
                      </div>
                      <div className={`flex items-center w-full pl-6 sm:pl-8 gap-2 pr-2 sm:pr-4 ${i === 0 ? 'transform scale-[1.02] origin-left' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <PlayerCard 
                            player={{ ...r, name: r.playerName, points: r.score }} 
                            readOnly 
                            compact={i !== 0}
                            showGears={true}
                            rankingScore={r.score}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed Footer Buttons */}
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 flex justify-center items-center pointer-events-none z-20">
        <div className="flex items-center gap-4 pointer-events-auto flex-wrap justify-center">
          <button
            onClick={() => {
              playDecideSound?.();
              setIsGearModalOpen(true);
            }}
            className="bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white font-black text-lg sm:text-xl px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
          >
            <span>🎒</span> アイテムスキル装備
          </button>
          <button
            onClick={() => {
              playDecideSound?.();
              onPlayCustomStage({ isOfficialShow: true });
            }}
            className="bg-gradient-to-r from-rose-500 to-pink-500 text-white font-black text-lg sm:text-xl px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
          >
            ⚔️ 挑戦する！（1分間）
          </button>
        </div>
      </div>
    </div>
    
    <GearEquipModal
      isOpen={isGearModalOpen}
      player={player}
      onClose={() => setIsGearModalOpen(false)}
      onPlayerUpdate={onPlayerUpdate}
      playDecideSound={playDecideSound}
      playCancelSound={playCancelSound}
    />
    </>
  );
}
