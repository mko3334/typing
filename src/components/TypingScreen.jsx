import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CheckCircle2, Star, RefreshCcw } from 'lucide-react';
import {
  FINGER_MAP,
  KEYBOARD_ROWS,
  resolveBackground,
  TITLES,
  GACHA_ITEMS,
} from '../constants';
import { HiraganaBounceValue } from './hiragana/HiraganaVisuals';
import { pickGameWords, pickReplacementWord, pickOfficialShowWords } from '../utils/typingWords';
import { submitTypingReport, saveOfficialShowScore, listenOfficialShowRankings, getOpenReportedKeywords } from '../firebase';
import { applyCorrectionToWord, refreshWordCorrections } from '../utils/wordCorrections';
import { computeAchievements } from '../utils/gacha';
import { getGearTooltip } from '../utils/gearPower';
import { appendSubEventsAfterTypingClear } from '../utils/subEvents';
import { generateAllRomaji } from '../constants';
import GameSidebar from './GameSidebar';
import CollectionSidebar from './CollectionSidebar';
import AssistSettingsModal from './AssistSettingsModal';
import TicketRewardModal from './TicketRewardModal';
import ConfirmModal from './ConfirmModal';
import TypingProblemReportModal from './TypingProblemReportModal';
import GearEquipModal from './GearEquipModal';
import PlayerCard from './PlayerCard';
import { calculateGearPowers } from '../utils/gearPower';

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
  extraWords,
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
  const adoptedWordsRef = useRef(extraWords || []);
  const onPlayerUpdateRef = useRef(onPlayerUpdate);

  useEffect(() => {
    onPlayerUpdateRef.current = onPlayerUpdate;
  }, [onPlayerUpdate]);

  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      getOpenReportedKeywords(),
      refreshWordCorrections()
    ]).then(([reports]) => {
      setReportedKanas(reports);
      setIsDataLoaded(true);
    });
  }, []);

  useEffect(() => {
    adoptedWordsRef.current = extraWords || [];
  }, [extraWords]);

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
  
  const [isGearModalOpen, setIsGearModalOpen] = useState(false);
  const gearPowers = useMemo(() => calculateGearPowers(player?.typingShowGears, player?.itemLevels), [player?.typingShowGears, player?.itemLevels]);
  const gearPowersRef = useRef(gearPowers);
  useEffect(() => { gearPowersRef.current = gearPowers; }, [gearPowers]);
  const [ticketReward, setTicketReward] = useState(null);
  const [countdownStep, setCountdownStep] = useState(0);
  const [leaveConfirm, setLeaveConfirm] = useState(null);
  const [typingWarning, setTypingWarning] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportToast, setReportToast] = useState('');
  const [latestRankings, setLatestRankings] = useState([]);
  const [reportedKanas, setReportedKanas] = useState([]);
  const keyPressWindowRef = useRef([]);
  const lastTypingWarningAtRef = useRef(0);
  const typingWarningTimerRef = useRef(null);

  // --- 公式ショー（タイムアタック）用ステート ---
  const isOfficialShow = typeof difficulty === 'object' && difficulty?.isOfficialShow;
  const [timeLeft, setTimeLeft] = useState(60);
  const [officialScore, setOfficialScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [officialShowUploading, setOfficialShowUploading] = useState(false);

  const isCountdown = countdownStep < COUNTDOWN_STEPS.length;
  const countdownLabel = isCountdown ? COUNTDOWN_STEPS[countdownStep] : null;

  const activeBg = resolveBackground(player?.currentBackground);
  const currentWord = gameWords[wordIndex];
  const isAlphabetQuiz = difficulty === 'alphabet_quiz';
  const isCustomStage = typeof difficulty === 'object' && difficulty?.isCustomStage;

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
    if (typeof difficulty === 'object' && difficulty.isCustomStage) {
      // カスタムステージの処理
      const customWords = difficulty.words.map(w => ({
        kana: w.kana,
        text: w.text,
        emoji: '✨',
        romaji: generateAllRomaji(w.kana)
      }));
      setGameWords(customWords);
      onPlayerUpdateRef.current?.({ playCount: playMetaRef.current.playCount + 1, specialWordTriggered: playMetaRef.current.specialWordTriggered });
      setWordIndex(0);
      setTypedChars('');
      setMissCount(0);
      setIsTransitioning(false);
      setIsShaking(false);
      setIsAllClear(false);
      setEarnedPoints(0);
      setTicketReward(null);
      setCountdownStep(0);
      return;
    }

    if (typeof difficulty === 'object' && difficulty.isOfficialShow) {
      const specialRate = 0.05 + gearPowersRef.current.specialRateUp;
      const customWords = pickOfficialShowWords(adoptedWordsRef.current, reportedKanas).map(w => ({
        ...w,
        isSpecial: Math.random() < specialRate,
        romaji: w.romaji || generateAllRomaji(w.kana)
      }));
      setGameWords(customWords);
      onPlayerUpdateRef.current?.({ playCount: playMetaRef.current.playCount + 1, specialWordTriggered: playMetaRef.current.specialWordTriggered });
      setWordIndex(0);
      setTypedChars('');
      setMissCount(0);
      setIsTransitioning(false);
      setIsShaking(false);
      setIsAllClear(false);
      setEarnedPoints(0);
      setTicketReward(null);
      setCountdownStep(0);
      setTimeLeft(60 + Math.floor(gearPowersRef.current.timePlus));
      setOfficialScore(0);
      setCombo(0);
      setIsTimeUp(false);
      return;
    }

    const { words, newPlayCount, newTriggered } = pickGameWords(
      difficulty,
      false,
      playMetaRef.current.playCount,
      playMetaRef.current.specialWordTriggered,
      undefined,
      adoptedWordsRef.current,
      reportedKanas,
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
    if (isDataLoaded) {
      restartRound();
    }
  }, [difficulty, restartRound, isDataLoaded]);

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

  // タイマーのカウントダウン
  useEffect(() => {
    if (isOfficialShow && !isCountdown && !isTimeUp && !isGearModalOpen && !reportOpen && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOfficialShow, isCountdown, isTimeUp, timeLeft, isGearModalOpen, reportOpen]);

  // のこり10秒のカウントダウン音
  useEffect(() => {
    if (isOfficialShow && !isCountdown && !isTimeUp && !isGearModalOpen && !reportOpen && timeLeft <= 10 && timeLeft > 0) {
      playSE?.('countdown_10s');
    }
  }, [timeLeft, isOfficialShow, isCountdown, isTimeUp, playSE, isGearModalOpen, reportOpen]);

  // タイムアップ時の処理
  useEffect(() => {
    if (isOfficialShow && timeLeft === 0 && !isTimeUp) {
      setIsTimeUp(true);
      playSE?.('timeup');
      
      const finalScore = Math.floor(officialScore * (1 + gearPowersRef.current.scoreBoost));
      
      (async () => {
        setOfficialShowUploading(true);
        try {
          await saveOfficialShowScore(player, finalScore);
          
          if (player && onPlayerUpdateRef.current) {
            const currentBgs = player.backgrounds || ['default'];
            if (!currentBgs.includes('show_stage')) {
              onPlayerUpdateRef.current({
                backgrounds: [...currentBgs, 'show_stage']
              });
              setReportToast('🎁「タイピングショーのぶたい」の背景をゲットしたよ！プロフィールからきがえてみてね！');
            }
          }
        } catch (e) {
          console.error("Score save failed", e);
        }
        
        const unsubscribe = listenOfficialShowRankings(rankings => {
          const currentRankings = [...rankings];
          const myIndex = currentRankings.findIndex(r => r.playerId === (player?.id || 'guest') && r.score >= finalScore);
          if (myIndex === -1) {
            currentRankings.push({
              id: `local_run_${Date.now()}`,
              playerId: player?.id || 'guest',
              playerName: player?.name || 'ゲスト',
              score: finalScore,
              currentTitle: player?.currentTitle || 'rookie',
              currentBackground: player?.currentBackground || 'default',
              currentIcon: player?.currentIcon || null,
              currentFrame: player?.currentFrame || null,
              typingShowGears: player?.typingShowGears || null,
            });
            currentRankings.sort((a, b) => b.score - a.score);
          }
          setLatestRankings(currentRankings.slice(0, 5));
        });
        if (player && onPlayerUpdateRef.current) {
          const currentCount = player.officialShowPlayedCount || 0;
          const updates = { officialShowPlayedCount: currentCount + 1 };
          if (finalScore > (player.officialShowHighScore || 0)) {
            updates.officialShowHighScore = finalScore;
          }
          onPlayerUpdateRef.current(updates);
        }
        
        setOfficialShowUploading(false);
        playSE?.('clear');
        return () => unsubscribe();
      })();
    }
  }, [isOfficialShow, timeLeft, isTimeUp, player, officialScore, playSE]);

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

        const newReportedKanas = [...reportedKanas, currentWord.kana];
        setReportedKanas(newReportedKanas);

        if (isOfficialShow) {
          setTypedChars('');
          setWordIndex(prev => prev + 1);
          setReportToast(reportId ? '問題をほうこくして、次の問題にすすめたよ！' : 'ほうこくに失敗したけど、次の問題にすすむよ！');
        } else {
          const excludeKanas = gameWords.map((word) => word.kana);
          const replacement = pickReplacementWord(
            difficulty,
            excludeKanas,
            adoptedWordsRef.current,
            newReportedKanas,
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
      const encounteredKeywords = { ...(player?.encounteredKeywords || {}) };
      gameWords.forEach(w => {
        if (!w.isAlphabetQuiz) {
          encounteredKeywords[w.kana] = true;
        }
      });

      const updates = {
        points: newPoints,
        difficultyClears,
        noMissClear: player?.noMissClear || earnedNoMiss,
        encounteredKeywords,
        plazaSubEvents: appendSubEventsAfterTypingClear({
          ...player,
          points: newPoints,
          difficultyClears,
        }),
      };
      const oldAchievements = player?.achievements || [];
      const newAchievements = computeAchievements(
        { ...player, ...updates },
        player?.collection || {},
      );
      updates.achievements = newAchievements;

      const masterTitles = ['easy_master', 'normal_master', 'hard_master', 'very_hard_master'];
      const newlyEarned = newAchievements.filter(a => !oldAchievements.includes(a) && masterTitles.includes(a));
      
      let earnedTicketType = null;
      if (newlyEarned.length > 0) {
        const ticketTypes = ['specialTickets', 'bgmTickets', 'seTickets', 'legendTickets'];
        const randomType = ticketTypes[Math.floor(Math.random() * ticketTypes.length)];
        updates[randomType] = (player?.[randomType] || 0) + 1;
        
        earnedTicketType = randomType.replace('Tickets', '');
        if (earnedTicketType === 'special') earnedTicketType = 'special'; // wait, TicketRewardModal expects 'legend', 'se', 'bgm', 'special'
      }

      onPlayerUpdateRef.current?.(updates);

      // If we earned a master title, show the reward modal for it instead of directly finishing.
      if (newlyEarned.length > 0) {
        const titleId = newlyEarned[0];
        const titleObj = TITLES.find(t => t.id === titleId);
        if (titleObj && earnedTicketType) {
          setTicketReward({
            show: true,
            type: earnedTicketType,
            titleObj: titleObj,
            count: 1,
            onConfirm: () => {}
          });
          playSE?.('legend');
        }
      } else {
        setTimeout(() => playSE?.('points'), 300);
      }
    },
    [difficulty, localPoints, missCount, player, playSE, gameWords],
  );

  const completeCurrentWord = useCallback(() => {
    setIsTransitioning(true);
    const isSpecialWord = currentWord?.isSpecial;
    const isLastWord = wordIndex + 1 >= gameWords.length;

    const proceedToNext = () => {
      setTicketReward(null);
      if (isLastWord) {
        if (isOfficialShow) {
          // 念のため単語ループ
          setWordIndex(0);
          setTypedChars('');
        } else {
          const pts = calcClearPoints(difficulty, missCount, assistSettings);
          finishClear(pts);
        }
      } else {
        setWordIndex((prev) => prev + 1);
        setTypedChars('');
      }
      setIsTransitioning(false);
    };

    if (isOfficialShow) {
      setTimeout(proceedToNext, 100);
      return;
    }

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
        isTimeUp ||
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

        if (isOfficialShow) {
          const nextCombo = combo + 1;
          setCombo(nextCombo);
          
          const comboLimit = 3 + gearPowersRef.current.comboBoost;
          const comboMultiplier = Math.min(comboLimit, 1 + Math.floor(nextCombo / 5) * 0.2);
          const pts = currentWord?.isSpecial ? 500 : 100;
          setOfficialScore(prev => prev + Math.floor(pts * comboMultiplier));
        }

        if (validRomajiList.some((r) => r === newTyped)) {
          completeCurrentWord();
        }
      } else {
        registerKeyPress(false);
        if (
          e.key !== 'Shift' &&
          e.key !== 'CapsLock' &&
          e.key !== 'Control' &&
          e.key !== 'Alt' &&
          e.key !== 'Meta'
        ) {
          if (isOfficialShow) {
            const guarded = Math.random() < (gearPowersRef.current.missGuardProb / 100);
            if (guarded) {
              playSE?.('legend'); // Shield effect sound
            } else {
              setCombo(0);
              setMissCount((prev) => prev + 1);
            }
          } else {
            setMissCount((prev) => prev + 1);
          }
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
      isTimeUp,
      combo,
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

  if (isTimeUp) {
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
        <main className="flex-1 flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 overflow-y-auto w-full">
          <div className="bg-white/95 border-4 border-yellow-300 rounded-3xl p-4 sm:p-8 text-center max-w-lg w-full shadow-2xl animate-fade-in relative my-auto shrink-0">
            {officialShowUploading && (
              <div className="absolute inset-0 bg-white/80 rounded-3xl flex flex-col items-center justify-center z-10">
                <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="font-bold text-sky-700">スコア送信中...</p>
              </div>
            )}
            <div className="text-6xl mb-4">⏱️</div>
            <h2 className="text-3xl font-black text-rose-600 mb-2">タイムアップ！</h2>
            <div className="bg-gray-50 rounded-2xl p-4 mb-6 border-2 border-gray-200">
              <p className="text-gray-500 font-bold mb-1">あなたのスコア</p>
              <p className="text-6xl font-black text-rose-500 drop-shadow-sm">
                {officialScore}
              </p>
            </div>
            
            {(() => {
              const myRankIndex = latestRankings.findIndex(r => r.playerId === (player?.id || 'guest') && r.score === officialScore);
              const isRankIn = myRankIndex !== -1 && myRankIndex < 5;
              
              return (
                <>
                  {isRankIn && (
                    <div className="w-full bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 rounded-2xl p-3 mb-6 shadow-xl animate-bounce border-4 border-white transform hover:scale-105 transition-transform">
                      <p className="text-xl font-black text-amber-900 drop-shadow-sm">
                        🎊 {myRankIndex + 1}位に ランクイン！ 🎊
                      </p>
                    </div>
                  )}
                  {latestRankings.length > 0 && (
                    <div className="w-full bg-rose-50 rounded-xl p-4 mb-6 border border-rose-100">
                      <h5 className="text-sm font-black text-rose-800 mb-2 text-center">🏆 トップ5ランキング</h5>
                      <div className="flex flex-col gap-1 text-left">
                        {latestRankings.map((r, i) => (
                          <div key={r.id} className={`relative flex items-center mb-2 ${isRankIn && i === myRankIndex ? 'ring-4 ring-yellow-400 rounded-2xl animate-pulse' : ''}`}>
                            <div className={`absolute -left-2 sm:-left-4 z-10 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-white shadow-md border-2 border-white ${i === 0 ? 'bg-yellow-400 text-lg sm:text-xl scale-110' : i === 1 ? 'bg-gray-400 text-base sm:text-lg' : i === 2 ? 'bg-amber-600 text-base sm:text-lg' : 'bg-rose-300 text-sm sm:text-base'}`}>
                              {i + 1}
                            </div>
                            <div className={`flex flex-col w-full pl-6 sm:pl-8 gap-1.5 pr-16 sm:pr-24 ${i === 0 ? 'transform scale-[1.02] origin-left' : ''}`}>
                              <div className="w-full">
                                <PlayerCard 
                                  player={{ ...r, name: r.playerName, points: r.score }} 
                                  readOnly 
                                  compact={i !== 0}
                                />
                              </div>
                              {r.typingShowGears && (
                                <div className="flex flex-wrap gap-1 shrink-0 bg-amber-50/90 p-1.5 rounded-lg shadow-inner border border-amber-200 relative z-20">
                                  {r.typingShowGears.main?.map((gearName, idx) => {
                                    const item = gearName ? GACHA_ITEMS.find(i => i.name === gearName) : null;
                                    const level = item && r?.itemLevels?.[gearName] ? r.itemLevels[gearName] : 1;
                                    return (
                                      <div key={`main-${idx}`} className={`${i === 0 ? 'w-10 h-10' : 'w-7 h-7'} shrink-0 rounded-md bg-white flex items-center justify-center border shadow-sm ${item?.rarity === '💎ミラクル💎' ? 'miracle-card border-none' : item?.rarity === '✨レジェンド✨' ? 'legend-card border-none' : ''} ${(!item || (item.rarity !== '💎ミラクル💎' && item.rarity !== '✨レジェンド✨')) && item?.foil ? 'foil-icon-chip' : ''}`} style={item ? (item.rarity === '💎ミラクル💎' || item.rarity === '✨レジェンド✨' ? {} : { borderColor: item.color }) : { borderColor: '#e5e7eb', borderStyle: 'dashed' }} title={item ? getGearTooltip(item.name, level) : '空き'}>
                                        <span className={`${i === 0 ? 'text-[26px]' : 'text-[18px]'}`}>{item ? item.emoji : ''}</span>
                                      </div>
                                    );
                                  })}
                                  {r.typingShowGears.sub?.map((gearName, idx) => {
                                    const item = gearName ? GACHA_ITEMS.find(i => i.name === gearName) : null;
                                    const level = item && r?.itemLevels?.[gearName] ? r.itemLevels[gearName] : 1;
                                    return (
                                      <div key={`sub-${idx}`} className={`${i === 0 ? 'w-8 h-8 mt-1' : 'w-5 h-5 mt-1'} shrink-0 rounded-md bg-white flex items-center justify-center border shadow-sm ${item?.rarity === '💎ミラクル💎' ? 'miracle-card border-none' : item?.rarity === '✨レジェンド✨' ? 'legend-card border-none' : ''} ${(!item || (item.rarity !== '💎ミラクル💎' && item.rarity !== '✨レジェンド✨')) && item?.foil ? 'foil-icon-chip' : ''}`} style={item ? (item.rarity === '💎ミラクル💎' || item.rarity === '✨レジェンド✨' ? {} : { borderColor: item.color }) : { borderColor: '#e5e7eb', borderStyle: 'dashed' }} title={item ? getGearTooltip(item.name, level) : '空き'}>
                                        <span className={`${i === 0 ? 'text-[20px]' : 'text-[14px]'}`}>{item ? item.emoji : ''}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            <div className="absolute right-2 sm:right-4 z-10 bg-white/90 px-2 sm:px-3 py-1 rounded-full font-black text-rose-500 shadow-sm border-2 border-rose-100 text-sm sm:text-lg">
                              {r.score}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
            
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={onBack}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black text-lg py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
              >
                タイピングショーにもどる
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isDataLoaded) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90 z-50">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
      {/* デコレーション（カスタムステージのみ） */}
      {isCustomStage && difficulty.decorations?.map((deco, i) => (
        <React.Fragment key={`deco-group-${i}`}>
          {Array.from({ length: deco.count }).map((_, j) => {
            const seed = i * 100 + j;
            const size = 40 + (seed % 60); // 40-100px
            const left = 5 + (seed * 17 % 90); // 5-95%
            const top = 5 + (seed * 23 % 90); // 5-95%
            const delay = (seed % 5) * 0.5;
            return (
              <div
                key={`deco-${i}-${j}`}
                className="absolute opacity-50 pointer-events-none z-0 animate-bounce"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  fontSize: `${size}px`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${2 + (seed % 3)}s`
                }}
              >
                {deco.emoji}
              </div>
            );
          })}
        </React.Fragment>
      ))}

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

      <main className="flex-1 h-full flex flex-col items-center justify-center min-h-0 p-2 overflow-y-auto z-10">
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

            {isOfficialShow ? (
              <>
                <div className="absolute -top-12 sm:-top-16 right-0">
                  <button
                    onClick={() => {
                      playSE?.('decide');
                      setIsGearModalOpen(true);
                    }}
                    className="flex flex-col items-center bg-white border-2 border-indigo-200 rounded-xl p-1.5 shadow hover:shadow-md transition-all active:scale-95 text-indigo-600 hover:text-indigo-700 hover:border-indigo-300 group"
                  >
                    <span className="text-xl sm:text-2xl group-hover:rotate-12 transition-transform">⚙️</span>
                    <span className="text-[10px] sm:text-xs font-black leading-tight">スキル装備</span>
                  </button>
                </div>
                <div className="flex justify-between items-center w-full mb-4 px-2 sm:px-4 pb-3 border-b border-gray-100">
                <div className="flex flex-col items-center w-24">
                  <span className="text-xs font-black text-gray-500">のこり時間</span>
                  <span className={`font-black transition-all ${timeLeft <= 10 ? 'text-red-500 text-5xl animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'text-sky-500 text-3xl'}`}>
                    {timeLeft}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-black text-gray-500">スコア</span>
                  <HiraganaBounceValue 
                    value={officialScore}
                    className={`text-4xl font-black ${
                      combo >= 20 ? 'text-fuchsia-500 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)] scale-125' : 
                      combo >= 10 ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] scale-110' : 
                      'text-rose-500'
                    }`}
                  />
                </div>
                <div className="flex flex-col items-center w-24">
                  <span className="text-xs font-black text-gray-500">コンボ倍率</span>
                  <div className="flex items-baseline gap-1">
                    <HiraganaBounceValue
                      value={combo}
                      className={`text-2xl font-black ${
                        combo >= 20 ? 'text-fuchsia-500' : 
                        combo >= 10 ? 'text-red-500' : 
                        'text-amber-500'
                      }`}
                    />
                    <span className="text-xs font-bold text-amber-600">({Math.min(3, 1 + Math.floor(combo / 5) * 0.2).toFixed(1)}x)</span>
                  </div>
                </div>
                </div>
              </>
            ) : (
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
            )}

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

      <GearEquipModal
        isOpen={isGearModalOpen}
        player={player}
        onClose={() => setIsGearModalOpen(false)}
        onPlayerUpdate={onPlayerUpdate}
        playDecideSound={() => playSE?.('decide')}
        playCancelSound={() => playSE?.('cancel')}
      />
    </div>
  );
}
