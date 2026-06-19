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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] animate-fade-in">
      <div className="bg-white border-8 border-yellow-400 p-6 sm:p-8 rounded-3xl text-center max-w-sm w-full mx-4 shadow-2xl relative animate-pop-out">
        <div className="relative z-10 space-y-4">
          <div className="text-5xl">{reward.kind === 'shuffle' ? '🎲' : '🎉'}</div>
          <div className="text-xl font-black text-emerald-600">{reward.title}</div>
          <p className="text-sm font-bold text-gray-600">{reward.subtitle}</p>

          {stats && (
            <p className="text-xs font-bold text-gray-500">
              ミス {stats.misses} 回 / 正答率 {stats.accuracy}%
            </p>
          )}

          {reward.points > 0 && (
            <div className="text-3xl font-black text-amber-500">+{reward.points.toLocaleString()} pt</div>
          )}

          {ticketLines.length > 0 && (
            <div className="bg-yellow-50 border-4 border-yellow-300 px-4 py-3 rounded-2xl shadow-inner space-y-1">
              <div className="text-xs font-bold text-gray-500 mb-1">🎁 ぜん行クリアボーナス！</div>
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
                  className="bg-indigo-50 border-4 border-indigo-200 px-4 py-2 rounded-2xl shadow-inner text-left"
                >
                  <div className="text-xs font-bold text-gray-500">🏆 あたらしいしょうごう！</div>
                  <div className="text-sm font-black text-gray-800">{title.name}</div>
                  <div className="text-[10px] font-bold text-gray-400">{title.desc}</div>
                </div>
              ))}
            </div>
          )}

          {reward.points === 0 && ticketLines.length === 0 && titles.length === 0 && (
            <p className="text-xs font-bold text-gray-400">クリアおめでとう！（ポイントは 初回クリア のみ）</p>
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
