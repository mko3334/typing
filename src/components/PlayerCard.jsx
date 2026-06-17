import React from 'react';
import { TITLES, GACHA_ITEMS, getRarityWeight, resolveBackground } from '../constants';

export default function PlayerCard({ player, onClick, readOnly = false }) {
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

  const previewLimit = 8;
  const previewItems = obtainedItems.slice(0, previewLimit);
  const hasMore = obtainedItems.length > previewLimit;

  const cardClassName =
    'relative border-3 p-3 rounded-2xl flex flex-col gap-2 shadow-sm border-indigo-100 bg-gradient-to-r from-sky-50 to-indigo-50 w-full text-left';

  const cardContent = (
    <>
      <div className="absolute inset-0 z-0 pointer-events-none rounded-2xl overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70"
          style={{ backgroundImage: `url(${bgItem.url})` }}
        />
        <div className="absolute inset-0 bg-white/50" />
      </div>

      <div className="relative z-10 flex items-center gap-2.5 min-w-0">
        <div
          className={`w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl border-[3px] shadow-md shrink-0 ${legendClass}`}
          style={borderStyle}
        >
          {iconItem ? iconItem.emoji : titleItem?.emoji || '👦'}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <div className="bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 px-1.5 py-0.5 rounded-full text-[8px] font-black tracking-wider shadow-inner w-fit max-w-full truncate leading-none">
            {titleItem?.name || 'しんまい'}
          </div>
          <h3 className="font-black text-gray-800 text-sm leading-tight truncate bg-white/75 backdrop-blur-[1px] px-1.5 py-0.5 rounded-md shadow-sm border border-white/80 w-fit max-w-full">
            {player.name}
          </h3>
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap gap-1 text-[10px] font-black text-gray-700">
        <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
          🪙 {player.points || 0}
        </span>
        <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
          🎟 {totalTickets}
        </span>
        <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
          🎁 {collectionCount}/{GACHA_ITEMS.length}
        </span>
      </div>

      {obtainedItems.length === 0 ? (
        <span className="relative z-10 text-[9px] text-gray-400 font-bold min-h-[24px] leading-[24px]">
          アイテムなし
        </span>
      ) : (
        <div className="relative z-10 flex flex-nowrap items-center gap-0.5 w-full min-h-[22px] overflow-hidden">
          {previewItems.map((item, idx) => (
            <div
              key={idx}
              className={`w-[1.625rem] h-[1.625rem] shrink-0 rounded-full bg-white flex items-center justify-center border shadow-sm relative overflow-hidden ${item.foil ? 'foil-icon-chip' : ''}`}
              style={{ borderColor: item.color }}
              title={`${item.name} (${item.rarity})`}
            >
              <span className="relative z-[3] text-[11px] leading-none">{item.emoji}</span>
              {player.newItems?.includes(item.name) && (
                <span className="absolute top-0 right-0 z-[1] bg-red-500 w-1.5 h-1.5 rounded-full border border-white animate-pulse" />
              )}
            </div>
          ))}
          {hasMore && (
            <div className="w-[1.625rem] h-[1.625rem] shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-[7px] font-black text-gray-500 border border-gray-200 shadow-sm leading-none">
              +{obtainedItems.length - previewLimit}
            </div>
          )}
        </div>
      )}

      {player.tags?.length > 0 && (
        <div className="absolute top-1.5 right-1.5 flex flex-wrap gap-0.5 max-w-[45%] justify-end z-10">
          {player.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[7px] font-black bg-indigo-50 border border-indigo-100 text-indigo-600 px-1 py-0.5 rounded shadow-sm"
            >
              {tag}
            </span>
          ))}
          {player.tags.length > 2 && (
            <span className="text-[7px] font-black bg-gray-100 text-gray-500 px-1 py-0.5 rounded shadow-sm">
              +{player.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </>
  );

  if (readOnly) {
    return <div className={cardClassName}>{cardContent}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${cardClassName} transition-all cursor-pointer hover:border-sky-300 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]`}
    >
      {cardContent}
    </button>
  );
}
