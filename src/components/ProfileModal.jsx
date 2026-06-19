import React, { useEffect, useRef } from 'react';
import { User, X, CheckCircle2 } from 'lucide-react';
import { BACKGROUNDS, TITLES, GACHA_ITEMS } from '../constants';
import { optimizedAssetUrl } from '../utils/assetImages';

function countOwnedTypes(collection = {}) {
  return Object.keys(collection).filter((key) => collection[key] > 0).length;
}

export default function ProfileModal({
  isOpen,
  player,
  onClose,
  onPlayerUpdate,
  playDecideSound,
  playCancelSound,
  highlightBackgroundId,
}) {
  const backgroundSectionRef = useRef(null);

  useEffect(() => {
    if (isOpen && highlightBackgroundId) {
      backgroundSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isOpen, highlightBackgroundId]);

  if (!isOpen || !player) return null;

  const collection = player.collection || {};
  const achievements = Array.isArray(player.achievements) ? player.achievements : ['rookie'];
  const backgrounds = Array.isArray(player.backgrounds) ? player.backgrounds : ['default'];
  const currentTitle = player.currentTitle || 'rookie';
  const currentIcon = player.currentIcon ?? null;
  const currentBackground = player.currentBackground || 'default';
  const titleInfo = TITLES.find((t) => t.id === currentTitle) || TITLES[0];
  const iconItem = currentIcon ? GACHA_ITEMS.find((item) => item.name === currentIcon) : null;

  const iconStyle = iconItem
    ? iconItem.rarity === '✨レジェンド✨'
      ? { boxShadow: '0 0 15px #a855f7, inset 0 0 10px #a855f7' }
      : { borderColor: iconItem.color, boxShadow: `0 0 10px ${iconItem.color}50` }
    : {};

  const handleClose = () => {
    playCancelSound?.();
    onClose();
  };

  const save = async (updates) => {
    playDecideSound?.();
    await onPlayerUpdate?.(updates);
  };

  const ownedItems = GACHA_ITEMS.filter((item) => collection[item.name] > 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card bg-white/95 w-full max-w-2xl p-6 max-h-[90vh] flex flex-col shadow-2xl rounded-3xl relative">
        <div className="flex justify-between items-center mb-6 shrink-0 border-b pb-4">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-800 flex items-center gap-2">
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            プロフィール
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto pr-2 space-y-6 flex-1">
          <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border-2 border-indigo-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div
              className={`w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center text-4xl sm:text-5xl border-4 shadow-sm shrink-0 ${
                iconItem?.rarity === '✨レジェンド✨' ? 'legend-card border-none' : 'border-indigo-200'
              }`}
              style={iconStyle}
            >
              {iconItem ? iconItem.emoji : titleInfo.emoji || '👦'}
            </div>
            <div className="flex-1 text-center sm:text-left flex flex-col justify-center">
              <div className="text-xs sm:text-sm font-black text-indigo-500 mb-1">{titleInfo.name}</div>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-2">{player.name}</h3>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-xs sm:text-sm font-bold text-gray-600">
                <span className="bg-white px-3 py-1 rounded-full border shadow-sm">🪙 {player.points || 0} pt</span>
                <span className="bg-white px-3 py-1 rounded-full border shadow-sm">
                  🎁 {countOwnedTypes(collection)} しゅるい
                </span>
                <span className="bg-white px-3 py-1 rounded-full border shadow-sm">
                  🎟️ {player.specialTickets || 0} まい
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black text-gray-700 mb-3 flex items-center gap-2">
              <span>👤</span> アイコン を かえる
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => save({ currentIcon: null })}
                className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 ${
                  currentIcon === null
                    ? 'bg-yellow-50 border-yellow-400 shadow-md scale-105 z-10'
                    : 'bg-white border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/30 active:scale-95'
                }`}
              >
                <span className="text-2xl sm:text-3xl">{titleInfo.emoji || '👦'}</span>
              </button>
              {ownedItems.map((item) => {
                const isSelected = currentIcon === item.name;
                const isLegend = item.rarity === '✨レジェンド✨';
                const customStyle = !isLegend ? { borderColor: item.color } : {};
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => save({ currentIcon: item.name })}
                    className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-white ${
                      isSelected
                        ? 'outline outline-4 outline-yellow-400 bg-yellow-50 scale-105 z-10'
                        : 'hover:bg-yellow-50/30 active:scale-95'
                    } ${isLegend ? 'legend-card border-none' : ''}`}
                    style={customStyle}
                    title={item.name}
                  >
                    <span className="text-2xl sm:text-3xl">{item.emoji}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black text-gray-700 mb-3 flex items-center gap-2">
              <span>🏆</span> しょうごう を かえる
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TITLES.map((t) => {
                const hasTitle = achievements.includes(t.id);
                const isSelected = currentTitle === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={!hasTitle}
                    onClick={() => save({ currentTitle: t.id })}
                    className={`p-3 rounded-xl flex flex-col items-center justify-center border-2 transition-all text-center relative ${
                      isSelected
                        ? 'bg-yellow-50 border-yellow-400 shadow-md scale-105 z-10'
                        : hasTitle
                          ? 'bg-white border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/30 active:scale-95'
                          : 'bg-gray-100 border-gray-200 opacity-50 grayscale cursor-not-allowed'
                    }`}
                  >
                    <span className="text-2xl mb-1">{hasTitle ? t.emoji : '🔒'}</span>
                    <span className="font-black text-xs sm:text-sm text-gray-800 leading-tight mb-1">
                      {hasTitle ? t.name : '？？？'}
                    </span>
                    {hasTitle && (
                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 leading-tight">
                        {t.desc}
                      </span>
                    )}
                    {isSelected && (
                      <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                        セット中
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div ref={backgroundSectionRef}>
            <h3 className="text-lg font-black text-gray-700 mb-3 flex items-center gap-2">
              <span>🎨</span> はいけい を かえる
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BACKGROUNDS.filter(
                (bg, index, arr) => arr.findIndex((b) => b.id === bg.id) === index,
              ).map((bg) => {
                const hasBg = backgrounds.includes(bg.id);
                const isSelected = currentBackground === bg.id;
                const isHighlighted = highlightBackgroundId === bg.id;
                return (
                  <button
                    key={bg.id}
                    type="button"
                    disabled={!hasBg}
                    onClick={() => save({ currentBackground: bg.id })}
                    className={`relative aspect-video rounded-xl overflow-hidden border-4 transition-all group ${
                      isSelected
                        ? 'border-sky-500 shadow-lg scale-105 z-10'
                        : isHighlighted
                          ? 'border-amber-400 shadow-lg ring-2 ring-amber-300 scale-105 z-10'
                          : hasBg
                            ? 'border-gray-200 hover:border-sky-300 hover:shadow-md active:scale-95'
                            : 'border-gray-200 opacity-50 grayscale cursor-not-allowed'
                    }`}
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${optimizedAssetUrl(bg.url)})` }}
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity group-hover:bg-black/20">
                      <span className="font-black text-white text-sm sm:text-base drop-shadow-md">
                        {hasBg ? bg.name : '🔒 ？？？'}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-sky-500 text-white p-1 rounded-full shadow-md z-10">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
