import React from 'react';

function GiftItem({ icon, label }) {
  return (
    <div className="flex items-center gap-2 font-black text-gray-700 bg-white/80 p-2 rounded-xl border border-orange-100">
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export default function GiftRewardModal({ gift, onAccept, playDecideSound }) {
  if (!gift) return null;

  const hasRewards =
    (gift.points || 0) > 0 ||
    (gift.specialTickets || 0) > 0 ||
    (gift.legendTickets || 0) > 0 ||
    (gift.bgmTickets || 0) > 0 ||
    (gift.seTickets || 0) > 0;

  const handleAccept = () => {
    playDecideSound?.();
    onAccept?.();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card bg-white/95 w-full max-w-md p-6 shadow-2xl rounded-3xl border-4 border-yellow-400 text-center animate-pop-out">
        <span className="text-6xl block mb-3 animate-bounce">🎉 🎁 🎉</span>
        <h3 className="text-xl sm:text-2xl font-black text-yellow-600 mb-1 animate-pulse">
          プレゼントが とどいたよ！
        </h3>
        <p className="text-xs text-gray-500 font-bold mb-4">かんりしゃ から プレゼントが おくられたよ！</p>

        {gift.message && (
          <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl mb-4 text-center">
            <span className="text-[10px] text-yellow-600 font-black block mb-1">
              💬 かんりしゃ からの メッセージ
            </span>
            <p className="text-sm font-black text-gray-800 break-words whitespace-pre-wrap">
              「 {gift.message} 」
            </p>
          </div>
        )}

        {hasRewards && (
          <div className="space-y-2 mb-5 text-left">
            {(gift.points || 0) > 0 && <GiftItem icon="🪙" label={`ポイント × ${gift.points}`} />}
            {(gift.specialTickets || 0) > 0 && (
              <GiftItem icon="🎨" label={`はいけいチケット × ${gift.specialTickets}`} />
            )}
            {(gift.legendTickets || 0) > 0 && (
              <GiftItem icon="🌟" label={`超激レア以上チケット × ${gift.legendTickets}`} />
            )}
            {(gift.bgmTickets || 0) > 0 && (
              <GiftItem icon="🎵" label={`おんがくチケット × ${gift.bgmTickets}`} />
            )}
            {(gift.seTickets || 0) > 0 && (
              <GiftItem icon="🔊" label={`こうかおんチケット × ${gift.seTickets}`} />
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleAccept}
          className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-black text-base rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>😆</span> うけとる！ <span>🙌</span>
        </button>
      </div>
    </div>
  );
}
