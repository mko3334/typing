import React, { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { resolveBackground } from '../constants';
import {
  applyCollectionPulls,
  computeAchievements,
  getHotColorForRarity,
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
  onLogout,
  onOpenProfile,
  onOpenMusic,
  playDecideSound,
  playCancelSound,
  playSE,
}) {
  const [phase, setPhase] = useState('shop');
  const [spinType, setSpinType] = useState(null);
  const [results, setResults] = useState([]);
  const [hotColor, setHotColor] = useState(null);
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

    const collection = updates.collection ?? player.collection ?? {};
    await onPlayerUpdate?.({
      ...updates,
      achievements: computeAchievements({ ...player, ...updates }, collection),
      collectionCount: Object.keys(collection).filter((k) => collection[k] > 0).length,
    });

    playSE?.('gacha');
    const isHighRarity = Array.isArray(payload)
      ? payload.some((item) => item.rarity === '✨レジェンド✨' || item.rarity === '✨激レア✨')
      : payload?.rarity === '✨レジェンド✨' || payload?.rarity === '✨激レア✨';
    if (isHighRarity) playSE?.('legend');
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

    setPhase('spinning');
    setSpinType('reward');
    setResults([]);
    const colors = ['#3b82f6', '#22c55e', '#eab308', '#a855f7'];
    let i = 0;
    hotTimerRef.current = setInterval(() => {
      setHotColor({ hex: colors[i % colors.length], name: 'cycle' });
      i += 1;
    }, 120);

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

    setPhase('spinning');
    setSpinType('legend');
    setHotColor(getHotColorForRarity(item.rarity));
    spinTimerRef.current = setTimeout(() => finishSpin('legend', item, updates), SPIN_MS);
  };

  const backToShop = () => {
    playDecideSound?.();
    setPhase('shop');
    setSpinType(null);
    setResults([]);
    setHotColor(null);
  };

  const handleBackHome = () => {
    playCancelSound?.();
    onBack?.();
  };

  const renderSpinning = () => {
    if (spinType === 'reward' || spinType === 'legend') {
      const color = hotColor?.hex || '#facc15';
      return (
        <div className="flex flex-col items-center relative py-8">
          <div
            className="text-8xl animate-spin-shake drop-shadow-2xl transition-colors duration-200"
            style={{ filter: `drop-shadow(0 0 24px ${color})` }}
          >
            🎰
          </div>
          <p className="text-xl sm:text-2xl font-black mt-8 animate-pulse" style={{ color }}>
            どんな ごほうび が でるかな...？
          </p>
        </div>
      );
    }
    if (spinType === 'bg') {
      return (
        <div className="flex flex-col items-center py-8">
          <div className="text-8xl animate-spin-shake drop-shadow-2xl">🎨</div>
          <p className="text-xl sm:text-2xl font-black text-emerald-500 mt-8 animate-pulse">
            どんな はいけい が でるかな...？
          </p>
        </div>
      );
    }
    if (spinType === 'bgm') {
      return (
        <div className="flex flex-col items-center py-8">
          <div className="text-8xl animate-spin-shake drop-shadow-2xl">🎵</div>
          <p className="text-xl sm:text-2xl font-black text-blue-500 mt-8 animate-pulse">
            どんな おんがく が でるかな...？
          </p>
        </div>
      );
    }
    if (spinType === 'se') {
      return (
        <div className="flex flex-col items-center py-8">
          <div className="text-8xl animate-spin-shake drop-shadow-2xl">🔊</div>
          <p className="text-xl sm:text-2xl font-black text-cyan-500 mt-8 animate-pulse">
            どんな 効果音 が でるかな...？
          </p>
        </div>
      );
    }
    return null;
  };

  const renderResult = () => {
    const items = Array.isArray(results) ? results : [results];

    return (
      <div className="flex flex-col items-center gap-4 py-4 animate-fade-in">
        <h3 className="text-xl sm:text-2xl font-black text-amber-600">🎉 おめでとう！ 🎉</h3>
        <div className={`grid gap-3 ${items.length > 1 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'} max-w-lg`}>
          {items.map((item, index) => {
            if (item.emoji) {
              const isLegend = item.rarity === '✨レジェンド✨';
              return (
                <div
                  key={`${item.name}-${index}`}
                  className={`p-4 rounded-2xl flex flex-col items-center bg-white ${isLegend ? 'legend-card' : ''}`}
                  style={
                    isLegend
                      ? { boxShadow: '0 4px 20px #a855f780' }
                      : { border: `3px solid ${item.color}`, boxShadow: `0 4px 14px ${item.color}50` }
                  }
                >
                  <div className="text-5xl mb-2">{item.emoji}</div>
                  <div className="text-xs font-black text-gray-700 text-center">{item.name}</div>
                  <div className={`text-[10px] font-black mt-1 ${item.foil ? 'foil-effect' : ''}`} style={item.foil ? {} : { color: item.color }}>
                    {item.rarity.replace(/✨|🌟|🔥|⭐/g, '')}
                  </div>
                </div>
              );
            }
            if (item.url && item.name) {
              return (
                <div key={`${item.id || item.name}-${index}`} className="p-3 rounded-2xl bg-white border-4 border-sky-200 flex flex-col items-center gap-2">
                  {item.url.includes('.mp3') ? (
                    <div className="text-5xl">🎵</div>
                  ) : (
                    <img src={item.url} alt={item.name} className="w-20 h-14 object-cover rounded-lg border-2 border-white shadow" />
                  )}
                  <div className="text-xs font-black text-gray-700 text-center">{item.name}</div>
                </div>
              );
            }
            return null;
          })}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mt-2">
          <button
            type="button"
            onClick={backToShop}
            className="premium-button bg-amber-500 hover:bg-amber-600 text-white text-base px-6 py-2.5 flex justify-center items-center gap-2 w-full"
          >
            🛍️ ショップにもどる
          </button>
          <button
            type="button"
            onClick={handleBackHome}
            className="text-gray-400 hover:text-gray-600 font-bold underline text-sm py-2"
          >
            ひろばにもどる
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="h-screen flex w-full relative bg-cover bg-center transition-all duration-1000 overflow-hidden"
      style={{ backgroundImage: `url(${activeBg.url})` }}
    >
      <GameSidebar
        player={player}
        onSaveAndTitle={onLogout}
        onGoHome={handleBackHome}
        onShop={() => playDecideSound?.()}
        onProfile={onOpenProfile}
        onMusic={onOpenMusic}
      />

      <main className="flex-1 h-full flex flex-col items-center justify-center min-h-0 p-2 sm:p-4 overflow-hidden">
        <div
          className="w-full max-w-5xl xl:max-w-6xl flex flex-col rounded-3xl border-4 border-amber-300 shadow-2xl relative min-h-[420px] max-h-[88vh] overflow-y-auto p-3 sm:p-5"
          style={{
            backgroundImage: 'url(/shop_bg.png)',
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
                    image="/gacha_normal.png"
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
                    image="/gacha_background.png"
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
                    image="/gacha_music.png"
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
                    image="/gacha_se.png"
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
                    badge="激レア確定"
                    badgeClass="bg-fuchsia-500 animate-pulse"
                    image="/gacha_legend.png"
                    title="激レア確定ガチャ"
                    subtitle="レアごほうび確定！"
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
