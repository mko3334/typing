import React from 'react';
import { Book, X } from 'lucide-react';
import { GACHA_ITEMS, RARITY_ZUKAN_SECTIONS, WORDS } from '../constants';
import { getGearTooltip } from '../utils/gearPower';

function ZukanCard({ item, count, isNew }) {
  const isObtained = count > 0;
  const isLegend = item.rarity === '✨レジェンド✨';
  const isMiracle = item.rarity === '💎ミラクル💎';

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
        isMiracle ? 'miracle-card' : isLegend ? 'legend-card' : ''
      }`}
      style={
        isMiracle
          ? { boxShadow: '0 2px 12px #06b6d480' }
          : isLegend
          ? { boxShadow: '0 2px 12px #a855f780' }
          : { border: `2px solid ${item.color}`, boxShadow: `0 2px 8px ${item.color}40` }
      }
      title={getGearTooltip(item.name)}
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

export default function ZukanModal({ isOpen, player, extraWords = [], onClose, playDecideSound, playCancelSound }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = React.useState('gacha');

  const collection = player?.collection || {};
  const newItems = player?.newItems || [];
  const ownedKinds = GACHA_ITEMS.filter((item) => (collection[item.name] || 0) > 0).length;
  const totalKinds = GACHA_ITEMS.length;
  const gachaPercent = totalKinds > 0 ? Math.round((ownedKinds / totalKinds) * 100) : 0;
  const totalCopies = Object.values(collection).reduce((sum, n) => sum + n, 0);

  const sections = RARITY_ZUKAN_SECTIONS.map(({ rarity, label }) => ({
    rarity,
    label,
    items: GACHA_ITEMS.filter((item) => item.rarity === rarity).sort((a, b) =>
      a.name.localeCompare(b.name, 'ja'),
    ),
  })).filter((section) => section.items.length > 0);

  // --- Keyword Zukan Logic ---
  const encountered = player?.encounteredKeywords || {};
  const diffConfigs = [
    { key: 'easy', label: '🔰 イージー' },
    { key: 'normal', label: '⭐ ノーマル' },
    { key: 'hard', label: '🔥 ハード' },
    { key: 'very_hard', label: '👿 ベリーハード' },
  ];
  let totalKeywords = 0;
  let encounteredKeywordsCount = 0;
  const keywordSections = diffConfigs.map(({ key, label }) => {
    const baseWords = (WORDS[key] || []).filter(w => !w.isAlphabetQuiz);
    const adopted = extraWords
      .filter(w => w.difficulty === key || (!w.difficulty && key === 'normal'))
      .map(w => ({ ...w, isRequested: true }));
    const words = [...baseWords, ...adopted];

    const encounteredCount = words.filter(w => encountered[w.kana]).length;
    totalKeywords += words.length;
    encounteredKeywordsCount += encounteredCount;
    return {
      key,
      label,
      words,
      encounteredCount,
      percent: words.length > 0 ? Math.round((encounteredCount / words.length) * 100) : 0
    };
  });
  const keywordPercent = totalKeywords > 0 ? Math.round((encounteredKeywordsCount / totalKeywords) * 100) : 0;

  const handleClose = () => {
    playCancelSound?.();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white/95 w-full max-w-4xl rounded-3xl border-4 border-orange-200 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-orange-100 shrink-0">
          <div className="flex justify-between items-start gap-3 mb-3">
            <h2 className="text-xl sm:text-2xl font-black text-gray-800 flex items-center gap-2">
              <Book className="w-6 h-6 text-orange-500 shrink-0" />
              ずかん
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
              aria-label="とじる"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl mb-4">
            <button
              onClick={() => setActiveTab('gacha')}
              className={`flex-1 py-2 font-black text-sm rounded-lg transition-all ${
                activeTab === 'gacha' ? 'bg-white shadow-sm text-sky-600' : 'text-gray-500 hover:bg-gray-200'
              }`}
            >
              🎁 ガチャ図鑑
            </button>
            <button
              onClick={() => setActiveTab('keywords')}
              className={`flex-1 py-2 font-black text-sm rounded-lg transition-all ${
                activeTab === 'keywords' ? 'bg-white shadow-sm text-sky-600' : 'text-gray-500 hover:bg-gray-200'
              }`}
            >
              📖 キーワード図鑑
            </button>
          </div>

          {activeTab === 'gacha' && (
            <>
              <p className="text-sm font-black text-sky-600">
                {ownedKinds} / {totalKinds} しゅるい（{gachaPercent}%）
              </p>
              <p className="text-[10px] font-bold text-gray-400 mt-0.5">合計 {totalCopies} コ もっている</p>
              <div className="mt-2 h-3 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${gachaPercent}%` }}
                />
              </div>
              {gachaPercent >= 100 && (
                <p className="text-xs font-black text-orange-500 mt-2 animate-pulse">👑 コンプリートおめでとう！</p>
              )}
            </>
          )}

          {activeTab === 'keywords' && (
            <>
              <p className="text-sm font-black text-sky-600">
                {encounteredKeywordsCount} / {totalKeywords} ことば（{keywordPercent}%）
              </p>
              <div className="mt-2 h-3 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 transition-all duration-500"
                  style={{ width: `${keywordPercent}%` }}
                />
              </div>
              {keywordPercent >= 100 && (
                <p className="text-xs font-black text-orange-500 mt-2 animate-pulse">🎓 ことばマスター！</p>
              )}
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-5">
          {activeTab === 'gacha' && sections.map((section) => {
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

          {activeTab === 'keywords' && keywordSections.map((section) => (
            <section key={section.key} className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between gap-2 mb-3 px-1">
                <h3 className="text-sm font-black text-gray-700">{section.label}</h3>
                <div className="text-right">
                  <span className="text-xs font-black text-sky-600 mr-2">
                    {section.percent}%
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 shrink-0">
                    {section.encounteredCount}/{section.words.length}
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden mb-3">
                <div
                  className={`h-full transition-all duration-500 ${section.percent >= 100 ? 'bg-orange-400' : 'bg-sky-400'}`}
                  style={{ width: `${section.percent}%` }}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {section.words.map((w) => {
                  const isEncountered = encountered[w.kana];
                  let bgClass = 'bg-gray-100 border-dashed border-gray-300 opacity-60';
                  if (isEncountered) {
                    if (w.isRequested) {
                      bgClass = 'bg-yellow-50 border-yellow-400 shadow-sm';
                    } else {
                      bgClass = 'bg-white border-sky-100 shadow-sm';
                    }
                  }

                  return (
                    <div 
                      key={w.kana}
                      className={`flex items-center gap-2 p-2 rounded-xl border-2 transition-all ${bgClass}`}
                    >
                      <span className="text-2xl w-8 text-center grayscale-0">
                        {isEncountered ? w.emoji : '❓'}
                      </span>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] sm:text-xs font-black text-gray-700 truncate">
                          {isEncountered ? w.kana : '？？？'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
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
