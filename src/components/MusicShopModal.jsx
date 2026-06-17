import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { BGM_LIST, SE_LIST } from '../audio';

export default function MusicShopModal({
  isOpen,
  player,
  onClose,
  onConfirm,
  previewBgm,
  playDecideSound,
  playCancelSound,
  previewSe,
}) {
  const [tempBgm, setTempBgm] = useState('default');
  const [tempSe, setTempSe] = useState('default');

  useEffect(() => {
    if (isOpen && player) {
      setTempBgm(player.currentBgm || 'default');
      setTempSe(player.currentSe || 'default');
    }
  }, [isOpen, player]);

  if (!isOpen || !player) return null;

  const unlockedBgms = Array.isArray(player.unlockedBgms) ? player.unlockedBgms : ['default'];
  const unlockedSes = Array.isArray(player.unlockedSes) ? player.unlockedSes : ['default'];

  const handleClose = () => {
    playCancelSound?.();
    previewBgm?.(player.currentBgm || 'default');
    onClose();
  };

  const handleConfirm = () => {
    playDecideSound?.();
    onConfirm?.({ currentBgm: tempBgm, currentSe: tempSe });
    onClose();
  };

  const selectBgm = (id) => {
    setTempBgm(id);
    previewBgm?.(id);
  };

  const selectSe = (id, url) => {
    setTempSe(id);
    previewSe?.(url);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card bg-white/95 w-full max-w-lg p-6 max-h-[90vh] flex flex-col shadow-2xl rounded-3xl relative">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
            <span>🎵</span> おんがく・効果音スキン設定
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <h3 className="text-sm font-bold text-gray-500 mb-3">あつめた おんがく を えらぼう！</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
            {BGM_LIST.map((bgm) => {
              const unlocked = unlockedBgms.includes(bgm.id);
              const isPreviewing = tempBgm === bgm.id;
              return (
                <button
                  key={bgm.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => selectBgm(bgm.id)}
                  className={`p-3 rounded-xl flex items-center gap-3 border-2 text-left relative transition-all ${
                    isPreviewing
                      ? 'bg-yellow-50 border-yellow-400 shadow-md scale-[1.02] z-10'
                      : unlocked
                        ? 'bg-white border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/30 active:scale-95'
                        : 'bg-gray-100 border-gray-200 opacity-50 grayscale cursor-not-allowed'
                  }`}
                >
                  <span className="text-xl shrink-0">{unlocked ? '🎵' : '🔒'}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-black text-xs sm:text-sm text-gray-800 truncate leading-tight mb-0.5">
                      {unlocked ? bgm.name : '？？？？'}
                    </span>
                    {unlocked && isPreviewing && (
                      <span className="text-[9px] font-bold text-yellow-600">さいせいちゅう</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <h3 className="text-sm font-bold text-gray-500 mb-3 border-t pt-4">
            あつめた 効果音スキン を えらぼう！
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-2">
            {SE_LIST.map((se) => {
              const unlocked = unlockedSes.includes(se.id);
              const isSelected = tempSe === se.id;
              return (
                <button
                  key={se.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => selectSe(se.id, se.url)}
                  className={`p-3 rounded-xl flex items-center gap-3 border-2 text-left relative transition-all ${
                    isSelected
                      ? 'bg-cyan-50 border-cyan-400 shadow-md scale-[1.02] z-10'
                      : unlocked
                        ? 'bg-white border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/30 active:scale-95'
                        : 'bg-gray-100 border-gray-200 opacity-50 grayscale cursor-not-allowed'
                  }`}
                >
                  <span className="text-xl shrink-0">{unlocked ? '🔊' : '🔒'}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-black text-xs sm:text-sm text-gray-800 truncate leading-tight mb-0.5">
                      {unlocked ? se.name : '？？？？'}
                    </span>
                    {unlocked && isSelected && (
                      <span className="text-[9px] font-bold text-cyan-600">えらびちゅう</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3 mt-6 shrink-0 pt-4 border-t">
          <button
            type="button"
            onClick={handleClose}
            className="premium-button flex-1 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-white font-black py-3 rounded-2xl active:scale-95 transition-transform shadow-sm text-center"
          >
            もどる（キャンセル）
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="premium-button flex-1 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-black py-3 rounded-2xl active:scale-95 transition-transform shadow-md text-center"
          >
            きまり！
          </button>
        </div>
      </div>
    </div>
  );
}
