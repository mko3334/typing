import React from 'react';
import { X } from 'lucide-react';
import { DIFFICULTY_OPTIONS } from '../constants';

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
      <div className="bg-white/98 w-full max-w-sm p-6 sm:p-8 rounded-[2rem] shadow-2xl relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <h2 className="text-xl sm:text-2xl font-black text-gray-800 text-center mb-6 pt-1">
          どの むずかしさ で あそぶ？
        </h2>

        <div className="flex flex-col gap-3">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <div key={opt.id} className="relative">
              {opt.badge && (
                <div
                  className={`absolute -top-2 right-2 z-10 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black shadow-md whitespace-nowrap ${
                    opt.badgeColor === 'pink'
                      ? 'bg-pink-400 text-white'
                      : 'bg-yellow-300 text-yellow-900 border border-yellow-400'
                  }`}
                >
                  {opt.badge}
                </div>
              )}
              <button
                type="button"
                onClick={() => handleSelect(opt.id)}
                className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-white text-base sm:text-lg shadow-lg border-b-4 active:scale-[0.98] active:border-b-0 active:translate-y-1 transition-all bg-gradient-to-r ${opt.gradient}`}
              >
                {opt.emoji} {opt.label}（{opt.sub}）
              </button>
            </div>
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
