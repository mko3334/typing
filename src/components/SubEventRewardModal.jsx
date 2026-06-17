import React from 'react';
import FuriganaText from './FuriganaText';

const TICKET_LABELS = {
  legend: '🌟 超激レア以上チケット',
  se: '🔊 こうかおんガチャチケット',
  bgm: '🎵 おんがくガチャチケット',
  special: '🎨 はいけいガチャチケット',
};

export default function SubEventRewardModal({ reward, onClose, playDecideSound }) {
  if (!reward) return null;

  const handleClose = () => {
    playDecideSound?.();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] animate-fade-in">
      <div className="bg-white border-8 border-yellow-400 p-8 rounded-3xl text-center max-w-sm w-full mx-4 shadow-2xl relative animate-pop-out">
        <div className="relative z-10 space-y-5">
          {reward.image ? (
            <div className="mx-auto w-24 h-24 rounded-2xl border-4 border-yellow-300 overflow-hidden shadow-md bg-white">
              <img src={reward.image} alt={reward.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="text-4xl">{reward.emoji || '🤝'}</div>
          )}
          <div className="text-xl font-black text-emerald-600">お手伝い ありがとう！</div>
          <p className="text-sm font-bold text-gray-600">
            <FuriganaText>{reward.titleDisplay || reward.title}</FuriganaText>
          </p>
          <div className="text-3xl font-black text-amber-500">
            +{reward.points.toLocaleString()} pt
          </div>

          {reward.ticket && (
            <div className="bg-yellow-50 border-4 border-yellow-300 px-4 py-3 rounded-2xl shadow-inner">
              <div className="text-xs font-bold text-gray-500 mb-1">🎁 ラッキー！</div>
              <div className="text-sm font-black text-purple-700">
                {TICKET_LABELS[reward.ticket.type] || 'チケット'} × {reward.ticket.count}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="premium-button bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-black text-lg px-8 py-3 w-full shadow-lg"
          >
            やったー！
          </button>
        </div>
      </div>
    </div>
  );
}
