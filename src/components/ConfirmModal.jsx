import React from 'react';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'もどる（キャンセル）',
  onConfirm,
  onCancel,
  confirmClassName = 'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600',
}) {
  if (!isOpen) return null;

  const showCancel = cancelLabel != null && cancelLabel !== '';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card bg-white/95 w-full max-w-md p-6 shadow-2xl rounded-3xl relative animate-pop-out">
        <h2 className="text-xl sm:text-2xl font-black text-gray-800 text-center mb-3">{title}</h2>
        <p className="text-sm sm:text-base font-bold text-gray-600 text-center leading-relaxed whitespace-pre-line">
          {message}
        </p>
        <div className={`flex gap-3 mt-6 ${showCancel ? '' : 'justify-center'}`}>
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="premium-button flex-1 bg-gradient-to-r from-gray-300 to-gray-400 hover:from-gray-400 hover:to-gray-500 text-white font-black py-3 rounded-2xl active:scale-95 transition-transform shadow-sm text-center"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`premium-button ${showCancel ? 'flex-1' : 'w-full max-w-xs'} text-white font-black py-3 rounded-2xl active:scale-95 transition-transform shadow-md text-center ${confirmClassName}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
