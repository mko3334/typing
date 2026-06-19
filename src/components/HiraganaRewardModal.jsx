import React from 'react';
import { getUnlockedTitleObjects } from '../utils/hiraganaRewards';

const TICKET_ENTRIES = [
  { key: 'specialTickets', label: '🎨 はいけいガチャチケット' },
  { key: 'bgmTickets', label: '🎵 おんがくガチャチケット' },
  { key: 'seTickets', label: '🔊 こうかおんガチャチケット' },
  { key: 'legendTickets', label: '🌟 超激レア以上チケット' },
];

export default function HiraganaRewardModal({ reward, stats, onClose, playDecideSound }) {
  if (!reward) return null;

  const titles = getUnlockedTitleObjects(reward.newTitleIds || []);
  const ticketLines = TICKET_ENTRIES.filter(({ key }) => (reward.tickets?.[key] || 0) > 0);

  const handleClose = () => {
    playDecideSound?.();
    onClose?.();
  };

  const heroEmoji =
    reward.kind === 'shuffle' ? '🎲' : reward.kind === 'order' ? '📝' : '🎉';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] animate-fade-in p-4">
      <div className="relative max-w-sm w-full animate-pop-out">
        <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-r from-pink-400 via-yellow-300 to-sky-400 blur-sm opacity-80" />
        <div className="relative bg-white border-8 border-white rounded-[2rem] p-6 sm:p-8 text-center shadow-2xl overflow-hidden">
          <div className="pointer-events-none absolute inset-0 hiragana-scene-bg opacity-40" />
          <div className="relative z-10 space-y-4">
            <div className="flex justify-center -mt-2">
              <div className="relative">
                <img
                  src="/hiragana_mascot.png"
                  alt=""
                  className="w-24 h-24 object-contain animate-hiragana-pop-wiggle drop-shadow-lg"
                />
                <span className="absolute -right-2 -top-1 text-3xl animate-hiragana-float">{heroEmoji}</span>
              </div>
            </div>
            <div className="text-xl font-black bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              {reward.title}
            </div>
            <p className="text-sm font-bold text-gray-600">{reward.subtitle}</p>

            {stats && (
              <p className="text-xs font-black text-indigo-600 bg-indigo-50 border-2 border-indigo-100 rounded-full px-3 py-1 inline-block">
                ミス {stats.misses} 回 / 正答率 {stats.accuracy}%
              </p>
            )}

            {reward.points > 0 && (
              <div className="text-4xl font-black text-amber-500 animate-point-pop drop-shadow-sm">
                +{reward.points.toLocaleString()} pt
              </div>
            )}

            {ticketLines.length > 0 && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-4 border-yellow-300 px-4 py-3 rounded-2xl shadow-inner space-y-1">
                <div className="text-xs font-black text-orange-600 mb-1">🎁 ぜん行クリアボーナス！</div>
                {ticketLines.map(({ key, label }) => (
                  <div key={key} className="text-sm font-black text-purple-700">
                    {label} × {reward.tickets[key]}
                  </div>
                ))}
              </div>
            )}

            {titles.length > 0 && (
              <div className="space-y-2">
                {titles.map((title) => (
                  <div
                    key={title.id}
                    className="bg-gradient-to-r from-indigo-50 to-violet-50 border-4 border-indigo-200 px-4 py-2 rounded-2xl shadow-inner text-left"
                  >
                    <div className="text-xs font-bold text-gray-500">🏆 あたらしいしょうごう！</div>
                    <div className="text-sm font-black text-gray-800">{title.name}</div>
                    <div className="text-[10px] font-bold text-gray-400">{title.desc}</div>
                  </div>
                ))}
              </div>
            )}

            {reward.points === 0 && ticketLines.length === 0 && titles.length === 0 && (
              <p className="text-xs font-bold text-gray-400">クリアおめでとう！</p>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="premium-button bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-400 hover:from-pink-500 hover:via-orange-500 hover:to-yellow-500 text-white font-black text-lg px-8 py-3 w-full shadow-lg border-3 border-white"
            >
              やったー！ ✨
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
