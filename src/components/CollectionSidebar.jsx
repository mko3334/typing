import React from 'react';
import { Trophy } from 'lucide-react';
import { GACHA_ITEMS, getRarityWeight } from '../constants';

export default function CollectionSidebar({ player }) {
  const collection = player?.collection || {};
  const newItems = player?.newItems || [];

  const obtainedItems = GACHA_ITEMS.filter((item) => (collection[item.name] || 0) > 0).sort(
    (a, b) => getRarityWeight(b.rarity) - getRarityWeight(a.rarity),
  );

  const totalCount = Object.values(collection).reduce((sum, n) => sum + n, 0);

  return (
    <aside className="hidden lg:flex w-44 xl:w-52 bg-white/95 backdrop-blur-md border-l-4 border-yellow-300 flex-col shrink-0 shadow-2xl z-30 overflow-hidden">
      <div className="p-3 border-b border-yellow-100 shrink-0">
        <h2 className="text-sm xl:text-base font-black text-gray-800 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
          <span>ごほうび</span>
          <span className="text-sky-500 text-xs xl:text-sm ml-auto">{totalCount}コ</span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {obtainedItems.length === 0 ? (
          <p className="text-[10px] font-bold text-gray-400 text-center py-8">まだ ごほうびが ないよ</p>
        ) : (
          obtainedItems.map((item) => {
            const count = collection[item.name] || 0;
            const isLegend = item.rarity === '✨レジェンド✨';
            return (
              <div
                key={item.name}
                className={`relative p-2 rounded-xl flex flex-col items-center bg-white transition-all ${
                  isLegend ? 'legend-card' : ''
                }`}
                style={
                  isLegend
                    ? { boxShadow: '0 4px 20px #a855f780' }
                    : {
                        border: `3px solid ${item.color}`,
                        boxShadow: `0 4px 14px ${item.color}50`,
                      }
                }
              >
                <div className="text-3xl xl:text-4xl mb-1 relative leading-none">
                  {item.emoji}
                  {count > 1 && (
                    <span className="absolute -bottom-1 -right-3 bg-sky-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                      x{count}
                    </span>
                  )}
                  {newItems.includes(item.name) && (
                    <span className="absolute -top-1 -left-2 bg-red-500 w-2 h-2 rounded-full border border-white animate-pulse" />
                  )}
                </div>
                <div className="text-[9px] xl:text-[10px] font-bold text-gray-700 text-center leading-tight line-clamp-2 w-full">
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
          })
        )}
      </div>
    </aside>
  );
}
