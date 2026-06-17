import React from 'react';
import { TITLES, GACHA_ITEMS, getRarityWeight, resolveBackground } from '../constants';

export default function PlayerCard({ player, onClick }) {
  const bgItem = resolveBackground(player.currentBackground);
  const iconItem = player.currentIcon
    ? GACHA_ITEMS.find((i) => i.name === player.currentIcon)
    : null;
  const titleItem = TITLES.find((t) => t.id === player.currentTitle);
  const collectionCount = player.collectionCount ?? 0;
  const totalTickets =
    (player.specialTickets || 0) +
    (player.legendTickets || 0) +
    (player.bgmTickets || 0) +
    (player.seTickets || 0);

  const borderStyle = iconItem
    ? iconItem.rarity === '✨レジェンド✨'
      ? { boxShadow: '0 0 10px #a855f7, inset 0 0 6px #a855f7' }
      : { borderColor: iconItem.color, boxShadow: `0 0 6px ${iconItem.color}50` }
    : {};
  const legendClass =
    iconItem?.rarity === '✨レジェンド✨' ? 'legend-card border-none' : 'border-indigo-200';

  const obtainedItems = GACHA_ITEMS.filter(
    (item) => player.collection && player.collection[item.name] > 0
  ).sort((a, b) => getRarityWeight(b.rarity) - getRarityWeight(a.rarity));

  const previewItems = obtainedItems.slice(0, 4);
  const hasMore = obtainedItems.length > 4;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative border-3 p-5 rounded-3xl flex flex-col items-center text-center gap-3.5 transition-all cursor-pointer shadow-sm border-indigo-100 bg-gradient-to-r from-sky-50 to-indigo-50 hover:border-sky-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] w-full"
    >
      <div className="absolute inset-0 z-0 pointer-events-none rounded-3xl overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70"
          style={{ backgroundImage: `url(${bgItem.url})` }}
        />
        <div className="absolute inset-0 bg-white/50" />
      </div>

      <div
        className={`relative z-10 w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl border-4 shadow-md shrink-0 ${legendClass}`}
        style={borderStyle}
      >
        {iconItem ? iconItem.emoji : titleItem?.emoji || '👦'}
      </div>

      <div className="relative z-10 bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider shadow-inner max-w-[120px] truncate leading-none">
        {titleItem?.name || 'しんまい'}
      </div>

      <h3 className="relative z-10 font-black text-gray-800 text-sm sm:text-base leading-none">
        {player.name}
      </h3>

      <div className="relative z-10 flex gap-2 text-[11px] font-black text-gray-700 justify-center flex-wrap">
        <span className="bg-white border border-gray-200 px-2.5 py-0.5 rounded-full shadow-sm">
          🪙 {player.points || 0}
        </span>
        <span className="bg-white border border-gray-200 px-2.5 py-0.5 rounded-full shadow-sm">
          🎟 {totalTickets}
        </span>
        <span className="bg-white border border-gray-200 px-2.5 py-0.5 rounded-full shadow-sm">
          🎁 {collectionCount}/{GACHA_ITEMS.length}
        </span>
      </div>

      {obtainedItems.length === 0 ? (
        <span className="relative z-10 text-[10px] text-gray-400 font-bold block min-h-[28px] leading-[28px]">
          アイテムなし
        </span>
      ) : (
        <div className="relative z-10 flex flex-wrap gap-1 justify-center max-w-full min-h-[28px] items-center">
          {previewItems.map((item, idx) => (
            <div
              key={idx}
              className={`w-7 h-7 rounded-full bg-white flex items-center justify-center text-base border shadow-sm relative ${item.foil ? 'foil-effect' : ''}`}
              style={{ borderColor: item.color }}
              title={`${item.name} (${item.rarity})`}
            >
              <span className="leading-none text-base">{item.emoji}</span>
              {player.newItems?.includes(item.name) && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 w-1.5 h-1.5 rounded-full border border-white animate-pulse" />
              )}
            </div>
          ))}
          {hasMore && (
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-black text-gray-500 border border-gray-200 shadow-sm leading-none">
              +{obtainedItems.length - 4}
            </div>
          )}
        </div>
      )}

      {player.tags?.length > 0 && (
        <div className="absolute -bottom-1 -right-1 flex flex-wrap gap-1 max-w-[120px] justify-end z-10">
          {player.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[8px] font-black bg-indigo-50 border border-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded shadow-sm"
            >
              {tag}
            </span>
          ))}
          {player.tags.length > 2 && (
            <span className="text-[8px] font-black bg-gray-100 text-gray-500 px-1 py-0.5 rounded shadow-sm">
              +{player.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
