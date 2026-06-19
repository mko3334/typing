import React from 'react';
import { User, Book, Music, Sparkles } from 'lucide-react';

function playDecideSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
  } catch {
    /* ignore */
  }
}

export default function GameSidebar({
  player,
  showSaveButton = true,
  onSaveAndTitle,
  onGoHome,
  onShop,
  onProfile,
  onZukan,
  onMusic,
  onAssist,
  onComingSoon,
  assistActive = false,
  showAssist = true,
}) {
  const click = (handler) => {
    playDecideSound();
    handler?.();
  };

  return (
    <aside className="w-20 sm:w-24 bg-white/95 backdrop-blur-md border-r-4 border-yellow-300 flex flex-col items-center py-4 px-1 gap-4 shrink-0 shadow-2xl z-30 overflow-y-auto">
      <div className="w-full flex flex-col items-center gap-2">
        <div className="bg-sky-500 text-white w-full py-1 text-center font-black text-[10px] sm:text-xs rounded-lg shadow-sm truncate px-1">
          {player?.name || 'ゲスト'}
        </div>

        <div className="bg-gradient-to-b from-orange-400 to-amber-500 text-white rounded-xl py-1.5 px-1 text-center w-full shadow-md flex flex-col items-center gap-0 border border-orange-300">
          <span className="text-base sm:text-lg">🪙</span>
          <span className="font-black text-[8px] sm:text-[9px] leading-none text-orange-100">ポイント</span>
          <span className="font-black text-xs sm:text-sm leading-none mt-1">{player?.points || 0}</span>
        </div>

        <div className="w-full flex flex-col gap-1 bg-white/85 border border-orange-100 rounded-xl p-1 shadow-sm">
          <span className="text-[7px] font-black text-orange-600 text-center mb-0.5">🎟️ チケット</span>
          <div className="flex flex-col gap-0.5 text-[8px] sm:text-[9px] font-black text-gray-700">
            <div className="flex justify-between items-center bg-sky-50 rounded px-1 py-0.5">
              <span className="truncate">🎨 背景</span>
              <span className="text-sky-600 shrink-0">✖{player?.specialTickets || 0}</span>
            </div>
            <div className="flex justify-between items-center bg-emerald-50 rounded px-1 py-0.5">
              <span className="truncate">🎵 音楽</span>
              <span className="text-emerald-600 shrink-0">✖{player?.bgmTickets || 0}</span>
            </div>
            <div className="flex justify-between items-center bg-cyan-50 rounded px-1 py-0.5">
              <span className="truncate">🔊 効果音</span>
              <span className="text-cyan-600 shrink-0">✖{player?.seTickets || 0}</span>
            </div>
            <div className="flex justify-between items-center bg-fuchsia-50 rounded px-1 py-0.5">
              <span className="truncate">🌟 超激レア</span>
              <span className="text-fuchsia-600 shrink-0">✖{player?.legendTickets || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full items-center">
        {showSaveButton && (
          <button
            type="button"
            onClick={() => click(onSaveAndTitle)}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border-2 border-gray-200 shadow-md hover:scale-105 flex flex-col items-center justify-center text-[8px] sm:text-[9px] leading-tight font-black text-gray-500 gap-0.5 active:scale-95 transition-transform"
          >
            <span className="text-xl">🚪</span>
            <span className="text-center">
              セーブして
              <br />
              タイトルへ
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => click(onGoHome)}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border-2 border-yellow-300 shadow-md hover:scale-105 flex flex-col items-center justify-center text-[9px] sm:text-[10px] font-black text-yellow-600 gap-1 active:scale-95 transition-transform"
        >
          <span className="text-xl">🏠</span>
          <span>ひろばへ</span>
        </button>

        <button
          type="button"
          onClick={() => click(onShop || onComingSoon)}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-orange-400 text-white border-2 border-pink-200 shadow-md hover:scale-105 flex flex-col items-center justify-center text-[9px] sm:text-[10px] font-black gap-1 active:scale-95 transition-transform"
        >
          <span className="text-xl animate-pulse">🎁</span>
          <span>ショップ</span>
        </button>

        <button
          type="button"
          onClick={() => click(onProfile || onComingSoon)}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border-2 border-green-200 text-green-500 shadow-md hover:scale-105 flex flex-col items-center justify-center text-[9px] sm:text-[10px] font-black gap-1 active:scale-95 transition-transform"
        >
          <User className="w-5 h-5 shrink-0" />
          <span>へんこう</span>
        </button>

        <button
          type="button"
          onClick={() => click(onZukan || onComingSoon)}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border-2 border-orange-200 text-orange-500 shadow-md hover:scale-105 flex flex-col items-center justify-center text-[9px] sm:text-[10px] font-black gap-1 active:scale-95 transition-transform relative"
        >
          <Book className="w-5 h-5 shrink-0" />
          <span>ずかん</span>
          {player?.newItems?.length > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => click(onMusic || onComingSoon)}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border-2 border-emerald-200 text-emerald-500 shadow-md hover:scale-105 flex flex-col items-center justify-center text-[9px] sm:text-[10px] font-black gap-1 active:scale-95 transition-transform"
        >
          <Music className="w-5 h-5 shrink-0 animate-pulse" style={{ animationDuration: '3s' }} />
          <span>おんがく</span>
        </button>

        {showAssist && (
        <button
          type="button"
          onClick={() => click(onAssist || onComingSoon)}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 shadow-md hover:scale-105 flex flex-col items-center justify-center text-[8px] sm:text-[9px] font-black gap-0.5 active:scale-95 transition-transform ${
            assistActive
              ? 'bg-yellow-400 text-yellow-900 border-yellow-300 ring-2 ring-yellow-300 scale-105'
              : 'bg-yellow-400 text-yellow-900 border-yellow-200'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
          <span>アシスト</span>
        </button>
        )}
      </div>
    </aside>
  );
}
