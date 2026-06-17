import React from 'react';

export default function TicketRewardModal({ ticketReward, onClose }) {
  if (!ticketReward?.show) return null;

  const ticketLabel =
    ticketReward.type === 'legend'
      ? '🌟 超激レア以上チケット 🌟'
      : ticketReward.type === 'se'
        ? '🔊 こうかおんガチャチケット 🔊'
        : ticketReward.type === 'bgm'
          ? '🎵 おんがくガチャチケット 🎵'
          : '🎨 はいけいガチャチケット 🎨';

  const handleConfirm = () => {
    const onConfirm = ticketReward.onConfirm;
    onClose();
    onConfirm?.();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in pointer-events-auto">
      <div className="bg-white border-8 border-yellow-400 p-8 rounded-3xl text-center max-w-sm w-full mx-4 shadow-2xl relative animate-pop-out">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-100/50 to-transparent pointer-events-none rounded-2xl z-0" />

        <div className="relative z-10 space-y-6">
          <div className="text-2xl font-black text-purple-600 animate-bounce">
            {ticketReward.titleObj ? '🏆 称号ゲット！ 🏆' : '⚡ 激アツ！大せいこう ⚡'}
          </div>

          {ticketReward.titleObj && (
            <div className="bg-yellow-50 border-4 border-yellow-300 px-4 py-3 rounded-2xl shadow-inner">
              <div className="text-xs font-bold text-gray-500 mb-0.5">🏆 あたらしいしょうごうを獲得！</div>
              <div className="text-lg font-black text-gray-800">{ticketReward.titleObj.name}</div>
              <div className="text-[10px] font-bold text-gray-400 mt-0.5">{ticketReward.titleObj.desc}</div>
            </div>
          )}

          <div className="flex justify-center my-4 relative">
            {ticketReward.type === 'legend' ? (
              <div className="w-48 py-8 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 border-4 border-yellow-300 text-white font-black text-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 animate-pulse" />
                <div className="text-5xl mb-2 animate-bounce">🌟🎟️🌟</div>
                <div className="text-xs tracking-wider">ちょうげきレアいじょう</div>
                <div className="text-base mt-1">かくていチケット</div>
              </div>
            ) : ticketReward.type === 'se' ? (
              <div className="w-48 py-8 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 border-4 border-yellow-300 text-white font-black text-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300 relative overflow-hidden">
                <div className="text-5xl mb-2 animate-bounce">🔊👾🔊</div>
                <div className="text-xs tracking-wider">こうかおんの</div>
                <div className="text-base mt-1">ガチャチケット</div>
              </div>
            ) : ticketReward.type === 'bgm' ? (
              <div className="w-48 py-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 border-4 border-yellow-300 text-white font-black text-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300 relative overflow-hidden">
                <div className="text-5xl mb-2 animate-bounce">🎵💿🎵</div>
                <div className="text-xs tracking-wider">おんがくの</div>
                <div className="text-base mt-1">ガチャチケット</div>
              </div>
            ) : (
              <div className="w-48 py-8 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 border-4 border-yellow-300 text-white font-black text-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300 relative overflow-hidden">
                <div className="text-5xl mb-2 animate-bounce">🎨🎟️🎨</div>
                <div className="text-xs tracking-wider">はいけいの</div>
                <div className="text-base mt-1">ガチャチケット</div>
              </div>
            )}
          </div>

          <p className="text-base font-black text-gray-700 leading-snug">
            {ticketLabel}
            <br />
            を {ticketReward.count || 1}まい ゲットしたよ！
          </p>

          <button
            type="button"
            onClick={handleConfirm}
            className="premium-button bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-black text-lg px-8 py-3 w-full shadow-lg"
          >
            {ticketReward.titleObj ? 'やったー！' : 'うけとる！'}
          </button>
        </div>
      </div>
    </div>
  );
}
