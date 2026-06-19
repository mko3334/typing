import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Lock, CheckCircle2, BarChart3, Shuffle, ListOrdered } from 'lucide-react';
import { FINGER_MAP, KEYBOARD_ROWS, resolveBackground } from '../constants';
import { HIRAGANA_ROWS } from '../data/hiraganaRows';
import {
  buildPracticeQueue,
  getCharAccuracy,
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
  buildShuffleCompleteReward,
  buildStageClearReward,
} from '../utils/hiraganaRewards';
import GameSidebar from './GameSidebar';
import HiraganaRewardModal from './HiraganaRewardModal';

function VirtualKeyboard({ assistSettings, nextChar, shake }) {
  const formatChar = (c) => (assistSettings?.letterCase === 'upper' ? c.toUpperCase() : c);

  return (
    <div className={`mt-3 w-full max-w-xl shrink-0 ${shake ? 'animate-shake' : ''}`}>
      <div className="bg-white/70 backdrop-blur-md p-3 rounded-[1.5rem] shadow-inner border border-white/40">
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
  const displayRomaji = assistSettings?.showRomajiHint !== false ? validRomaji[0] || '' : '';
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
      if (playMode === 'shuffle') {
        const reward = buildShuffleCompleteReward();
        const accuracy =
          queue.length + sessionMisses > 0
            ? Math.round((queue.length / (queue.length + sessionMisses)) * 100)
            : 100;
        grantReward(
          reward,
          {
            clearedRowIds,
            charStats: nextStats,
            shuffleClearCount: progress.shuffleClearCount + 1,
            allRowsRewardClaimed: progress.allRowsRewardClaimed,
          },
          { misses: sessionMisses, accuracy },
        );
      } else {
        persistProgress(clearedRowIds, nextStats);
      }
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
    persistProgress,
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
    return (
      <div
        className="h-screen flex w-full relative overflow-hidden"
        style={{ backgroundImage: `url(${resolveBackground(player?.currentBackground).url})` }}
      >
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
        />

        <main className="flex-1 flex flex-col items-center justify-center p-3 min-h-0 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white/90 backdrop-blur-sm rounded-3xl border-4 border-sky-300 shadow-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => {
                  playCancelSound?.();
                  setPhase('menu');
                  persistProgress(clearedRowIds, charStats);
                }}
                className="flex items-center gap-1 text-sm font-black text-gray-600 hover:text-sky-600"
              >
                <ArrowLeft className="w-4 h-4" /> もどる
              </button>
              <span className="text-xs font-black text-sky-700 bg-sky-50 px-3 py-1 rounded-full">
                {playMode === 'stage'
                  ? `${activeStageRow.label} ステージ`
                  : testMode === 'shuffle'
                    ? 'シャッフルテスト'
                    : 'じゅんばんテスト'}
              </span>
              <span className="text-xs font-bold text-gray-500">ミス {sessionMisses}</span>
            </div>

            {playMode === 'stage' && (
              <div className="flex justify-center gap-2 mb-4 flex-wrap">
                {activeStageRow.chars.map((kana, index) => (
                  <div
                    key={kana}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black border-2 ${
                      index < stageCharIndex
                        ? 'bg-green-100 border-green-400 text-green-700'
                        : index === stageCharIndex
                          ? 'bg-sky-500 border-sky-600 text-white scale-110 shadow-lg'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}
                  >
                    {kana}
                  </div>
                ))}
              </div>
            )}

            <div className="text-center py-4">
              <p className="text-xs font-bold text-gray-500 mb-2">うつ文字（ローマ字）</p>
              <div className="text-6xl sm:text-7xl font-black text-sky-600 mb-2">{currentKana}</div>
              {displayRomaji && (
                <p className="text-lg font-black text-indigo-500 tracking-widest">{displayRomaji}</p>
              )}
              <div className="mt-3 text-2xl font-mono font-black text-gray-700 min-h-[2rem]">
                {typedChars || '…'}
              </div>
              {playMode !== 'stage' && (
                <p className="text-xs font-bold text-gray-400 mt-2">
                  {queueIndex + 1} / {queue.length}
                </p>
              )}
            </div>

            <VirtualKeyboard assistSettings={assistSettings} nextChar={nextChar} shake={shake} />
            <p className="text-center text-[10px] font-bold text-gray-400 mt-3">
              キーボードで ローマ字を うってね
            </p>
          </div>
        </main>

        {pendingReward && (
          <HiraganaRewardModal
            reward={pendingReward}
            stats={rewardStats}
            playDecideSound={playDecideSound}
            onClose={() => {
              const kind = pendingReward.kind;
              const earnedPoints = pendingReward.points || 0;
              setPendingReward(null);
              setRewardStats(null);
              if (kind === 'stage') {
                setStageCharIndex(0);
                setTypedChars('');
                setSessionMisses(0);
                setActiveStageRowId(null);
                const continueNext =
                  earnedPoints > 0 && clearedRowIds.length < HIRAGANA_ROWS.length;
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
      />

      <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
        <div className="max-w-3xl mx-auto bg-white/92 backdrop-blur-sm rounded-3xl border-4 border-indigo-300 shadow-xl p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={() => {
                playCancelSound?.();
                onBack();
              }}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-indigo-800">🔤 ひらがなタイピング</h1>
              <p className="text-xs font-bold text-gray-500">ローマ字入力の テスト</p>
            </div>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            {[
              { id: 'stage', label: 'ステージ', icon: ListOrdered },
              { id: 'test', label: 'テスト', icon: Shuffle },
              { id: 'stats', label: '成績', icon: BarChart3 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  playDecideSound?.();
                  setMenuTab(id);
                }}
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black border-2 ${
                  menuTab === id
                    ? 'bg-indigo-500 text-white border-indigo-600'
                    : 'bg-white text-indigo-700 border-indigo-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          {menuTab === 'stage' && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-gray-600">
                上から {HIRAGANA_ROWS[0].chars.join('→')} の順で 入力して クリア！
                クリアすると つぎの行が あきます。
              </p>
              <p className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                🎁 各行クリア（初回）500pt / ぜん行クリアで チケット各1枚
              </p>
              {allStagesClear && (
                <p className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  🎉 ぜん行クリア！ クリアした行を 選んで 再チャレンジできるよ
                </p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {HIRAGANA_ROWS.map((row, index) => {
                  const unlocked = isRowUnlockedForStage(index, clearedRowIds);
                  const cleared = isRowCleared(row.id, clearedRowIds);
                  const current = index === stageRowIndex && !allStagesClear;
                  const selectable = unlocked || cleared;
                  const isSelected = row.id === selectedStageRowId;
                  return (
                    <button
                      key={row.id}
                      type="button"
                      disabled={!selectable}
                      onClick={() => {
                        if (!selectable) return;
                        playDecideSound?.();
                        setSelectedStageRowId(row.id);
                      }}
                      className={`rounded-2xl border-2 p-3 text-left transition-transform ${
                        isSelected ? 'ring-2 ring-indigo-400 scale-[1.02]' : ''
                      } ${
                        cleared
                          ? 'bg-green-50 border-green-300'
                          : current
                            ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-200'
                            : unlocked
                              ? 'bg-white border-indigo-200 hover:border-indigo-400'
                              : 'bg-gray-100 border-gray-200 opacity-70 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-black text-gray-800">{row.label}</span>
                        {cleared ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : unlocked ? null : (
                          <Lock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <p className="text-xs font-bold text-gray-500">{row.chars.join(' ')}</p>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={!canStartSelectedStage}
                onClick={startStage}
                className="w-full py-3 bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 text-white font-black rounded-2xl shadow-lg"
              >
                {isSelectedStageReplay
                  ? `${selectedStageRow.label} を 再チャレンジ`
                  : `${selectedStageRow.label} ステージを はじめる`}
              </button>
            </div>
          )}

          {menuTab === 'test' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-black text-gray-500 mb-2">テストする行</p>
                <div className="flex flex-wrap gap-2">
                  {HIRAGANA_ROWS.map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => toggleRowSelection(row.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 ${
                        selectedRowIds.includes(row.id)
                          ? 'bg-indigo-500 text-white border-indigo-600'
                          : 'bg-white text-indigo-700 border-indigo-200'
                      }`}
                    >
                      {row.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTestMode('order')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black border-2 ${
                    testMode === 'order'
                      ? 'bg-emerald-500 text-white border-emerald-600'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  じゅんばん
                </button>
                <button
                  type="button"
                  onClick={() => setTestMode('shuffle')}
                  className={`flex-1 py-2 rounded-xl text-xs font-black border-2 ${
                    testMode === 'shuffle'
                      ? 'bg-orange-500 text-white border-orange-600'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  シャッフル
                </button>
              </div>
              {testMode === 'shuffle' && (
                <p className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
                  🎲 シャッフルテスト クリアで 1000pt ゲット！
                </p>
              )}
              {testMode === 'order' && (
                <p className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                  📝 じゅんばんテストは 成績記録のみ（ポイントなし）
                </p>
              )}
              <button
                type="button"
                disabled={selectedRowIds.length === 0}
                onClick={startTest}
                className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 text-white font-black rounded-2xl"
              >
                テストスタート
              </button>
            </div>
          )}

          {menuTab === 'stats' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-gray-700 mb-2">にがてな文字 TOP</h3>
                {weakChars.length === 0 ? (
                  <p className="text-xs font-bold text-gray-400 bg-gray-50 rounded-xl p-4 text-center">
                    まだ データがありません。ステージや テストで 記録されます。
                  </p>
                ) : (
                  <div className="space-y-2">
                    {weakChars.map((entry) => (
                      <div
                        key={entry.kana}
                        className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-3 py-2"
                      >
                        <span className="text-2xl font-black">{entry.kana}</span>
                        <div className="text-right text-xs font-bold text-amber-800">
                          <div>正答率 {entry.accuracy ?? 0}%</div>
                          <div className="text-amber-600">ミス {entry.misses} 回</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-700 mb-2">行ごとの 成績</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {HIRAGANA_ROWS.map((row) => {
                    const summary = getRowSummary(row, charStats);
                    return (
                      <div
                        key={row.id}
                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold"
                      >
                        <div className="flex justify-between">
                          <span>{row.label}</span>
                          <span className="text-sky-600">
                            {summary.accuracy != null ? `${summary.accuracy}%` : '—'}
                          </span>
                        </div>
                        <div className="text-gray-500 mt-0.5">
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
        </div>
      </main>
    </div>
  );
}
