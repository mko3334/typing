import React from 'react';
import { X } from 'lucide-react';
import { DIFFICULTY_OPTIONS, TYPING_EXTRA_MODES } from '../constants';

function ModeButton({ option, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(option.id)}
      className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-white text-base sm:text-lg shadow-lg border-b-4 active:scale-[0.98] active:border-b-0 active:translate-y-1 transition-all bg-gradient-to-r ${option.gradient}`}
    >
      {option.emoji} {option.label}
      <span className="text-sm opacity-90">（{option.sub}）</span>
    </button>
  );
}

export default function DifficultySelector({
  isOpen,
  onSelect,
  onClose,
  playDecideSound,
  playCancelSound,
}) {
  if (!isOpen) return null;

  const handleSelect = (id) => {
    playDecideSound?.();
    onSelect(id);
  };

  const handleClose = () => {
    playCancelSound?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white/98 w-full max-w-sm p-6 sm:p-8 rounded-[2rem] shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <h2 className="text-xl sm:text-2xl font-black text-gray-800 text-center mb-1 pt-1">
          ⌨️ タイピングで あそぶ！
        </h2>
        <p className="text-xs font-bold text-gray-400 text-center mb-5">モードを えらんでね</p>

        <p className="text-[11px] font-black text-sky-600 mb-2 px-1">📝 キーワードタイピング</p>
        <div className="flex flex-col gap-3">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <ModeButton key={opt.id} option={opt} onClick={handleSelect} />
          ))}
        </div>

        <div className="my-5 border-t-2 border-dashed border-gray-200" />

        <p className="text-[11px] font-black text-violet-600 mb-2 px-1">🎯 スペシャルモード</p>
        <div className="flex flex-col gap-3">
          {TYPING_EXTRA_MODES.map((opt) => (
            <ModeButton key={opt.id} option={opt} onClick={handleSelect} />
          ))}
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="w-full mt-5 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-500 font-black text-sm transition-colors"
        >
          もどる
        </button>
      </div>
    </div>
  );
}
