import React, { useState } from 'react';

const REASONS = [
  { id: 'wrong_romaji', label: 'うつ ローマ字が おかしい' },
  { id: 'cannot_type', label: '入力が うけつけられない' },
  { id: 'not_suitable', label: 'まなぶのに ふてき' },
  { id: 'other', label: 'その他' },
];

export default function TypingProblemReportModal({
  isOpen,
  wordLabel,
  onCancel,
  onConfirm,
  submitting = false,
}) {
  const [reason, setReason] = useState('wrong_romaji');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card bg-white/95 w-full max-w-md p-6 shadow-2xl rounded-3xl border-4 border-amber-400 text-center animate-pop-out">
        <span className="text-5xl block mb-2">🚨</span>
        <h3 className="text-lg font-black text-gray-800 mb-1">問題を ほうこく</h3>
        <p className="text-xs font-bold text-gray-500 mb-4">
          「{wordLabel}」の 問題を 管理者に お知らせします。
          <br />
          ほうこくしたら べつの 問題に かわります。
        </p>

        <div className="text-left space-y-2 mb-5">
          <p className="text-xs font-black text-amber-700">どんな 問題？</p>
          {REASONS.map((item) => (
            <label
              key={item.id}
              className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                reason === item.id
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-gray-100 bg-white hover:border-amber-200'
              }`}
            >
              <input
                type="radio"
                name="report-reason"
                value={item.id}
                checked={reason === item.id}
                onChange={() => setReason(item.id)}
                className="accent-amber-500"
              />
              <span className="text-sm font-bold text-gray-700">{item.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 disabled:opacity-60 text-gray-700 font-black text-sm rounded-2xl"
          >
            やめる
          </button>
          <button
            type="button"
            onClick={() => onConfirm?.(reason)}
            disabled={submitting}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-black text-sm rounded-2xl shadow-lg"
          >
            {submitting ? '送信中...' : '🚨 ほうこくする'}
          </button>
        </div>
      </div>
    </div>
  );
}
