import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CheckCircle2, Star, RefreshCcw } from 'lucide-react';
import {
  FINGER_MAP,
  KEYBOARD_ROWS,
  resolveBackground,
} from '../constants';
import { pickGameWords, pickReplacementWord } from '../utils/typingWords';
import { getAdoptedWords, submitTypingReport } from '../firebase';
import { applyCorrectionToWord, refreshWordCorrections } from '../utils/wordCorrections';
import { computeAchievements } from '../utils/gacha';
import { appendSubEventsAfterTypingClear } from '../utils/subEvents';
import GameSidebar from './GameSidebar';
import CollectionSidebar from './CollectionSidebar';
import AssistSettingsModal from './AssistSettingsModal';
import TicketRewardModal from './TicketRewardModal';
import ConfirmModal from './ConfirmModal';
import TypingProblemReportModal from './TypingProblemReportModal';

const COUNTDOWN_STEPS = ['3', '2', '1', 'GO!!'];
const CHAOS_WINDOW_MS = 1500;
const CHAOS_MIN_KEYS = 5;
const CHAOS_MIN_ERRORS = 3;
const CHAOS_ERROR_RATIO = 0.65;
const CHAOS_WARNING_COOLDOWN_MS = 2500;
const CHAOS_WARNING_DURATION_MS = 2500;

function calcClearPoints(difficulty, missCount, assistSettings) {
  let pts = 100;
  if (difficulty === 'very_hard') pts = 1000;
  else if (difficulty === 'hard') pts = 500;
  else if (difficulty === 'normal') pts = 200;
  else if (difficulty === 'alphabet_quiz') pts = 50;

  if (difficulty !== 'easy' && difficulty !== 'alphabet_quiz') {
    if (missCount === 0) pts *= 2;
    else if (missCount <= 3) pts += 100;
  }

  if (!assistSettings.keyboardHighlight) pts += 100;
  if (!assistSettings.showRomajiHint) pts += 100;

  return pts;
}

function FingerGuide({ nextChar, assistSettings }) {
  const nextFinger = FINGER_MAP[nextChar?.toLowerCase()];
  if (!assistSettings.showFingerGuide || !nextFinger) return null;

  const isLeft = nextFinger.hand === 'left';
  const isRight = nextFinger.hand === 'right';

  const fingerBar = (hand, finger, heights) => (
    <div
      className={`w-1.5 rounded-full transition-all ${
        hand && nextFinger.finger === finger
          ? `${heights.active} ${hand === 'left' ? 'bg-blue-500' : 'bg-red-500'} animate-pulse ring-1 ${hand === 'left' ? 'ring-blue-200' : 'ring-red-200'}`
          : `${heights.idle} bg-gray-300`
      }`}
    />
  );

  return (
    <div className="mt-2 flex flex-col items-center bg-white p-2.5 rounded-xl border border-sky-100 shadow-md shrink-0 w-full max-w-md z-10">
      <div
        className={`text-xs font-black mb-1 flex items-center gap-1.5 animate-bounce ${
          isLeft ? 'text-blue-600' : isRight ? 'text-red-600' : 'text-yellow-600'
        }`}
      >
        👉{' '}
        <span
          className={`text-white px-2 py-0.5 rounded-full text-[10px] ${
            isLeft ? 'bg-blue-500' : isRight ? 'bg-red-500' : 'bg-yellow-500'
          }`}
        >
          {nextFinger.label}
        </span>{' '}
        で うとう！
      </div>

      <div className="flex gap-16 justify-center items-end h-12">
        <div
          className={`relative w-16 h-10 flex items-end justify-center rounded-b-xl border transition-all ${
            isLeft ? 'border-blue-500 bg-blue-50/30 shadow-sm scale-105' : 'border-gray-200 bg-gray-50/30 opacity-60'
          }`}
        >
          <span className="absolute -top-3.5 text-[8px] font-black text-gray-500">ひだり手</span>
          <div className="absolute bottom-0 w-full flex justify-between px-1 items-end h-8 pointer-events-none">
            {fingerBar(isLeft, 'pinky', { active: 'h-6', idle: 'h-3' })}
            {fingerBar(isLeft, 'ring', { active: 'h-8', idle: 'h-5' })}
            {fingerBar(isLeft, 'middle', { active: 'h-9', idle: 'h-6' })}
            {fingerBar(isLeft, 'index', { active: 'h-7', idle: 'h-4' })}
            <div
              className={`w-1.5 rounded-full origin-bottom-right rotate-12 transition-all ${
                isLeft && nextFinger.finger === 'thumb'
                  ? 'h-4 bg-blue-500 animate-pulse ring-1 ring-blue-200'
                  : 'h-3 bg-gray-300'
              }`}
            />
          </div>
        </div>

        <div
          className={`relative w-16 h-10 flex items-end justify-center rounded-b-xl border transition-all ${
            isRight ? 'border-red-500 bg-red-50/30 shadow-sm scale-105' : 'border-gray-200 bg-gray-50/30 opacity-60'
          }`}
        >
          <span className="absolute -top-3.5 text-[8px] font-black text-gray-500">みぎ手</span>
          <div className="absolute bottom-0 w-full flex justify-between px-1 items-end h-8 pointer-events-none">
            <div
              className={`w-1.5 rounded-full origin-bottom-left -rotate-12 transition-all ${
                isRight && nextFinger.finger === 'thumb'
                  ? 'h-4 bg-red-500 animate-pulse ring-1 ring-red-200'
                  : 'h-3 bg-gray-300'
              }`}
            />
            {fingerBar(isRight, 'index', { active: 'h-7', idle: 'h-4' })}
            {fingerBar(isRight, 'middle', { active: 'h-9', idle: 'h-6' })}
            {fingerBar(isRight, 'ring', { active: 'h-8', idle: 'h-5' })}
            {fingerBar(isRight, 'pinky', { active: 'h-6', idle: 'h-3' })}
          </div>
        </div>
      </div>
    </div>
  );
}

function VirtualKeyboard({ assistSettings, nextCharForAssist, isTransitioning, isAlphabetQuiz = false }) {
  const formatChar = (c) => {
    if (isAlphabetQuiz) return c.toUpperCase();
    return assistSettings.letterCase === 'upper' ? c.toUpperCase() : c;
  };

  return (
    <div className="mt-2 w-full max-w-xl shrink-0">
      <div className="bg-white/60 backdrop-blur-md p-3 sm:p-4 rounded-[1.5rem] shadow-inner border border-white/40">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex justify-center mb-1 sm:mb-1.5 gap-0.5 sm:gap-1"
            style={{ paddingLeft: rowIndex === 3 ? '0.2rem' : `${rowIndex * 0.8}rem` }}
          >
            {row.map((key) => {
              const isNextKey =
                assistSettings.keyboardHighlight &&
                !isTransitioning &&
                (key === nextCharForAssist ||
                  (key === '1' && nextCharForAssist === '!') ||
                  (key === '/' && nextCharForAssist === '?') ||
                  (key === 'Shift' && (nextCharForAssist === '!' || nextCharForAssist === '?')));

              const keyFinger = FINGER_MAP[key?.toLowerCase()];
              const isLeftHandKey = keyFinger?.hand === 'left';
              const isRightHandKey = keyFinger?.hand === 'right';

              let highlightClass = 'bg-white/90 text-gray-700 border-gray-200 shadow-sm';
              if (isNextKey) {
                if (isLeftHandKey) {
                  highlightClass =
                    'bg-blue-500 text-white -translate-y-0.5 border-blue-700 scale-105 shadow-md shadow-blue-300/50 z-10 animate-pulse';
                } else if (isRightHandKey) {
                  highlightClass =
                    'bg-red-500 text-white -translate-y-0.5 border-red-700 scale-105 shadow-md shadow-red-300/50 z-10 animate-pulse';
                } else {
                  highlightClass =
                    'bg-yellow-400 text-yellow-900 -translate-y-0.5 border-yellow-600 scale-105 shadow-md shadow-yellow-300/50 z-10 animate-pulse';
                }
              }

              const displayKey = key === 'Shift' ? 'Shift ⇧' : formatChar(key);

              return (
                <div
                  key={key}
                  className={`min-w-[1.35rem] sm:min-w-[1.85rem] h-7 sm:h-9 px-0.5 sm:px-1 rounded-lg border-b-[3px] sm:border-b-4 font-black text-[9px] sm:text-xs flex items-center justify-center transition-all select-none ${highlightClass}`}
                >
                  {displayKey}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TypingScreen({
  player,
  difficulty = 'normal',
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
  playSE,
}) {
  const playMetaRef = useRef({
    playCount: Number(player?.playCount) >= 0 ? Number(player?.playCount) : 0,
    specialWordTriggered: player?.specialWordTriggered === true,
  });
  const adoptedWordsRef = useRef([]);
  const onPlayerUpdateRef = useRef(onPlayerUpdate);

  useEffect(() => {
    onPlayerUpdateRef.current = onPlayerUpdate;
  }, [onPlayerUpdate]);

  useEffect(() => {
    refreshWordCorrections();
    getAdoptedWords().then((words) => {
      adoptedWordsRef.current = words || [];
    });
  }, []);

  const [gameWords, setGameWords] = useState([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [typedChars, setTypedChars] = useState('');
  const [missCount, setMissCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isAllClear, setIsAllClear] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [isAssistOpen, setIsAssistOpen] = useState(false);
  const [localPoints, setLocalPoints] = useState(player?.points || 0);
  const [localTickets, setLocalTickets] = useState({
    specialTickets: player?.specialTickets || 0,
    bgmTickets: player?.bgmTickets || 0,
    seTickets: player?.seTickets || 0,
    legendTickets: player?.legendTickets || 0,
  });
  const [ticketReward, setTicketReward] = useState(null);
  const [countdownStep, setCountdownStep] = useState(0);
  const [leaveConfirm, setLeaveConfirm] = useState(null);
  const [typingWarning, setTypingWarning] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportToast, setReportToast] = useState('');
  const keyPressWindowRef = useRef([]);
  const lastTypingWarningAtRef = useRef(0);
  const typingWarningTimerRef = useRef(null);

  const isCountdown = countdownStep < COUNTDOWN_STEPS.length;
  const countdownLabel = isCountdown ? COUNTDOWN_STEPS[countdownStep] : null;

  const activeBg = resolveBackground(player?.currentBackground);
  const currentWord = gameWords[wordIndex];
  const isAlphabetQuiz = difficulty === 'alphabet_quiz';

  const validRomajiList = useMemo(() => {
    if (!currentWord) return [];
    return currentWord.romaji.filter((r) => r.startsWith(typedChars));
  }, [currentWord, typedChars]);

  const displayRomaji = useMemo(() => {
    if (validRomajiList.length === 0) return '';
    const sorted = [...validRomajiList].sort((a, b) => {
      if (a.length !== b.length) return a.length - b.length;
      const aHasH = a.includes('sh') || a.includes('ch');
      const bHasH = b.includes('sh') || b.includes('ch');
      return (aHasH ? 1 : 0) - (bHasH ? 1 : 0);
    });
    return sorted[0];
  }, [validRomajiList]);

  const nextValidChars = useMemo(() => {
    return validRomajiList.map((r) => r[typedChars.length]).filter(Boolean);
  }, [typedChars, validRomajiList]);

  const nextCharForAssist = displayRomaji[typedChars.length] || '';

  const restartRound = useCallback(() => {
    const { words, newPlayCount, newTriggered } = pickGameWords(
      difficulty,
      false,
      playMetaRef.current.playCount,
      playMetaRef.current.specialWordTriggered,
      undefined,
      adoptedWordsRef.current,
    );
    playMetaRef.current = { playCount: newPlayCount, specialWordTriggered: newTriggered };
    setGameWords(words.map((word) => applyCorrectionToWord(word, difficulty)));
    onPlayerUpdateRef.current?.({ playCount: newPlayCount, specialWordTriggered: newTriggered });
    setWordIndex(0);
    setTypedChars('');
    setMissCount(0);
    setIsTransitioning(false);
    setIsShaking(false);
    setIsAllClear(false);
    setEarnedPoints(0);
    setTicketReward(null);
    setCountdownStep(0);
  }, [difficulty]);

  useEffect(() => {
    if (!isCountdown) return undefined;
    playSE?.(countdownLabel === 'GO!!' ? 'go' : 'countdown');
  }, [countdownStep, isCountdown, countdownLabel, playSE]);

  useEffect(() => {
    if (!isCountdown) return undefined;
    const delay = countdownLabel === 'GO!!' ? 350 : 450;
    const timer = setTimeout(() => {
      if (countdownStep >= COUNTDOWN_STEPS.length - 1) {
        setCountdownStep(COUNTDOWN_STEPS.length);
      } else {
        setCountdownStep((prev) => prev + 1);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [countdownStep, isCountdown, countdownLabel]);

  useEffect(() => {
    restartRound();
  }, [difficulty, restartRound]);

  useEffect(() => {
    if (!currentWord?.isSpecial || isCountdown || isAllClear || isTransitioning) return undefined;

    // 1問目はカウントダウン（GO!!）の直後と被らないよう少し待つ
    const delay = wordIndex === 0 ? 450 : 0;
    const timer = setTimeout(() => playSE?.('legend'), delay);
    return () => clearTimeout(timer);
  }, [currentWord, wordIndex, isCountdown, isAllClear, isTransitioning, playSE]);

  useEffect(
    () => () => {
      if (typingWarningTimerRef.current) clearTimeout(typingWarningTimerRef.current);
    },
    [],
  );

  const showTypingWarning = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingWarningAtRef.current < CHAOS_WARNING_COOLDOWN_MS) return;
    lastTypingWarningAtRef.current = now;
    setTypingWarning(true);
    if (typingWarningTimerRef.current) clearTimeout(typingWarningTimerRef.current);
    typingWarningTimerRef.current = setTimeout(() => {
      setTypingWarning(false);
      typingWarningTimerRef.current = null;
    }, CHAOS_WARNING_DURATION_MS);
  }, []);

  const registerKeyPress = useCallback(
    (isCorrect) => {
      const now = Date.now();
      keyPressWindowRef.current.push({ t: now, ok: isCorrect });
      keyPressWindowRef.current = keyPressWindowRef.current.filter(
        (entry) => now - entry.t < CHAOS_WINDOW_MS,
      );

      const windowEntries = keyPressWindowRef.current;
      if (windowEntries.length < CHAOS_MIN_KEYS) return;

      const errorCount = windowEntries.filter((entry) => !entry.ok).length;
      if (
        errorCount >= CHAOS_MIN_ERRORS ||
        errorCount / windowEntries.length >= CHAOS_ERROR_RATIO
      ) {
        showTypingWarning();
      }
    },
    [showTypingWarning],
  );

  const requestLeaveHome = useCallback(() => {
    setLeaveConfirm({
      title: '🏠 ひろばにもどる？',
      message:
        'いまの タイピングは 保存されないよ。\n本当に ひろばに もどっていい？',
      confirmLabel: 'ひろばにもどる',
      onConfirm: onBack,
    });
  }, [onBack]);

  const requestLeaveTitle = useCallback(() => {
    setLeaveConfirm({
      title: '🚪 タイトルにセーブして戻る？',
      message:
        'いまの あそびかたを クラウドに セーブして\nタイトルに もどりますか？',
      confirmLabel: 'セーブする',
      onConfirm: () => {
        onSaveAndTitle?.({
          points: localPoints,
          ...localTickets,
          playCount: playMetaRef.current.playCount,
          specialWordTriggered: playMetaRef.current.specialWordTriggered,
        });
      },
    });
  }, [onSaveAndTitle, localPoints, localTickets]);

  useEffect(() => {
    if (!reportToast) return undefined;
    const timer = setTimeout(() => setReportToast(''), 2800);
    return () => clearTimeout(timer);
  }, [reportToast]);

  const handleReportConfirm = useCallback(
    async (reason) => {
      if (!currentWord || reportSubmitting) return;
      setReportSubmitting(true);
      try {
        const reportId = await submitTypingReport({
          context: 'main',
          difficulty,
          wordIndex,
          playerId: player?.id || null,
          playerName: player?.name || 'ゲスト',
          kana: currentWord.kana,
          romaji: currentWord.romaji,
          emoji: currentWord.emoji || '',
          displayRomaji,
          reason,
        });

        const excludeKanas = gameWords.map((word) => word.kana);
        const replacement = pickReplacementWord(
          difficulty,
          excludeKanas,
          adoptedWordsRef.current,
        );
        if (replacement) {
          setGameWords((prev) =>
            prev.map((word, index) =>
              index === wordIndex
                ? applyCorrectionToWord(replacement, difficulty)
                : word,
            ),
          );
          setTypedChars('');
          setReportToast(
            reportId ? 'べつの 問題に かえたよ！' : '問題は かえたけど、ほうこくの 保存に 失敗したよ…',
          );
        } else {
          setReportToast(reportId ? 'ほうこくを うけつけたよ！' : 'ほうこくの 送信に 失敗したよ…');
        }
        setReportOpen(false);
      } finally {
        setReportSubmitting(false);
      }
    },
    [
      currentWord,
      difficulty,
      displayRomaji,
      gameWords,
      player?.id,
      player?.name,
      reportSubmitting,
      wordIndex,
    ],
  );

  const finishClear = useCallback(
    (pts) => {
      setEarnedPoints(pts);
      setIsAllClear(true);
      const newPoints = localPoints + pts;
      setLocalPoints(newPoints);

      const difficultyClears = { ...(player?.difficultyClears || {}) };
      if (['easy', 'normal', 'hard', 'very_hard', 'alphabet_quiz'].includes(difficulty)) {
        difficultyClears[difficulty] = true;
      }
      const earnedNoMiss =
        missCount === 0 && difficulty !== 'easy' && difficulty !== 'alphabet_quiz';
      const updates = {
        points: newPoints,
        difficultyClears,
        noMissClear: player?.noMissClear || earnedNoMiss,
        plazaSubEvents: appendSubEventsAfterTypingClear({
          ...player,
          points: newPoints,
          difficultyClears,
        }),
      };
      updates.achievements = computeAchievements(
        { ...player, ...updates },
        player?.collection || {},
      );
      onPlayerUpdateRef.current?.(updates);
      setTimeout(() => playSE?.('points'), 300);
    },
    [difficulty, localPoints, missCount, player, playSE],
  );

  const completeCurrentWord = useCallback(() => {
    setIsTransitioning(true);
    const isSpecialWord = currentWord?.isSpecial;
    const isLastWord = wordIndex + 1 >= gameWords.length;

    const proceedToNext = () => {
      setTicketReward(null);
      if (isLastWord) {
        const pts = calcClearPoints(difficulty, missCount, assistSettings);
        finishClear(pts);
      } else {
        setWordIndex((prev) => prev + 1);
        setTypedChars('');
      }
      setIsTransitioning(false);
    };

    if (isSpecialWord) {
      const roll = Math.random();
      let ticketType;
      let ticketUpdates = {};

      if (roll < 0.33) {
        ticketType = 'bgm';
        ticketUpdates = { bgmTickets: localTickets.bgmTickets + 1 };
      } else if (roll < 0.66) {
        ticketType = 'se';
        ticketUpdates = { seTickets: localTickets.seTickets + 1 };
      } else {
        ticketType = 'legend';
        ticketUpdates = { legendTickets: localTickets.legendTickets + 1 };
      }

      setLocalTickets((prev) => ({ ...prev, ...ticketUpdates }));
      onPlayerUpdateRef.current?.(ticketUpdates);
      setTicketReward({ show: true, type: ticketType, count: 1, onConfirm: proceedToNext });
      playSE?.('legend');
      return;
    }

    playSE?.(isLastWord ? 'allClear' : 'wordClear');
    setTimeout(proceedToNext, 800);
  }, [
    assistSettings,
    currentWord?.isSpecial,
    difficulty,
    finishClear,
    gameWords.length,
    localTickets.bgmTickets,
    localTickets.legendTickets,
    localTickets.seTickets,
    missCount,
    playSE,
    wordIndex,
  ]);

  const handleKeyDown = useCallback(
    (e) => {
      if (
        e.repeat ||
        isTransitioning ||
        isAllClear ||
        isAssistOpen ||
        isCountdown ||
        ticketReward ||
        leaveConfirm ||
        typingWarning
      ) {
        return;
      }

      if (e.key === 'Shift' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (!/^[a-zA-Z0-9\-!?,.]$/.test(e.key)) return;

      const inputChar = e.key.toLowerCase();

      if (nextValidChars.includes(inputChar)) {
        registerKeyPress(true);
        const newTyped = typedChars + inputChar;
        setTypedChars(newTyped);
        playSE?.('type');

        if (validRomajiList.some((r) => r === newTyped)) {
          completeCurrentWord();
        }
      } else {
        registerKeyPress(false);
        if (difficulty !== 'easy') {
          setMissCount((prev) => prev + 1);
          setIsShaking(true);
          playSE?.('error');
          setTimeout(() => setIsShaking(false), 300);
        }
      }
    },
    [
      typedChars,
      nextValidChars,
      validRomajiList,
      completeCurrentWord,
      isTransitioning,
      isAllClear,
      isAssistOpen,
      isCountdown,
      ticketReward,
      leaveConfirm,
      typingWarning,
      difficulty,
      registerKeyPress,
      playSE,
    ],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const formatTyped = (text) => {
    if (isAlphabetQuiz) return text.toLowerCase();
    return assistSettings.letterCase === 'upper' ? text.toUpperCase() : text;
  };

  const formatHint = (text) => {
    if (isAlphabetQuiz) return text.toLowerCase();
    return assistSettings.letterCase === 'upper' ? text.toUpperCase() : text;
  };

  const countdownOverlay = isCountdown && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm pointer-events-none">
      <div
        key={countdownLabel}
        className={`font-black animate-pop-out select-none ${
          countdownLabel === 'GO!!'
            ? 'text-6xl sm:text-8xl text-yellow-300 drop-shadow-[0_6px_0_#ca8a04]'
            : 'text-8xl sm:text-[10rem] text-white drop-shadow-[0_6px_0_#0284c7]'
        }`}
        style={{ textShadow: '0 0 40px rgba(255,255,255,0.35)' }}
      >
        {countdownLabel}
      </div>
    </div>
  );

  if (isAllClear) {
    const sidebarPlayer = { ...player, points: localPoints, ...localTickets };
    return (
      <div
        className="h-screen flex w-full relative bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: `url(${activeBg.url})` }}
      >
        <GameSidebar
          player={sidebarPlayer}
          onSaveAndTitle={() =>
            onSaveAndTitle?.({
              points: localPoints,
              ...localTickets,
              playCount: playMetaRef.current.playCount,
              specialWordTriggered: playMetaRef.current.specialWordTriggered,
            })
          }
          onGoHome={onBack}
          onShop={onOpenShop}
          onProfile={onOpenProfile}
          onMusic={onOpenMusic}
          onZukan={onOpenZukan}
          onAnnouncements={onOpenAnnouncements}
          announcementUnread={announcementUnread}
        />
        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="bg-white/95 border-4 border-yellow-300 rounded-3xl p-8 sm:p-10 text-center max-w-md shadow-2xl animate-fade-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-black text-green-600 mb-2">ぜんぶ クリア！</h2>
            <p className="text-5xl font-black text-amber-500 mb-6">🪙 +{earnedPoints}</p>
            {difficulty !== 'easy' && (
              <p className="text-sm font-bold text-gray-500 mb-4">ミス {missCount} かい</p>
            )}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={restartRound}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black text-lg py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
              >
                <RefreshCcw className="w-5 h-5" /> もういちど あそぶ
              </button>
              <button
                type="button"
                onClick={onBack}
                className="text-gray-500 hover:text-gray-700 font-bold underline text-sm"
              >
                ひろばにもどる
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const sidebarPlayer = { ...player, points: localPoints, ...localTickets };

  return (
    <div
      className="h-screen flex w-full relative bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: `url(${activeBg.url})` }}
    >
      <GameSidebar
        player={sidebarPlayer}
        onSaveAndTitle={requestLeaveTitle}
        onGoHome={requestLeaveHome}
        onShop={onOpenShop}
        onProfile={onOpenProfile}
        onMusic={onOpenMusic}
        onZukan={onOpenZukan}
        onAnnouncements={onOpenAnnouncements}
        announcementUnread={announcementUnread}
        onAssist={() => setIsAssistOpen(true)}
        assistActive={
          assistSettings.keyboardHighlight ||
          assistSettings.showRomajiHint ||
          assistSettings.showFingerGuide
        }
      />

      <main className="flex-1 h-full flex flex-col items-center justify-center min-h-0 p-2 overflow-y-auto">
        <div className="w-full max-w-xl flex flex-col items-center gap-2 py-2">
          {currentWord?.isSpecial && !isTransitioning && (
            <>
              <div className="fixed inset-0 pointer-events-none z-50 animate-thunder-flash mix-blend-screen" />
              <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-40 animate-thunder-strike">
                <div className="text-[150px] drop-shadow-2xl opacity-90">⚡</div>
              </div>
            </>
          )}

          <div
            className={`bg-white/98 border-4 border-yellow-300 p-4 sm:p-5 rounded-3xl text-center w-full relative shadow-xl transition-transform duration-100 ${
              isShaking ? 'translate-x-2 rotate-1 bg-red-50' : ''
            } ${currentWord?.isSpecial ? 'border-fuchsia-400 bg-fuchsia-50/98 shadow-fuchsia-300/50 scale-105' : ''}`}
          >
            {isTransitioning && (
              <div className="absolute inset-0 bg-white/90 rounded-3xl flex flex-col items-center justify-center z-20 animate-fade-in">
                <CheckCircle2 className="w-20 h-20 text-green-500 mb-2 animate-bounce" />
                <span className="text-4xl font-black text-green-500 tracking-widest">OK!</span>
              </div>
            )}

            {currentWord?.isSpecial && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-lg sm:text-xl font-black text-fuchsia-500 drop-shadow-[0_0_10px_rgba(217,70,239,0.8)] animate-bounce z-30 whitespace-nowrap bg-white/80 px-4 py-1 rounded-full border-2 border-fuchsia-400">
                ✨ 激アツ！！ ✨
              </div>
            )}

            <div className="flex flex-col items-center gap-1 mb-4 pb-3 border-b border-gray-100 shrink-0">
              <div className="flex gap-2 justify-center">
                {gameWords.map((word, index) => {
                  const isActive = index === wordIndex;
                  const isCleared = index < wordIndex;
                  const isSpecial = word?.isSpecial;
                  let starClass = 'text-white fill-gray-200 opacity-50';
                  if (isCleared) {
                    starClass = isSpecial
                      ? 'text-fuchsia-500 fill-fuchsia-500 scale-110 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]'
                      : 'text-yellow-400 fill-yellow-400 scale-110';
                  } else if (isActive) {
                    starClass = isSpecial
                      ? 'text-fuchsia-400 fill-fuchsia-100 scale-125 animate-pulse drop-shadow-[0_0_8px_rgba(217,70,239,0.6)]'
                      : 'text-yellow-400 fill-yellow-100 scale-125 animate-pulse';
                  } else if (isSpecial) {
                    starClass = 'text-fuchsia-300 fill-fuchsia-100 opacity-80';
                  }
                  return <Star key={index} className={`w-6 h-6 transition-all duration-500 ${starClass}`} />;
                })}
              </div>
              {difficulty !== 'easy' && (
                <div className="text-xs font-black bg-red-100 text-red-600 px-3 py-0.5 rounded-full border border-red-200 shadow-sm">
                  ミス：<span className="text-sm">{missCount}</span> かい
                </div>
              )}
            </div>

            {isAlphabetQuiz ? (
              <>
                <div className="text-[100px] leading-none mb-3 font-black text-rose-500 drop-shadow-md">
                  {(currentWord?.romaji[0] || '').toLowerCase()}
                </div>
                <div className="text-base sm:text-lg font-black text-gray-700 mb-4 bg-rose-50 py-2 px-4 rounded-xl border-2 border-rose-200">
                  {currentWord?.kana}
                </div>
                <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest bg-gray-100 py-4 rounded-xl border-2 border-gray-200 shadow-inner">
                  <span className="text-sky-600">{formatTyped(typedChars)}</span>
                  <span className={assistSettings.showRomajiHint ? 'text-gray-400' : 'text-transparent'}>
                    {formatHint(displayRomaji.slice(typedChars.length))}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl sm:text-7xl mb-2">{currentWord?.emoji}</div>
                <div
                  className={`text-3xl sm:text-4xl font-black tracking-widest mb-3 ${
                    currentWord?.isSpecial
                      ? 'text-fuchsia-600 drop-shadow-[0_0_5px_rgba(217,70,239,0.5)]'
                      : 'text-gray-900'
                  }`}
                  style={{
                    textShadow: currentWord?.isSpecial
                      ? undefined
                      : '0 2px 0 #fff, 0 -2px 0 #fff, 2px 0 0 #fff, -2px 0 0 #fff',
                  }}
                >
                  {currentWord?.kana}
                </div>
                <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest bg-gray-100 py-4 rounded-xl border-2 border-gray-200 shadow-inner">
                  <span className="text-sky-600">{formatTyped(typedChars)}</span>
                  <span className={assistSettings.showRomajiHint ? 'text-gray-400' : 'text-transparent'}>
                    {formatHint(displayRomaji.slice(typedChars.length))}
                  </span>
                </div>
              </>
            )}
          </div>

          <FingerGuide nextChar={nextCharForAssist} assistSettings={assistSettings} />
          <VirtualKeyboard
            assistSettings={assistSettings}
            nextCharForAssist={nextCharForAssist}
            isTransitioning={isTransitioning}
            isAlphabetQuiz={isAlphabetQuiz}
          />

          {!isCountdown && !isAllClear && !isTransitioning && currentWord && (
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="mt-1 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 border-2 border-amber-300 rounded-2xl font-black text-xs shadow-sm active:scale-95 transition-all"
            >
              🚨 問題を ほうこく
            </button>
          )}
        </div>
      </main>

      <CollectionSidebar player={sidebarPlayer} />

      <AssistSettingsModal
        isOpen={isAssistOpen}
        settings={assistSettings}
        onChange={onAssistChange}
        onClose={() => setIsAssistOpen(false)}
      />

      <TicketRewardModal
        ticketReward={ticketReward}
        onClose={() => setTicketReward(null)}
      />

      <ConfirmModal
        isOpen={!!leaveConfirm}
        title={leaveConfirm?.title}
        message={leaveConfirm?.message}
        confirmLabel={leaveConfirm?.confirmLabel}
        onCancel={() => setLeaveConfirm(null)}
        onConfirm={() => {
          const action = leaveConfirm?.onConfirm;
          setLeaveConfirm(null);
          action?.();
        }}
      />

      <ConfirmModal
        isOpen={typingWarning}
        title="⌨️ ちょっと まって！"
        message={
          'キーボードを メチャクチャ に おしていないかな？\nゆっくり、 つぎの もじを 正しく うって みよう！'
        }
        confirmLabel="わかった！"
        cancelLabel={null}
        onCancel={() => setTypingWarning(false)}
        onConfirm={() => setTypingWarning(false)}
      />

      <TypingProblemReportModal
        isOpen={reportOpen}
        wordLabel={currentWord?.kana || ''}
        onCancel={() => setReportOpen(false)}
        onConfirm={handleReportConfirm}
        submitting={reportSubmitting}
      />

      {reportToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[130] bg-amber-600/95 text-white px-5 py-3 rounded-2xl font-black text-sm shadow-xl animate-fade-in">
          {reportToast}
        </div>
      )}

      {countdownOverlay}
    </div>
  );
}
