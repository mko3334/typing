import React from 'react';
import { RefreshCcw } from 'lucide-react';
import PlayerCard from './PlayerCard';

export function SaveLoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-sky-500/90 backdrop-blur-sm z-[80] flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="text-white text-5xl mb-4 animate-bounce">☁️</div>
      <h2 className="text-white text-xl md:text-2xl font-black mb-2">クラウドに セーブ中...</h2>
      <RefreshCcw className="w-8 h-8 text-white animate-spin" />
    </div>
  );
}

export default function SaveCompleteModal({ player, onConfirm }) {
  if (!player) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="glass-card bg-white/95 w-full max-w-md p-5 sm:p-6 shadow-2xl rounded-3xl relative animate-pop-out">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">☁️</div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-800">セーブ完了！</h2>
          <p className="text-sm font-bold text-gray-500 mt-1">
            クラウドに こう セーブされました
          </p>
        </div>

        <PlayerCard player={player} readOnly />

        <button
          type="button"
          onClick={onConfirm}
          className="premium-button w-full mt-5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-black text-lg py-3 rounded-2xl active:scale-95 transition-transform shadow-md"
        >
          OK
        </button>
      </div>
    </div>
  );
}
