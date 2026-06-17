import React from 'react';
import { Book, X } from 'lucide-react';
import { GACHA_ITEMS, RARITY_ZUKAN_SECTIONS } from '../constants';

function ZukanCard({ item, count, isNew }) {
  const isObtained = count > 0;
  const isLegend = item.rarity === '✨レジェンド✨';

  if (!isObtained) {
    return (
      <div className="p-2 sm:p-3 rounded-xl flex flex-col items-center justify-center bg-gray-100/80 border-2 border-dashed border-gray-300 min-h-[100px]">
        <div className="text-3xl sm:text-4xl mb-1 leading-none opacity-40 grayscale">❓</div>
        <div className="text-[9px] sm:text-[10px] font-black text-gray-400 text-center leading-tight line-clamp-2 w-full">
          ？？？
        </div>
        <div className="text-[8px] font-black text-gray-300 mt-0.5">未所持</div>
      </div>
    );
  }

  return (
    <div
      className={`relative p-2 sm:p-3 rounded-xl flex flex-col items-center justify-center bg-white shadow-md hover:scale-[1.03] transition-transform min-h-[100px] ${
        isLegend ? 'legend-card' : ''
      }`}
      style={
        isLegend
          ? { boxShadow: '0 2px 12px #a855f780' }
          : { border: `2px solid ${item.color}`, boxShadow: `0 2px 8px ${item.color}40` }
      }
    >
      <div className="text-3xl sm:text-4xl mb-1 relative leading-none">
        {item.emoji}
        {count > 1 && (
          <span className="absolute -bottom-1 -right-3 bg-sky-500 text-white text-[8px] font-black px-1 py-0.5 rounded-full border border-white shadow-sm">
            x{count}
          </span>
        )}
        {isNew && (
          <span className="absolute -top-1 -left-1 bg-red-500 w-2 h-2 rounded-full border border-white animate-pulse" />
        )}
      </div>
      <div className="text-[9px] sm:text-[10px] font-bold text-gray-700 text-center leading-tight line-clamp-2 w-full">
        {item.name}
      </div>
      <div
        className={`text-[8px] font-black mt-0.5 ${item.foil ? 'foil-effect' : ''}`}
        style={item.foil ? {} : { color: item.color }}
      >
        {item.rarity.replace(/✨|🌟|🔥|⭐/g, '')}
      </div>
    </div>
  );
}

export default function ZukanModal({ isOpen, player, onClose, playDecideSound, playCancelSound }) {
  if (!isOpen) return null;

  const collection = player?.collection || {};
  const newItems = player?.newItems || [];
  const ownedKinds = GACHA_ITEMS.filter((item) => (collection[item.name] || 0) > 0).length;
  const totalKinds = GACHA_ITEMS.length;
  const percent = totalKinds > 0 ? Math.round((ownedKinds / totalKinds) * 100) : 0;
  const totalCopies = Object.values(collection).reduce((sum, n) => sum + n, 0);

  const sections = RARITY_ZUKAN_SECTIONS.map(({ rarity, label }) => ({
    rarity,
    label,
    items: GACHA_ITEMS.filter((item) => item.rarity === rarity).sort((a, b) =>
      a.name.localeCompare(b.name, 'ja'),
    ),
  })).filter((section) => section.items.length > 0);

  const handleClose = () => {
    playCancelSound?.();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white/95 w-full max-w-3xl rounded-3xl border-4 border-orange-200 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-orange-100 shrink-0">
          <div className="flex justify-between items-start gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
                <Book className="w-6 h-6 text-orange-500 shrink-0" />
                ずかん
              </h2>
              <p className="text-sm font-black text-sky-600 mt-1">
                {ownedKinds} / {totalKinds} しゅるい（{percent}%）
              </p>
              <p className="text-[10px] font-bold text-gray-400 mt-0.5">合計 {totalCopies} コ もっている</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
              aria-label="とじる"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="mt-3 h-3 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          {percent >= 100 && (
            <p className="text-xs font-black text-orange-500 mt-2 animate-pulse">👑 コンプリートおめでとう！</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-5">
          {sections.map((section) => {
            const sectionOwned = section.items.filter((item) => (collection[item.name] || 0) > 0).length;
            return (
              <section key={section.rarity}>
                <div className="flex items-center justify-between gap-2 mb-2 px-1">
                  <h3 className="text-xs sm:text-sm font-black text-gray-700">{section.label}</h3>
                  <span className="text-[10px] font-black text-sky-600 shrink-0">
                    {sectionOwned}/{section.items.length}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                  {section.items.map((item) => (
                    <ZukanCard
                      key={item.name}
                      item={item}
                      count={collection[item.name] || 0}
                      isNew={newItems.includes(item.name)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <div className="p-3 sm:p-4 border-t border-orange-100 shrink-0">
          <button
            type="button"
            onClick={() => {
              playDecideSound?.();
              onClose?.();
            }}
            className="w-full py-2.5 bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white font-black rounded-xl shadow-md active:scale-95 transition-transform"
          >
            とじる
          </button>
        </div>
      </div>
    </div>
  );
}
