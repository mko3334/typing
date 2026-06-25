import React, { useState, useEffect, useCallback } from 'react';
import { resolveBackground } from '../constants';
import { optimizedAssetUrl } from '../utils/assetImages';
import {
  calcSubEventReward,
  getSubEventById,
  getActivePlazaSubEvents,
  ticketUpdatesFromReward,
} from '../utils/subEvents';
import { computeAchievements } from '../utils/gacha';
import GameSidebar from './GameSidebar';
import DifficultySelector from './DifficultySelector';
import AssistSettingsModal from './AssistSettingsModal';
import WordRequestModal from './WordRequestModal';
import SubEventModal from './SubEventModal';
import SubEventRewardModal from './SubEventRewardModal';

function MallPin({ top, left, label, onClick, variant = 'pill', delay = '0s', large = false }) {
  const pillClass =
    variant === 'gradient-sky'
      ? 'bg-gradient-to-r from-sky-400 to-indigo-500 border-2 border-white px-4 py-2 rounded-2xl text-sm sm:text-base font-black text-white shadow-xl'
      : variant === 'gradient-orange'
        ? 'bg-gradient-to-r from-orange-400 to-rose-400 border-2 border-white px-3 py-2 rounded-2xl text-sm sm:text-base font-black text-white shadow-xl'
        : `bg-white/95 border-2 px-3 py-1 rounded-full text-xs font-black shadow-md whitespace-nowrap ${
            variant === 'pink'
              ? 'border-pink-400 text-pink-600'
              : variant === 'emerald'
                ? 'border-emerald-400 text-emerald-600'
                : variant === 'purple'
                  ? 'border-purple-400 text-purple-600'
                  : variant === 'yellow'
                    ? 'border-yellow-400 text-yellow-600'
                    : 'border-orange-400 text-orange-600'
          }`;

  const arrowColor =
    variant === 'gradient-sky'
      ? 'bg-sky-400 border-r border-b border-white shadow-md'
      : variant === 'gradient-orange'
        ? 'bg-orange-400 border-r border-b border-white shadow-md'
        : variant === 'pink'
          ? 'bg-pink-400 shadow-sm'
          : variant === 'emerald'
            ? 'bg-emerald-400 shadow-sm'
            : variant === 'purple'
              ? 'bg-purple-400 shadow-sm'
              : variant === 'yellow'
                ? 'bg-yellow-400 shadow-sm'
                : 'bg-orange-400 shadow-sm';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center hover:scale-105 active:scale-95 transition-all z-10 ${
        large ? 'scale-95 sm:scale-110 hover:scale-115 z-20' : 'scale-90 sm:scale-100'
      }`}
      style={{ top, left }}
    >
      <div className={`${pillClass} animate-bounce`} style={{ animationDelay: delay }}>
        {label}
      </div>
      <div className={`w-4 h-4 rotate-45 -mt-2 ${arrowColor}`} />
    </button>
  );
}

function SubEventPin({ top, left, emoji, image, title, delay, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-[12] group hover:scale-110 active:scale-95 transition-transform duration-200 animate-bounce"
      style={{ top, left, animationDelay: delay }}
    >
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-[3px] border-yellow-400 overflow-hidden shadow-lg bg-white relative">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center text-3xl sm:text-4xl">
            {emoji}
          </div>
        )}
      </div>
    </button>
  );
}

export default function HomeScreen({
  player,
  assistSettings,
  onAssistChange,
  onStartTyping,
  onSaveAndTitle,
  onOpenProfile,
  onOpenMusic,
  onOpenShop,
  onOpenZukan,
  onOpenHiragana,
  onOpenAnnouncements,
  announcementUnread = false,
  onPlayerUpdate,
  playDecideSound,
  playCancelSound,
  playSE,
}) {
  const [toast, setToast] = useState('');
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);
  const [isAssistOpen, setIsAssistOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [activeSubEvents, setActiveSubEvents] = useState([]);
  const [activeSubEvent, setActiveSubEvent] = useState(null);
  const [subEventReward, setSubEventReward] = useState(null);
  const [mallImageReady, setMallImageReady] = useState(false);
  const activeBg = resolveBackground(player?.currentBackground);
  const mallImageUrl = optimizedAssetUrl('/mall_home_bg.png');

  useEffect(() => {
    setMallImageReady(false);
  }, [mallImageUrl]);

  useEffect(() => {
    if (!player?.id) return;
    setActiveSubEvents(getActivePlazaSubEvents(player));
  }, [player?.id, player?.plazaSubEvents, player?.solvedSubEventIds]);

  const openSubEvent = (spawned) => {
    const event = getSubEventById(spawned.eventId);
    if (!event) return;
    playDecideSound?.();
    setActiveSubEvent(event);
  };

  const closeSubEvent = () => {
    setActiveSubEvent(null);
  };

  const handleSubEventComplete = useCallback(
    (event) => {
      const rewardRoll = calcSubEventReward();
      const solvedIds = [...new Set([...(player.solvedSubEventIds || []), event.id])];
      const remaining = activeSubEvents.filter((entry) => entry.eventId !== event.id);

      const ticketDelta = ticketUpdatesFromReward(rewardRoll.ticket);

      const updates = {
        points: (player.points || 0) + rewardRoll.points,
        solvedSubEventIds: solvedIds,
        plazaSubEvents: remaining,
        ...Object.fromEntries(
          Object.entries(ticketDelta).map(([key, count]) => [key, (player[key] || 0) + count]),
        ),
      };
      updates.achievements = computeAchievements({ ...player, ...updates }, player.collection || {});

      onPlayerUpdate?.(updates);
      setActiveSubEvents(remaining);
      setActiveSubEvent(null);
      setSubEventReward({
        title: event.title,
        titleDisplay: event.titleDisplay || event.title,
        emoji: event.emoji,
        image: event.image,
        points: rewardRoll.points,
        ticket: rewardRoll.ticket,
      });
      playSE?.('clear');
    },
    [activeSubEvents, onPlayerUpdate, playSE, player],
  );

  const showComingSoon = (name) => {
    playDecideSound?.();
    setToast(`${name}は 準備中です`);
    setTimeout(() => setToast(''), 2000);
  };

  const openDifficulty = () => {
    playDecideSound?.();
    setIsDifficultyOpen(true);
  };

  const handleDifficultySelect = (modeId) => {
    setIsDifficultyOpen(false);
    if (modeId === 'hiragana') {
      onOpenHiragana?.();
      return;
    }
    onStartTyping(modeId);
  };

  return (
    <div
      className="h-screen flex w-full relative bg-cover bg-center transition-all duration-1000 overflow-hidden"
      style={{ backgroundImage: `url(${activeBg.url})` }}
    >
      <GameSidebar
        player={player}
        onSaveAndTitle={onSaveAndTitle}
        onGoHome={() => playDecideSound?.()}
        onShop={onOpenShop}
        onProfile={onOpenProfile}
        onZukan={onOpenZukan}
        onMusic={onOpenMusic}
        onAnnouncements={onOpenAnnouncements}
        announcementUnread={announcementUnread}
        onAssist={() => {
          playDecideSound?.();
          setIsAssistOpen(true);
        }}
      />

      <main className="flex-1 h-full flex flex-col items-center justify-center min-h-0 p-2 animate-fade-in overflow-hidden">
        <div className="relative w-full aspect-square max-w-[90vh] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl rounded-3xl overflow-hidden shadow-2xl border-4 border-yellow-300 bg-gradient-to-br from-sky-100 via-amber-50 to-indigo-100">
          <img
            src={mallImageUrl}
            alt="ショッピングモール"
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              mallImageReady ? 'opacity-100' : 'opacity-0'
            }`}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            onLoad={() => setMallImageReady(true)}
          />
          <div className="absolute inset-0 bg-black/5" />

          <button
            type="button"
            onClick={() => showComingSoon('新エリア')}
            className="absolute top-4 right-4 z-30 px-4 py-2 bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-500 hover:to-indigo-600 text-white font-black text-xs sm:text-sm rounded-full shadow-lg border-2 border-white flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all cursor-pointer animate-pulse"
          >
            <span>🏬</span> 新エリアへ
          </button>

          <MallPin top="28%" left="12%" label="🎁 ショップ" variant="pink" onClick={onOpenShop} />
          <MallPin
            top="18%"
            left="45%"
            label="🎵 おんがく"
            variant="emerald"
            delay="0.2s"
            onClick={onOpenMusic}
          />
          <MallPin
            top="52%"
            left="40%"
            label="👗 みためへんこう"
            variant="purple"
            delay="0.4s"
            onClick={onOpenProfile}
          />
          <MallPin
            top="38%"
            left="72%"
            label="✨ アシスト設定"
            variant="yellow"
            delay="0.6s"
            onClick={() => {
              playDecideSound?.();
              setIsAssistOpen(true);
            }}
          />
          <MallPin
            top="78%"
            left="78%"
            label="⌨️ タイピングで あそぶ！"
            variant="gradient-sky"
            delay="1.0s"
            large
            onClick={openDifficulty}
          />
          <MallPin
            top="28%"
            left="84%"
            label="📮 リクエスト"
            variant="orange"
            delay="0.8s"
            onClick={() => {
              playDecideSound?.();
              setIsRequestOpen(true);
            }}
          />

          {activeSubEvents.map((spawned) => {
            const event = getSubEventById(spawned.eventId);
            if (!event) return null;
            return (
              <SubEventPin
                key={spawned.eventId}
                top={spawned.top}
                left={spawned.left}
                emoji={event.emoji}
                image={event.image}
                title={event.title}
                delay={spawned.delay || '0s'}
                onClick={() => openSubEvent(spawned)}
              />
            );
          })}
        </div>
      </main>

      <DifficultySelector
        isOpen={isDifficultyOpen}
        onSelect={handleDifficultySelect}
        onClose={() => setIsDifficultyOpen(false)}
        playDecideSound={playDecideSound}
        playCancelSound={playCancelSound}
      />

      <AssistSettingsModal
        isOpen={isAssistOpen}
        settings={assistSettings}
        onChange={onAssistChange}
        onClose={() => setIsAssistOpen(false)}
      />

      <WordRequestModal
        isOpen={isRequestOpen}
        player={player}
        onClose={() => setIsRequestOpen(false)}
        playDecideSound={playDecideSound}
      />

      {activeSubEvent && (
        <SubEventModal
          event={activeSubEvent}
          player={player}
          assistSettings={assistSettings}
          onClose={closeSubEvent}
          onComplete={handleSubEventComplete}
          playSE={playSE}
          playCancelSound={playCancelSound}
        />
      )}

      <SubEventRewardModal
        reward={subEventReward}
        onClose={() => setSubEventReward(null)}
        playDecideSound={playDecideSound}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 text-white px-5 py-3 rounded-2xl font-black text-sm shadow-xl animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
