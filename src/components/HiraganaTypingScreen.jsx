import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, BarChart3, Shuffle, ListOrdered } from 'lucide-react';
import { FINGER_MAP, KEYBOARD_ROWS, resolveBackground } from '../constants';
import { HIRAGANA_ROWS } from '../data/hiraganaRows';
import {
  buildPracticeQueue,
  getCurrentStageRowIndex,
  getRomajiList,
  getRowSummary,
  getWeakChars,
  isRomajiComplete,
  isRowCleared,
  isRowUnlockedForStage,
  matchesRomajiInput,
  normalizeHiraganaProgress,
  recordCharResult,
} from '../utils/hiraganaTyping';
import {
  applyHiraganaRewardToPlayer,
  buildOrderTestCompleteReward,
  buildShuffleCompleteReward,
  buildStageClearReward,
} from '../utils/hiraganaRewards';
import GameSidebar from './GameSidebar';
import HiraganaRewardModal from './HiraganaRewardModal';
import {
  HiraganaHero,
  HiraganaInfoChip,
  HiraganaKanaBubble,
  HiraganaPopPanel,
  HiraganaPrimaryButton,
  HiraganaProgressPills,
  HiraganaSceneBackdrop,
  HiraganaStageCard,
  HiraganaTabButton,
} from './hiragana/HiraganaVisuals';

function VirtualKeyboard({ assistSettings, nextChar, shake }) {
  const formatChar = (c) => (assistSettings?.letterCase === 'upper' ? c.toUpperCase() : c);

  return (
    <div className={`mt-3 w-full max-w-xl shrink-0 ${shake ? 'animate-shake' : ''}`}>
      <div className="bg-white/85 backdrop-blur-md p-3 rounded-[1.5rem] shadow-lg border-4 border-white/70">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex justify-center mb-1 gap-0.5 sm:gap-1"
            style={{ paddingLeft: rowIndex === 3 ? '0.2rem' : `${rowIndex * 0.8}rem` }}
          >
            {row.map((key) => {
              const isNext =
                assistSettings?.keyboardHighlight &&
                (key === nextChar ||
                  (key === '1' && nextChar === '!') ||
                  (key === '/' && nextChar === '?'));
              const finger = FINGER_MAP[key?.toLowerCase()];
              let cls = 'bg-white/90 text-gray-700 border-gray-200';
              if (isNext) {
                cls =
                  finger?.hand === 'left'
                    ? 'bg-blue-500 text-white border-blue-700 animate-pulse'
                    : finger?.hand === 'right'
                      ? 'bg-red-500 text-white border-red-700 animate-pulse'
                      : 'bg-yellow-400 text-yellow-900 border-yellow-600 animate-pulse';
              }
              return (
                <div
                  key={key}
                  className={`min-w-[1.35rem] sm:min-w-[1.85rem] h-7 sm:h-9 px-0.5 rounded-lg border-b-[3px] font-black text-[9px] sm:text-xs flex items-center justify-center ${cls}`}
                >
                  {key === 'Shift' ? 'Shift' : formatChar(key)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HiraganaTypingScreen({
  player,
  assistSettings,
  onAssistChange,
  onPlayerUpdate,
  onBack,
  onSaveAndTitle,
  onOpenProfile,
  onOpenMusic,
  onOpenShop,
  onOpenZukan,
  onOpenAnnouncements,
  announcementUnread = false,
  playDecideSound,
  playCancelSound,
  playSE,
}) {
  const progress = useMemo(
    () => normalizeHiraganaProgress(player?.hiraganaProgress),
    [player?.hiraganaProgress],
  );

  const [menuTab, setMenuTab] = useState('stage');
  const [phase, setPhase] = useState('menu');
  const [playMode, setPlayMode] = useState('stage');
  const [selectedRowIds, setSelectedRowIds] = useState(['a']);
  const [testMode, setTestMode] = useState('order');
  const [selectedStageRowId, setSelectedStageRowId] = useState(HIRAGANA_ROWS[0].id);
  const [activeStageRowId, setActiveStageRowId] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [typedChars, setTypedChars] = useState('');
  const [stageCharIndex, setStageCharIndex] = useState(0);
  const [sessionMisses, setSessionMisses] = useState(0);
  const [charStats, setCharStats] = useState(progress.charStats);
  const [clearedRowIds, setClearedRowIds] = useState(progress.clearedRowIds);
  const [pendingReward, setPendingReward] = useState(null);
  const [rewardStats, setRewardStats] = useState(null);
  const [shake, setShake] = useState(false);
  const [isAssistOpen, setIsAssistOpen] = useState(false);

  const stageRowIndex = getCurrentStageRowIndex(clearedRowIds);
  const stageRow = HIRAGANA_ROWS[Math.min(stageRowIndex, HIRAGANA_ROWS.length - 1)];
  const allStagesClear = clearedRowIds.length >= HIRAGANA_ROWS.length;

  const selectedStageRow = useMemo(
    () => HIRAGANA_ROWS.find((row) => row.id === selectedStageRowId) || stageRow,
    [selectedStageRowId, stageRow],
  );
  const activeStageRow = useMemo(
    () => HIRAGANA_ROWS.find((row) => row.id === activeStageRowId) || selectedStageRow,
    [activeStageRowId, selectedStageRow],
  );
  const selectedStageIndex = HIRAGANA_ROWS.findIndex((row) => row.id === selectedStageRow.id);
  const canStartSelectedStage = isRowUnlockedForStage(selectedStageIndex, clearedRowIds);
  const isSelectedStageReplay = isRowCleared(selectedStageRow.id, clearedRowIds);

  useEffect(() => {
    if (phase !== 'menu') return;
    setSelectedStageRowId((prev) => {
      const prevIndex = HIRAGANA_ROWS.findIndex((row) => row.id === prev);
      if (prevIndex >= 0 && isRowUnlockedForStage(prevIndex, clearedRowIds)) return prev;
      return stageRow.id;
    });
  }, [clearedRowIds, phase, stageRow.id]);

  const currentKana = useMemo(() => {
    if (playMode === 'stage') return activeStageRow.chars[stageCharIndex];
    return queue[queueIndex]?.kana || '';
  }, [activeStageRow.chars, playMode, queue, queueIndex, stageCharIndex]);

  const validRomaji = useMemo(() => getRomajiList(currentKana), [currentKana]);
  const isTestPlay = playMode === 'order' || playMode === 'shuffle';
  const playAssistSettings = useMemo(
    () =>
      isTestPlay
        ? { ...assistSettings, showRomajiHint: false, keyboardHighlight: false }
        : assistSettings,
    [assistSettings, isTestPlay],
  );
  const displayRomaji =
    playAssistSettings?.showRomajiHint !== false ? validRomaji[0] || '' : '';
  const nextChar = typedChars.length < (validRomaji[0]?.length || 0)
    ? validRomaji[0]?.[typedChars.length]?.toLowerCase()
    : '';

  const persistProgress = useCallback(
    (nextCleared, nextStats, extraProgress = {}) => {
      setClearedRowIds(nextCleared);
      setCharStats(nextStats);
      onPlayerUpdate?.({
        hiraganaProgress: {
          clearedRowIds: nextCleared,
          charStats: nextStats,
          allRowsRewardClaimed: progress.allRowsRewardClaimed,
          shuffleClearCount: progress.shuffleClearCount,
          ...extraProgress,
        },
      });
    },
    [onPlayerUpdate, progress.allRowsRewardClaimed, progress.shuffleClearCount],
  );

  const grantReward = useCallback(
    (reward, progressPatch, stats) => {
      const updated = applyHiraganaRewardToPlayer(player, reward, progressPatch);
      setClearedRowIds(updated.hiraganaProgress.clearedRowIds);
      setCharStats(updated.hiraganaProgress.charStats);
      onPlayerUpdate?.({
        points: updated.points,
        specialTickets: updated.specialTickets,
        bgmTickets: updated.bgmTickets,
        seTickets: updated.seTickets,
        legendTickets: updated.legendTickets,
        achievements: updated.achievements,
        hiraganaProgress: updated.hiraganaProgress,
      });
      setRewardStats(stats);
      setPendingReward(reward);
    },
    [onPlayerUpdate, player],
  );

  const startStage = () => {
    if (!canStartSelectedStage) return;
    playDecideSound?.();
    setActiveStageRowId(selectedStageRow.id);
    setPlayMode('stage');
    setPhase('play');
    setStageCharIndex(0);
    setTypedChars('');
    setSessionMisses(0);
  };

  const startTest = () => {
    if (selectedRowIds.length === 0) return;
    playDecideSound?.();
    const built = buildPracticeQueue(selectedRowIds, testMode);
    if (built.length === 0) return;
    setPlayMode(testMode === 'shuffle' ? 'shuffle' : 'order');
    setQueue(built);
    setQueueIndex(0);
    setTypedChars('');
    setSessionMisses(0);
    setPhase('play');
  };

  const advanceAfterCorrect = useCallback(() => {
    const nextStats = recordCharResult(charStats, currentKana, true);
    setCharStats(nextStats);

    if (playMode === 'stage') {
      const nextIndex = stageCharIndex + 1;
      if (nextIndex >= activeStageRow.chars.length) {
        const wasFirstClear = !clearedRowIds.includes(activeStageRow.id);
        const nextCleared = wasFirstClear ? [...clearedRowIds, activeStageRow.id] : clearedRowIds;
        const allRowsJustCompleted =
          nextCleared.length >= HIRAGANA_ROWS.length && clearedRowIds.length < HIRAGANA_ROWS.length;
        const reward = buildStageClearReward({
          row: activeStageRow,
          isFirstClear: wasFirstClear,
          allRowsJustCompleted,
          allRowsRewardClaimed: progress.allRowsRewardClaimed,
        });
        const progressPatch = {
          clearedRowIds: nextCleared,
          charStats: nextStats,
          shuffleClearCount: progress.shuffleClearCount,
          allRowsRewardClaimed:
            progress.allRowsRewardClaimed ||
            (allRowsJustCompleted && Object.keys(reward.tickets).length > 0),
        };
        const accuracy =
          activeStageRow.chars.length + sessionMisses > 0
            ? Math.round(
                (activeStageRow.chars.length / (activeStageRow.chars.length + sessionMisses)) * 100,
              )
            : 100;
        grantReward(reward, progressPatch, { misses: sessionMisses, accuracy });
        setTypedChars('');
        playSE?.('clear');
        return;
      }
      setStageCharIndex(nextIndex);
      setTypedChars('');
      playSE?.('type');
      return;
    }

    const nextQueueIndex = queueIndex + 1;
    if (nextQueueIndex >= queue.length) {
      const accuracy =
        queue.length + sessionMisses > 0
          ? Math.round((queue.length / (queue.length + sessionMisses)) * 100)
          : 100;
      const progressPatch = {
        clearedRowIds,
        charStats: nextStats,
        shuffleClearCount:
          playMode === 'shuffle' ? progress.shuffleClearCount + 1 : progress.shuffleClearCount,
        allRowsRewardClaimed: progress.allRowsRewardClaimed,
      };
      const reward =
        playMode === 'shuffle' ? buildShuffleCompleteReward() : buildOrderTestCompleteReward();
      grantReward(reward, progressPatch, { misses: sessionMisses, accuracy });
      setTypedChars('');
      playSE?.('clear');
      return;
    }
    setQueueIndex(nextQueueIndex);
    setTypedChars('');
    playSE?.('type');
  }, [
    charStats,
    clearedRowIds,
    currentKana,
    grantReward,
    playMode,
    playSE,
    progress.allRowsRewardClaimed,
    progress.shuffleClearCount,
    queue.length,
    queueIndex,
    sessionMisses,
    stageCharIndex,
    activeStageRow,
  ]);

  const handleMiss = useCallback(() => {
    setSessionMisses((prev) => prev + 1);
    setCharStats((prev) => recordCharResult(prev, currentKana, false));
    setTypedChars('');
    setShake(true);
    playSE?.('miss');
    setTimeout(() => setShake(false), 400);
  }, [currentKana, playSE]);

  useEffect(() => {
    if (phase !== 'play' || !currentKana) return undefined;

    const onKeyDown = (e) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Shift') return;
      if (!/^[a-zA-Z0-9\-]$/.test(e.key)) return;

      const inputChar = e.key.toLowerCase();
      const candidate = typedChars + inputChar;

      if (!matchesRomajiInput(currentKana, candidate)) {
        handleMiss();
        return;
      }

      setTypedChars(candidate);
      if (isRomajiComplete(currentKana, candidate)) {
        setTimeout(() => advanceAfterCorrect(), 80);
      } else {
        playSE?.('type');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [advanceAfterCorrect, currentKana, handleMiss, phase, playSE, typedChars]);

  const toggleRowSelection = (rowId) => {
    setSelectedRowIds((prev) =>
      prev.includes(rowId) ? prev.filter((id) => id !== rowId) : [...prev, rowId],
    );
  };

  const weakChars = getWeakChars(charStats);

  if (phase === 'play') {
    const playRow = playMode === 'stage' ? activeStageRow : HIRAGANA_ROWS.find((r) => r.id === queue[queueIndex]?.rowId) || activeStageRow;

    return (
      <div
        className="h-screen flex w-full relative overflow-hidden"
        style={{ backgroundImage: `url(${resolveBackground(player?.currentBackground).url})` }}
      >
        <div className="absolute inset-0 hiragana-scene-bg opacity-90 pointer-events-none" />
        <GameSidebar
          player={player}
          onSaveAndTitle={onSaveAndTitle}
          onGoHome={() => {
            playCancelSound?.();
            setPhase('menu');
          }}
          onShop={onOpenShop}
          onProfile={onOpenProfile}
          onZukan={onOpenZukan}
          onMusic={onOpenMusic}
          onAssist={() => setIsAssistOpen(true)}
          showAssist={!isTestPlay}
          onAnnouncements={onOpenAnnouncements}
          announcementUnread={announcementUnread}
        />

        <main className="relative z-[1] flex-1 flex flex-col items-center justify-center p-3 min-h-0 overflow-y-auto">
          <HiraganaPopPanel className="w-full max-w-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  playCancelSound?.();
                  setPhase('menu');
                  persistProgress(clearedRowIds, charStats);
                }}
                className="flex items-center gap-1 text-sm font-black text-indigo-600 hover:text-pink-600 bg-white/80 px-3 py-1.5 rounded-full border-2 border-indigo-100"
              >
                <ArrowLeft className="w-4 h-4" /> もどる
              </button>
              <span className={`text-xs font-black px-3 py-1.5 rounded-full border-2 border-white shadow-sm bg-gradient-to-r ${playRow.theme} text-white`}>
                {playMode === 'stage'
                  ? `${playRow.emoji} ${activeStageRow.label}`
                  : testMode === 'shuffle'
                    ? '🎲 シャッフルテスト'
                    : '📝 じゅんばんテスト'}
              </span>
              <span className="text-xs font-black text-rose-600 bg-rose-50 border-2 border-rose-200 px-2.5 py-1 rounded-full">
                ミス {sessionMisses}
              </span>
            </div>

            {playMode === 'stage' && (
              <HiraganaProgressPills chars={activeStageRow.chars} currentIndex={stageCharIndex} />
            )}

            <HiraganaKanaBubble
              kana={currentKana}
              row={playRow}
              isTestPlay={isTestPlay}
              displayRomaji={displayRomaji}
              typedChars={typedChars}
              shake={shake}
            />

            {playMode !== 'stage' && (
              <p className="text-center text-xs font-black text-indigo-500 mt-3 bg-indigo-50 border border-indigo-100 rounded-full py-1">
                {queueIndex + 1} / {queue.length} もん
              </p>
            )}

            <VirtualKeyboard assistSettings={playAssistSettings} nextChar={nextChar} shake={shake} />
            <p className="text-center text-[10px] font-black text-pink-500 mt-3">
              ⌨️ キーボードで ローマ字を うってね！
            </p>
          </HiraganaPopPanel>
        </main>

        {pendingReward && (
          <HiraganaRewardModal
            reward={pendingReward}
            stats={rewardStats}
            playDecideSound={playDecideSound}
            onClose={() => {
              const kind = pendingReward.kind;
              const isFirstClear = pendingReward.isFirstClear === true;
              setPendingReward(null);
              setRewardStats(null);
              if (kind === 'stage') {
                setStageCharIndex(0);
                setTypedChars('');
                setSessionMisses(0);
                setActiveStageRowId(null);
                const continueNext =
                  isFirstClear && clearedRowIds.length < HIRAGANA_ROWS.length;
                if (continueNext) {
                  const nextRow = HIRAGANA_ROWS[getCurrentStageRowIndex(clearedRowIds)];
                  setActiveStageRowId(nextRow.id);
                  setSelectedStageRowId(nextRow.id);
                } else {
                  setPhase('menu');
                }
              } else {
                setPhase('menu');
              }
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="h-screen flex w-full relative overflow-hidden"
      style={{ backgroundImage: `url(${resolveBackground(player?.currentBackground).url})` }}
    >
      <GameSidebar
        player={player}
        onSaveAndTitle={onSaveAndTitle}
        onGoHome={onBack}
        onShop={onOpenShop}
        onProfile={onOpenProfile}
        onZukan={onOpenZukan}
        onMusic={onOpenMusic}
        onAssist={() => setIsAssistOpen(true)}
        onAnnouncements={onOpenAnnouncements}
        announcementUnread={announcementUnread}
      />

      <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
        <HiraganaSceneBackdrop className="max-w-3xl mx-auto space-y-4">
          <div className="flex items-start gap-2">
            <button
              type="button"
              onClick={() => {
                playCancelSound?.();
                onBack();
              }}
              className="mt-2 p-2.5 rounded-2xl bg-white/90 border-2 border-white shadow-md hover:scale-105 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-indigo-600" />
            </button>
            <div className="flex-1">
              <HiraganaHero subtitle="ローマ字入力の チャレンジ＆テスト" />
            </div>
          </div>

          <HiraganaPopPanel className="p-4 sm:p-6">
            <div className="flex gap-2 mb-5 flex-wrap">
              <HiraganaTabButton
                active={menuTab === 'stage'}
                icon={ListOrdered}
                label="ステージ"
                onClick={() => {
                  playDecideSound?.();
                  setMenuTab('stage');
                }}
              />
              <HiraganaTabButton
                active={menuTab === 'test'}
                icon={Shuffle}
                label="テスト"
                onClick={() => {
                  playDecideSound?.();
                  setMenuTab('test');
                }}
              />
              <HiraganaTabButton
                active={menuTab === 'stats'}
                icon={BarChart3}
                label="成績"
                onClick={() => {
                  playDecideSound?.();
                  setMenuTab('stats');
                }}
              />
            </div>

          {menuTab === 'stage' && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm font-black text-indigo-700 leading-relaxed">
                🗺️ 上から {HIRAGANA_ROWS[0].chars.join('→')} の順で クリア！
                つぎの行が どんどん あくよ。
              </p>
              <HiraganaInfoChip tone="amber">
                🎁 各行クリア 500pt / 再チャレンジも 500pt / ぜん行クリアで チケット各1枚
              </HiraganaInfoChip>
              {allStagesClear && (
                <HiraganaInfoChip tone="green">
                  🎉 ぜん行クリア！ 好きな行を 選んで 再チャレンジできるよ
                </HiraganaInfoChip>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {HIRAGANA_ROWS.map((row, index) => {
                  const unlocked = isRowUnlockedForStage(index, clearedRowIds);
                  const cleared = isRowCleared(row.id, clearedRowIds);
                  const current = index === stageRowIndex && !allStagesClear;
                  const isSelected = row.id === selectedStageRowId;
                  return (
                    <HiraganaStageCard
                      key={row.id}
                      row={row}
                      cleared={cleared}
                      current={current}
                      unlocked={unlocked}
                      selected={isSelected}
                      onSelect={() => {
                        if (!unlocked && !cleared) return;
                        playDecideSound?.();
                        setSelectedStageRowId(row.id);
                      }}
                    />
                  );
                })}
              </div>
              <HiraganaPrimaryButton
                disabled={!canStartSelectedStage}
                onClick={startStage}
              >
                {isSelectedStageReplay
                  ? `${selectedStageRow.emoji} ${selectedStageRow.label} を 再チャレンジ！`
                  : `${selectedStageRow.emoji} ${selectedStageRow.label} を いくぞ！`}
              </HiraganaPrimaryButton>
            </div>
          )}

          {menuTab === 'test' && (
            <div className="space-y-4 animate-fade-in">
              <HiraganaInfoChip tone="rose">
                ⚠️ テストは ローマ字ヒントも キーボードの光るアシストも なし！ ひらがなだけ見てね。
              </HiraganaInfoChip>
              <div>
                <p className="text-xs font-black text-indigo-600 mb-2">🎯 テストする行</p>
                <div className="flex flex-wrap gap-2">
                  {HIRAGANA_ROWS.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => toggleRowSelection(row.id)}
                      className={`px-3 py-2 rounded-2xl text-xs font-black border-3 transition-all ${
                        selectedRowIds.includes(row.id)
                          ? `bg-gradient-to-r ${row.theme} text-white border-white shadow-md scale-105`
                          : `${row.badge} hover:scale-105`
                      }`}
                    >
                      {row.emoji} {row.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTestMode('order')}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black border-3 transition-all ${
                    testMode === 'order'
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white border-white shadow-lg scale-[1.02]'
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  📝 じゅんばん
                </button>
                <button
                  type="button"
                  onClick={() => setTestMode('shuffle')}
                  className={`flex-1 py-3 rounded-2xl text-xs font-black border-3 transition-all ${
                    testMode === 'shuffle'
                      ? 'bg-gradient-to-r from-orange-400 to-rose-500 text-white border-white shadow-lg scale-[1.02]'
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  🎲 シャッフル
                </button>
              </div>
              {testMode === 'shuffle' && (
                <HiraganaInfoChip tone="orange">🎲 シャッフルテスト クリアで 2000pt！</HiraganaInfoChip>
              )}
              {testMode === 'order' && (
                <HiraganaInfoChip tone="sky">📝 じゅんばんテスト クリアで 1000pt！</HiraganaInfoChip>
              )}
              <HiraganaPrimaryButton
                variant="indigo"
                disabled={selectedRowIds.length === 0}
                onClick={startTest}
              >
                🚀 テストスタート！
              </HiraganaPrimaryButton>
            </div>
          )}

          {menuTab === 'stats' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-sm font-black text-indigo-700 mb-2">😅 にがてな文字 TOP</h3>
                {weakChars.length === 0 ? (
                  <p className="text-xs font-bold text-gray-400 bg-gradient-to-r from-gray-50 to-sky-50 rounded-2xl p-5 text-center border-2 border-dashed border-gray-200">
                    まだ データがありません。<br />
                    ステージや テストで 記録されるよ！
                  </p>
                ) : (
                  <div className="space-y-2">
                    {weakChars.map((entry) => (
                      <div
                        key={entry.kana}
                        className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl px-4 py-3 shadow-sm"
                      >
                        <span className="text-3xl font-black drop-shadow-sm">{entry.kana}</span>
                        <div className="text-right text-xs font-black text-amber-800">
                          <div>正答率 {entry.accuracy ?? 0}%</div>
                          <div className="text-amber-600">ミス {entry.misses} 回</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-indigo-700 mb-2">📊 行ごとの 成績</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {HIRAGANA_ROWS.map((row) => {
                    const summary = getRowSummary(row, charStats);
                    return (
                      <div
                        key={row.id}
                        className={`rounded-2xl border-2 px-3 py-2.5 text-xs font-bold bg-gradient-to-br from-white to-sky-50/80 ${row.badge}`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{row.emoji} {row.label}</span>
                          <span className="text-sky-700 font-black">
                            {summary.accuracy != null ? `${summary.accuracy}%` : '—'}
                          </span>
                        </div>
                        <div className="opacity-80 mt-0.5">
                          {summary.attempts > 0
                            ? `${summary.correct}/${summary.attempts} 正解 · ミス ${summary.misses}`
                            : '未プレイ'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          </HiraganaPopPanel>
        </HiraganaSceneBackdrop>
      </main>
    </div>
  );
}
