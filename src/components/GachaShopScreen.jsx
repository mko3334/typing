import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { resolveBackground } from '../constants';
import { optimizedAssetUrl } from '../utils/assetImages';
import {
  applyCollectionPulls,
  computeAchievements,
  getHighestHotTierFromItems,
  getHotColorForRarity,
  getHotTierStyles,
  getRewardPullCost,
  mergeNewItems,
  pullBackground,
  pullBgm,
  pullLegendItem,
  pullRewardItems,
  pullSe,
} from '../utils/gacha';
import GameSidebar from './GameSidebar';
import CollectionSidebar from './CollectionSidebar';

const SPIN_MS = 1500;
function GachaOverlayText({ children, color = '#d97706', className = '' }) {
  return (
    <p
      className={`text-base sm:text-xl font-black mt-6 animate-pulse px-5 py-2.5 rounded-2xl border-4 shadow-xl ${className}`}
      style={{
        color,
        backgroundColor: 'rgba(255,255,255,0.98)',
        borderColor: color,
        textShadow: '0 1px 0 rgba(255,255,255,0.9)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      }}
    >
      {children}
    </p>
  );
}

function GachaSpinPanel({ children, accentColor = '#f59e0b' }) {
  return (
    <div className="relative flex flex-col items-center flex-1 justify-center min-h-0 w-full px-2 sm:px-4">
      <div
        className="absolute inset-x-2 sm:inset-x-6 top-2 bottom-2 rounded-3xl border-4 backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(15,23,42,0.72)',
          borderColor: accentColor,
          boxShadow: 'inset 0 0 40px rgba(0,0,0,0.25)',
        }}
      />
      <div className="relative z-10 flex flex-col items-center w-full max-w-md py-6">{children}</div>
    </div>
  );
}

function GachaHotThunder({ tier }) {
  if (!tier) return null;
  const styles = getHotTierStyles(tier);

  return (
    <>
      <div className={`fixed inset-0 pointer-events-none z-50 ${styles.flash} mix-blend-screen`} />
      <div className={`fixed inset-0 flex items-center justify-center pointer-events-none z-40 ${styles.strike}`}>
        <div className="text-[120px] drop-shadow-2xl opacity-90">⚡</div>
      </div>
    </>
  );
}

function GachaHotBadge({ tier }) {
  if (!tier) return null;
  const styles = getHotTierStyles(tier);

  return (
    <p
      className="mt-3 text-sm sm:text-base font-black animate-bounce relative z-10 px-4 py-1.5 rounded-full bg-white/95 border-4 shadow-lg whitespace-nowrap"
      style={{ color: styles.text, borderColor: styles.border }}
    >
      ✨ 激アツ！！ ✨
    </p>
  );
}

function ResultItemCard({ item, compact = false }) {
  if (item.emoji) {
    const isLegend = item.rarity === '✨レジェンド✨';
    return (
      <div
        className={`rounded-xl flex flex-col items-center justify-center bg-white min-h-0 ${compact ? 'p-1.5' : 'p-4'} ${isLegend ? 'legend-card' : ''}`}
        style={
          isLegend
            ? { boxShadow: '0 2px 12px #a855f780' }
            : { border: `2px solid ${item.color}`, boxShadow: `0 2px 8px ${item.color}40` }
        }
      >
        <div className={compact ? 'text-2xl sm:text-3xl mb-0.5 leading-none' : 'text-5xl mb-2'}>{item.emoji}</div>
        <div
          className={`font-black text-gray-700 text-center leading-tight ${
            compact ? 'text-[8px] sm:text-[9px] line-clamp-2' : 'text-xs'
          }`}
        >
          {item.name}
        </div>
        <div
          className={`font-black ${compact ? 'text-[7px] sm:text-[8px] mt-0.5' : 'text-[10px] mt-1'} ${item.foil ? 'foil-effect' : ''}`}
          style={item.foil ? {} : { color: item.color }}
        >
          {item.rarity.replace(/✨|🌟|🔥|⭐/g, '')}
        </div>
      </div>
    );
  }

  if (item.url && item.name) {
    return (
      <div
        className={`rounded-xl bg-white border-2 border-sky-200 flex flex-col items-center justify-center gap-1 min-h-0 ${
          compact ? 'p-1.5' : 'p-3'
        }`}
      >
        {item.url.includes('.mp3') ? (
          <div className={compact ? 'text-2xl sm:text-3xl' : 'text-5xl'}>🎵</div>
        ) : (
          <img
            src={item.url}
            alt={item.name}
            className={`object-cover rounded-md border border-white shadow ${
              compact ? 'w-10 h-7 sm:w-12 sm:h-9' : 'w-20 h-14'
            }`}
          />
        )}
        <div className={`font-black text-gray-700 text-center leading-tight ${compact ? 'text-[8px] sm:text-[9px] line-clamp-2' : 'text-xs'}`}>
          {item.name}
        </div>
      </div>
    );
  }

  return null;
}

function CosmeticGachaResult({ spinType, item, previewBgActive, onPreview, onOpenSettings }) {
  const isBg = spinType === 'bg';
  const isBgm = spinType === 'bgm';
  const isSe = spinType === 'se';

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-3">
      <div className="w-full rounded-2xl border-4 border-white/80 bg-white/95 shadow-xl overflow-hidden">
        {isBg && (
          <div className="relative aspect-video w-full">
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-500"
              style={{ backgroundImage: `url(${item.url})` }}
            />
            <div className="absolute inset-0 bg-black/25 flex items-end justify-center p-3">
              <span className="text-white font-black text-sm sm:text-base drop-shadow-lg">{item.name}</span>
            </div>
            {previewBgActive && (
              <div className="absolute top-2 right-2 bg-sky-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                プレビュー中
              </div>
            )}
          </div>
        )}
        {isBgm && (
          <div className="flex flex-col items-center py-8 px-4 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-6xl mb-3">🎵</div>
            <div className="text-base sm:text-lg font-black text-gray-800 text-center">{item.name}</div>
          </div>
        )}
        {isSe && (
          <div className="flex flex-col items-center py-8 px-4 bg-gradient-to-br from-cyan-50 to-teal-100">
            <div className="text-6xl mb-3">🔊</div>
            <div className="text-base sm:text-lg font-black text-gray-800 text-center">{item.name}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 w-full">
        <button
          type="button"
          onClick={onPreview}
          className="premium-button bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white text-xs sm:text-sm font-black py-2.5 px-3 rounded-xl shadow-md"
        >
          {isBg ? '👀 プレビュー' : '▶️ 試しに聴く'}
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="premium-button bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs sm:text-sm font-black py-2.5 px-3 rounded-xl shadow-md"
        >
          {isBg ? '🎨 はいけい変更' : isBgm ? '🎵 おんがく設定' : '🔊 効果音設定'}
        </button>
      </div>
    </div>
  );
}

function TicketButton({ disabled, onClick, children, variant = 'ticket' }) {
  const enabled =
    variant === 'ticket'
      ? 'bg-gradient-to-r from-sky-500 to-blue-500 border-blue-700 active:scale-95 active:border-b-0 active:translate-y-[1px] cursor-pointer'
      : 'bg-gradient-to-r from-orange-500 to-red-500 border-red-700 active:scale-95 active:border-b-0 active:translate-y-[1px] cursor-pointer';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-1 rounded-lg text-[9px] lg:text-[10px] font-black text-white shadow border-b-2 ${
        disabled ? 'bg-gray-400 opacity-40 cursor-not-allowed border-transparent' : enabled
      }`}
    >
      {children}
    </button>
  );
}

function GachaMachine({ badge, badgeClass, image, title, subtitle, ticketCount, ticketLabel, children }) {
  return (
    <div className="bg-white/95 border-[4px] border-amber-100 rounded-2xl p-2 md:p-3 shadow-md flex flex-col items-center gap-1.5 relative group hover:scale-[1.01] transition-transform min-w-0">
      {badge && (
        <span className={`absolute top-1.5 left-1.5 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm ${badgeClass}`}>
          {badge}
        </span>
      )}
      <img
        src={image}
        alt={title}
        className="w-16 h-16 sm:w-20 sm:h-20 md:w-16 md:h-16 lg:w-20 lg:h-20 object-contain drop-shadow-md select-none pointer-events-none"
      />
      <div className="text-center w-full min-w-0">
        <h4 className="font-black text-xs text-gray-800 leading-none">{title}</h4>
        {subtitle && (
          <p className="text-[7px] lg:text-[8px] text-gray-400 font-bold mt-0.5 leading-none truncate hidden sm:block">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1 w-full shrink-0">{children}</div>
      {ticketLabel && (
        <div className="bg-white/80 border px-2 py-0.5 rounded-xl text-[9px] lg:text-[10px] font-black shadow-sm shrink-0 w-full text-center">
          {ticketLabel}: {ticketCount}枚
        </div>
      )}
    </div>
  );
}

export default function GachaShopScreen({
  player,
  onPlayerUpdate,
  onBack,
  onSaveAndTitle,
  onOpenProfile,
  onOpenMusic,
  onOpenZukan,
  playDecideSound,
  playCancelSound,
  playSE,
  previewBgm,
  previewSe,
}) {
  const [phase, setPhase] = useState('shop');
  const [spinType, setSpinType] = useState(null);
  const [results, setResults] = useState([]);
  const [hotColor, setHotColor] = useState(null);
  const [spinHotTier, setSpinHotTier] = useState(null);
  const [previewBgActive, setPreviewBgActive] = useState(false);
  const spinTimerRef = useRef(null);
  const hotTimerRef = useRef(null);

  const activeBg = resolveBackground(player?.currentBackground);
  const points = player?.points || 0;

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0ea5e9', '#facc15', '#f43f5e', '#10b981'],
    });
  }, []);

  const clearTimers = () => {
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    if (hotTimerRef.current) clearInterval(hotTimerRef.current);
  };

  useEffect(() => () => clearTimers(), []);

  const finishSpin = async (type, payload, updates) => {
    clearTimers();

    setResults(payload);
    setPhase('result');
    setSpinType(type);
    setHotColor(null);
    setSpinHotTier(null);

    const collection = updates.collection ?? player.collection ?? {};
    const gachaPullCount = (player?.gachaPullCount || 0) + 1;
    await onPlayerUpdate?.({
      ...updates,
      gachaPullCount,
      achievements: computeAchievements({ ...player, ...updates, gachaPullCount }, collection),
      collectionCount: Object.keys(collection).filter((k) => collection[k] > 0).length,
    });

    playSE?.('gacha');
    triggerConfetti();
  };

  const startRewardSpin = (count) => {
    const cost = getRewardPullCost(count);
    if (!cost || points < cost) return;

    playDecideSound?.();
    const pulled = pullRewardItems(count);
    const { collection, newNames } = applyCollectionPulls(player.collection || {}, pulled);
    const updates = {
      points: points - cost,
      collection,
      newItems: mergeNewItems(player.newItems, newNames),
    };
    const hotTier = getHighestHotTierFromItems(pulled);

    setPhase('spinning');
    setSpinType('reward');
    setResults([]);
    setSpinHotTier(hotTier);

    if (hotTier) {
      playSE?.('legend');
      const hotStyle = getHotTierStyles(hotTier);
      setHotColor({ hex: hotStyle.border, tier: hotTier });
    } else {
      const colors = ['#3b82f6', '#22c55e', '#eab308', '#a855f7'];
      let i = 0;
      hotTimerRef.current = setInterval(() => {
        setHotColor({ hex: colors[i % colors.length], tier: null });
        i += 1;
      }, 120);
    }

    spinTimerRef.current = setTimeout(() => {
      finishSpin('reward', pulled, updates);
    }, SPIN_MS);
  };

  const startBackgroundSpin = (usePoints) => {
    if (usePoints) {
      if (points < 5000) return;
    } else if ((player.specialTickets || 0) < 1) {
      return;
    }

    const bg = pullBackground(player.backgrounds || ['default']);
    if (!bg) {
      alert('すべての はいけい を てにいれたよ！');
      return;
    }

    playDecideSound?.();
    const updates = usePoints
      ? { points: points - 5000, backgrounds: [...(player.backgrounds || ['default']), bg.id] }
      : {
          specialTickets: (player.specialTickets || 0) - 1,
          backgrounds: [...(player.backgrounds || ['default']), bg.id],
        };

    setPhase('spinning');
    setSpinType('bg');
    setPreviewBgActive(false);
    spinTimerRef.current = setTimeout(() => finishSpin('bg', bg, updates), SPIN_MS);
  };

  const startBgmSpin = (usePoints) => {
    if (usePoints) {
      if (points < 5000) return;
    } else if ((player.bgmTickets || 0) < 1) {
      return;
    }

    const bgm = pullBgm(player.unlockedBgms || ['default']);
    if (!bgm) {
      alert('すべての おんがく を てにいれたよ！');
      return;
    }

    playDecideSound?.();
    const updates = usePoints
      ? { points: points - 5000, unlockedBgms: [...(player.unlockedBgms || ['default']), bgm.id] }
      : {
          bgmTickets: (player.bgmTickets || 0) - 1,
          unlockedBgms: [...(player.unlockedBgms || ['default']), bgm.id],
        };

    setPhase('spinning');
    setSpinType('bgm');
    setPreviewBgActive(false);
    spinTimerRef.current = setTimeout(() => finishSpin('bgm', bgm, updates), SPIN_MS);
  };

  const startSeSpin = (usePoints) => {
    if (usePoints) {
      if (points < 5000) return;
    } else if ((player.seTickets || 0) < 1) {
      return;
    }

    const se = pullSe(player.unlockedSes || ['default']);
    if (!se) {
      alert('すべての 効果音 を てにいれたよ！');
      return;
    }

    playDecideSound?.();
    const updates = usePoints
      ? { points: points - 5000, unlockedSes: [...(player.unlockedSes || ['default']), se.id] }
      : {
          seTickets: (player.seTickets || 0) - 1,
          unlockedSes: [...(player.unlockedSes || ['default']), se.id],
        };

    setPhase('spinning');
    setSpinType('se');
    setPreviewBgActive(false);
    spinTimerRef.current = setTimeout(() => finishSpin('se', se, updates), SPIN_MS);
  };

  const startLegendSpin = (usePoints) => {
    if (usePoints) {
      if (points < 10000) return;
    } else if ((player.legendTickets || 0) < 1) {
      return;
    }

    playDecideSound?.();
    const item = pullLegendItem();
    const { collection, newNames } = applyCollectionPulls(player.collection || {}, [item]);
    const updates = usePoints
      ? {
          points: points - 10000,
          collection,
          newItems: mergeNewItems(player.newItems, newNames),
        }
      : {
          legendTickets: (player.legendTickets || 0) - 1,
          collection,
          newItems: mergeNewItems(player.newItems, newNames),
        };

    const hotTier = getHotColorForRarity(item.rarity).tier;

    setPhase('spinning');
    setSpinType('legend');
    setSpinHotTier(hotTier);
    setHotColor(getHotColorForRarity(item.rarity));
    if (hotTier) playSE?.('legend');
    spinTimerRef.current = setTimeout(() => finishSpin('legend', item, updates), SPIN_MS);
  };

  const backToShop = () => {
    playDecideSound?.();
    setPhase('shop');
    setSpinType(null);
    setResults([]);
    setHotColor(null);
    setSpinHotTier(null);
    setPreviewBgActive(false);
  };

  const handleBackHome = () => {
    playCancelSound?.();
    onBack?.();
  };

  const handleCosmeticPreview = () => {
    const item = Array.isArray(results) ? results[0] : results;
    if (!item) return;
    playDecideSound?.();

    if (spinType === 'bg') {
      setPreviewBgActive((prev) => !prev);
      return;
    }
    if (spinType === 'bgm') {
      previewBgm?.(item.id);
      return;
    }
    if (spinType === 'se') {
      previewSe?.(item.url);
    }
  };

  const handleCosmeticOpenSettings = () => {
    const item = Array.isArray(results) ? results[0] : results;
    if (!item) return;
    playDecideSound?.();

    if (spinType === 'bg') {
      onOpenProfile?.({ backgroundId: item.id });
      return;
    }
    if (spinType === 'bgm') {
      onOpenMusic?.({ bgmId: item.id });
      return;
    }
    if (spinType === 'se') {
      onOpenMusic?.({ seId: item.id });
    }
  };

  const renderSpinning = () => {
    if (spinType === 'reward' || spinType === 'legend') {
      const color = hotColor?.hex || '#eab308';
      return (
        <GachaSpinPanel accentColor={color}>
          {spinHotTier && <GachaHotThunder tier={spinHotTier} />}
          <div
            className="text-7xl sm:text-8xl animate-spin-shake drop-shadow-2xl transition-colors duration-200 relative z-10"
            style={{ filter: `drop-shadow(0 0 24px ${color})` }}
          >
            🎰
          </div>
          <GachaOverlayText color={color}>どんな ごほうび が でるかな...？</GachaOverlayText>
          {spinHotTier && <GachaHotBadge tier={spinHotTier} />}
        </GachaSpinPanel>
      );
    }
    if (spinType === 'bg') {
      return (
        <GachaSpinPanel accentColor="#10b981">
          <div className="text-7xl sm:text-8xl animate-spin-shake drop-shadow-2xl">🎨</div>
          <GachaOverlayText color="#059669">どんな はいけい が でるかな...？</GachaOverlayText>
        </GachaSpinPanel>
      );
    }
    if (spinType === 'bgm') {
      return (
        <GachaSpinPanel accentColor="#3b82f6">
          <div className="text-7xl sm:text-8xl animate-spin-shake drop-shadow-2xl">🎵</div>
          <GachaOverlayText color="#1d4ed8">どんな おんがく が でるかな...？</GachaOverlayText>
        </GachaSpinPanel>
      );
    }
    if (spinType === 'se') {
      return (
        <GachaSpinPanel accentColor="#06b6d4">
          <div className="text-7xl sm:text-8xl animate-spin-shake drop-shadow-2xl">🔊</div>
          <GachaOverlayText color="#0e7490">どんな 効果音 が でるかな...？</GachaOverlayText>
        </GachaSpinPanel>
      );
    }
    return null;
  };

  const renderResult = () => {
    const items = Array.isArray(results) ? results : [results];
    const isCosmeticResult = spinType === 'bg' || spinType === 'bgm' || spinType === 'se';
    const cosmeticItem = isCosmeticResult ? items[0] : null;
    const compact = items.length > 1;
    const gridClass =
      items.length >= 10
        ? 'grid-cols-5'
        : items.length > 4
          ? 'grid-cols-3 sm:grid-cols-5'
          : items.length > 1
            ? 'grid-cols-3'
            : 'grid-cols-1';

    return (
      <div className="relative flex flex-col items-center flex-1 min-h-0 w-full animate-fade-in">
        <div className="relative z-10 flex flex-col items-center flex-1 min-h-0 w-full gap-2 sm:gap-3">
          <div
            className="text-lg sm:text-xl font-black text-amber-700 px-4 py-1.5 rounded-2xl border-4 border-amber-400 bg-white/95 shadow-lg shrink-0"
            style={{ textShadow: '0 1px 0 rgba(255,255,255,0.8)' }}
          >
            🎉 おめでとう！ 🎉
          </div>

          {isCosmeticResult && cosmeticItem ? (
            <CosmeticGachaResult
              spinType={spinType}
              item={cosmeticItem}
              previewBgActive={previewBgActive}
              onPreview={handleCosmeticPreview}
              onOpenSettings={handleCosmeticOpenSettings}
            />
          ) : (
            <div className={`grid ${gridClass} gap-1.5 sm:gap-2 w-full max-w-2xl flex-1 min-h-0 content-start auto-rows-fr`}>
              {items.map((item, index) => (
                <ResultItemCard key={`${item.name || item.id}-${index}`} item={item} compact={compact} />
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md shrink-0 pt-1">
            <button
              type="button"
              onClick={backToShop}
              className="premium-button bg-amber-500 hover:bg-amber-600 text-white text-sm sm:text-base px-4 py-2 flex justify-center items-center gap-2 w-full"
            >
              🛍️ ショップにもどる
            </button>
            <button
              type="button"
              onClick={handleBackHome}
              className="text-gray-500 hover:text-gray-700 font-bold underline text-xs sm:text-sm py-1.5"
            >
              ひろばにもどる
            </button>
          </div>
        </div>
      </div>
    );
  };

  const resultItem = phase === 'result' ? (Array.isArray(results) ? results[0] : results) : null;
  const cosmeticPreviewUrl =
    previewBgActive && spinType === 'bg' && resultItem?.url ? resultItem.url : null;

  return (
    <div
      className="h-screen flex w-full relative bg-cover bg-center transition-all duration-1000 overflow-hidden"
      style={{ backgroundImage: `url(${activeBg.url})` }}
    >
      <GameSidebar
        player={player}
        onSaveAndTitle={onSaveAndTitle}
        onGoHome={handleBackHome}
        onShop={() => playDecideSound?.()}
        onProfile={onOpenProfile}
        onMusic={onOpenMusic}
        onZukan={onOpenZukan}
      />

      <main className="flex-1 h-full flex flex-col items-center justify-center min-h-0 p-2 sm:p-4 overflow-hidden">
        <div
          className={`w-full max-w-5xl xl:max-w-6xl flex flex-col rounded-3xl border-4 border-amber-300 shadow-2xl relative min-h-[420px] max-h-[88vh] p-3 sm:p-5 ${
            phase === 'result' || phase === 'spinning' ? 'overflow-hidden' : 'overflow-y-auto'
          } ${phase === 'result' || phase === 'spinning' ? 'justify-center' : ''}`}
          style={{
            backgroundImage: previewBgActive && cosmeticPreviewUrl
              ? `url(${cosmeticPreviewUrl})`
              : `url(${optimizedAssetUrl('/shop_bg.png')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {phase === 'shop' && (
            <>
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 mb-3 flex items-center justify-center gap-2 shadow-md shrink-0">
                <span className="text-sm sm:text-base font-black text-gray-700">もっている:</span>
                <span className="text-lg sm:text-xl font-black text-orange-500">🪙 {points} pt</span>
              </div>

              <div className="flex-1 overflow-x-auto pb-2">
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-3 min-w-[280px]">
                  <GachaMachine
                    badge="ごほうび"
                    badgeClass="bg-red-500"
                    image={optimizedAssetUrl('/gacha_normal.png')}
                    title="ごほうびガチャ"
                    subtitle="コレクションアイテム"
                  >
                    <TicketButton disabled={points < 100} onClick={() => startRewardSpin(1)} variant="points">
                      🪙 100 pt（1回）
                    </TicketButton>
                    <TicketButton disabled={points < 500} onClick={() => startRewardSpin(6)} variant="points">
                      🪙 500 pt（6回）
                    </TicketButton>
                    <TicketButton disabled={points < 1000} onClick={() => startRewardSpin(15)} variant="points">
                      🪙 1000 pt（15回）
                    </TicketButton>
                  </GachaMachine>

                  <GachaMachine
                    image={optimizedAssetUrl('/gacha_background.png')}
                    title="はいけいガチャ"
                    subtitle="背景テーマ"
                    ticketCount={player?.specialTickets || 0}
                    ticketLabel="🎨 もっている"
                  >
                    <TicketButton
                      disabled={(player?.specialTickets || 0) < 1}
                      onClick={() => startBackgroundSpin(false)}
                    >
                      🎟️ チケット 1枚
                    </TicketButton>
                    <TicketButton disabled={points < 5000} onClick={() => startBackgroundSpin(true)} variant="points">
                      🪙 5000 pt
                    </TicketButton>
                  </GachaMachine>

                  <GachaMachine
                    image={optimizedAssetUrl('/gacha_music.png')}
                    title="おんがくガチャ"
                    subtitle="BGMスキン"
                    ticketCount={player?.bgmTickets || 0}
                    ticketLabel="🎵 もっている"
                  >
                    <TicketButton disabled={(player?.bgmTickets || 0) < 1} onClick={() => startBgmSpin(false)}>
                      🎟️ チケット 1枚
                    </TicketButton>
                    <TicketButton disabled={points < 5000} onClick={() => startBgmSpin(true)} variant="points">
                      🪙 5000 pt
                    </TicketButton>
                  </GachaMachine>

                  <GachaMachine
                    image={optimizedAssetUrl('/gacha_se.png')}
                    title="こうかおんガチャ"
                    subtitle="効果音スキン"
                    ticketCount={player?.seTickets || 0}
                    ticketLabel="🔊 もっている"
                  >
                    <TicketButton disabled={(player?.seTickets || 0) < 1} onClick={() => startSeSpin(false)}>
                      🎟️ チケット 1枚
                    </TicketButton>
                    <TicketButton disabled={points < 5000} onClick={() => startSeSpin(true)} variant="points">
                      🪙 5000 pt
                    </TicketButton>
                  </GachaMachine>

                  <GachaMachine
                    badge="超激レア以上"
                    badgeClass="bg-fuchsia-500 animate-pulse"
                    image={optimizedAssetUrl('/gacha_legend.png')}
                    title="超激レア以上ガチャ"
                    subtitle="超激レア以上 確定！"
                    ticketCount={player?.legendTickets || 0}
                    ticketLabel="🌟 もっている"
                  >
                    <TicketButton
                      disabled={(player?.legendTickets || 0) < 1}
                      onClick={() => startLegendSpin(false)}
                      variant="ticket"
                    >
                      🎟️ チケット 1枚
                    </TicketButton>
                    <TicketButton disabled={points < 10000} onClick={() => startLegendSpin(true)} variant="points">
                      🪙 10000 pt
                    </TicketButton>
                  </GachaMachine>
                </div>
              </div>

              <div className="flex justify-center shrink-0 pt-2">
                <button
                  type="button"
                  onClick={handleBackHome}
                  className="bg-white/95 border-2 border-gray-300 text-gray-500 font-black rounded-xl text-xs px-4 py-1.5 hover:bg-gray-50 hover:border-gray-400 shadow-md transition-all active:scale-95"
                >
                  ひろばにもどる
                </button>
              </div>
            </>
          )}

          {phase === 'spinning' && renderSpinning()}
          {phase === 'result' && renderResult()}
        </div>
      </main>

      <CollectionSidebar player={player} />
    </div>
  );
}
