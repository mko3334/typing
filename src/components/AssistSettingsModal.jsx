import React from 'react';
import { Sparkles, X } from 'lucide-react';

export default function AssistSettingsModal({ isOpen, settings, onChange, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white/95 w-full max-w-sm p-6 max-h-[90vh] overflow-y-auto rounded-3xl border-4 border-yellow-300 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
            アシストせってい
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex flex-col">
              <span className="font-bold text-gray-700 text-sm sm:text-base">⌨️ つぎのキーをひからせる</span>
              <span className="text-[10px] sm:text-xs text-orange-500 font-bold mt-1">※OFFにするとボーナス＋100pt！</span>
            </div>
            <input
              type="checkbox"
              checked={settings.keyboardHighlight}
              onChange={(e) => onChange('keyboardHighlight', e.target.checked)}
              className="w-5 h-5 accent-yellow-500 shrink-0 ml-2"
            />
          </label>

          <label className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="flex flex-col">
              <span className="font-bold text-gray-700 text-sm sm:text-base">👁️ ローマ字のヒントをだす</span>
              <span className="text-[10px] sm:text-xs text-orange-500 font-bold mt-1">※OFFにするとボーナス＋100pt！</span>
            </div>
            <input
              type="checkbox"
              checked={settings.showRomajiHint}
              onChange={(e) => onChange('showRomajiHint', e.target.checked)}
              className="w-5 h-5 accent-yellow-500 shrink-0 ml-2"
            />
          </label>

          <label className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
            <span className="font-bold text-gray-700 text-sm sm:text-base">🫱 つぎにうつ指（ゆび）をガイドする</span>
            <input
              type="checkbox"
              checked={settings.showFingerGuide}
              onChange={(e) => onChange('showFingerGuide', e.target.checked)}
              className="w-5 h-5 accent-yellow-500"
            />
          </label>

          <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
            <span className="font-bold text-gray-700 text-sm sm:text-base">🔠 もじの おおきさ</span>
            <select
              value={settings.letterCase}
              onChange={(e) => onChange('letterCase', e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-2 sm:px-3 py-1 font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm sm:text-base"
            >
              <option value="lower">abc (小文字)</option>
              <option value="upper">ABC (大文字)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
