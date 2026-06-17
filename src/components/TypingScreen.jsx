import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CheckCircle2, Star, RefreshCcw } from 'lucide-react';
import {
  WORDS,
  FINGER_MAP,
  KEYBOARD_ROWS,
  resolveBackground,
  WORDS_PER_ROUND,
} from '../constants';
import GameSidebar from './GameSidebar';
import CollectionSidebar from './CollectionSidebar';
import AssistSettingsModal from './AssistSettingsModal';

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickGameWords(difficulty, count = WORDS_PER_ROUND) {
  const pool = WORDS[difficulty] || WORDS.normal;
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

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

function VirtualKeyboard({ assistSettings, nextCharForAssist, isTransitioning }) {
  const formatChar = (c) => (assistSettings.letterCase === 'upper' ? c.toUpperCase() : c);

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
  onLogout,
  onOpenProfile,
  onOpenMusic,
  onOpenShop,
  playSE,
}) {
  const [gameWords, setGameWords] = useState(() => pickGameWords(difficulty));
  const [wordIndex, setWordIndex] = useState(0);
  const [typedChars, setTypedChars] = useState('');
  const [missCount, setMissCount] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isAllClear, setIsAllClear] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [isAssistOpen, setIsAssistOpen] = useState(false);
  const [localPoints, setLocalPoints] = useState(player?.points || 0);

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

  const nextValidChars = useMemo(
    () => validRomajiList.map((r) => r[typedChars.length]).filter(Boolean),
    [validRomajiList, typedChars],
  );

  const nextCharForAssist = displayRomaji[typedChars.length] || '';

  const restartRound = useCallback(() => {
    setGameWords(pickGameWords(difficulty));
    setWordIndex(0);
    setTypedChars('');
    setMissCount(0);
    setIsTransitioning(false);
    setIsShaking(false);
    setIsAllClear(false);
    setEarnedPoints(0);
  }, [difficulty]);

  useEffect(() => {
    restartRound();
  }, [difficulty, restartRound]);

  const finishClear = useCallback(
    (pts) => {
      setEarnedPoints(pts);
      setIsAllClear(true);
      const newPoints = localPoints + pts;
      setLocalPoints(newPoints);
      onPlayerUpdate?.({ points: newPoints });
      setTimeout(() => playSE?.('points'), 300);
    },
    [localPoints, onPlayerUpdate, playSE],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.repeat || isTransitioning || isAllClear || isAssistOpen) return;
      if (e.key === 'Shift' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (!/^[a-zA-Z0-9\-!?,.]$/.test(e.key)) return;

      const inputChar = e.key.toLowerCase();

      if (nextValidChars.includes(inputChar)) {
        const newTyped = typedChars + inputChar;
        setTypedChars(newTyped);
        playSE?.('type');

        if (validRomajiList.some((r) => r === newTyped)) {
          setIsTransitioning(true);
          const isLastWord = wordIndex + 1 >= gameWords.length;
          playSE?.(isLastWord ? 'allClear' : 'wordClear');

          setTimeout(() => {
            if (isLastWord) {
              const pts = calcClearPoints(difficulty, missCount, assistSettings);
              finishClear(pts);
            } else {
              setWordIndex((prev) => prev + 1);
              setTypedChars('');
            }
            setIsTransitioning(false);
          }, 800);
        }
      } else if (difficulty !== 'easy') {
        setMissCount((prev) => prev + 1);
        setIsShaking(true);
        playSE?.('error');
        setTimeout(() => setIsShaking(false), 300);
      }
    },
    [
      typedChars,
      nextValidChars,
      validRomajiList,
      wordIndex,
      gameWords.length,
      isTransitioning,
      isAllClear,
      isAssistOpen,
      difficulty,
      missCount,
      assistSettings,
      finishClear,
      playSE,
    ],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const formatTyped = (text) =>
    assistSettings.letterCase === 'upper' ? text.toUpperCase() : text;

  const formatHint = (text) =>
    assistSettings.letterCase === 'upper' ? text.toUpperCase() : text;

  if (isAllClear) {
    return (
      <div
        className="h-screen flex w-full relative bg-cover bg-center overflow-hidden"
        style={{ backgroundImage: `url(${activeBg.url})` }}
      >
        <GameSidebar
          player={{ ...player, points: localPoints }}
          onSaveAndTitle={onLogout}
          onGoHome={onBack}
          onShop={onOpenShop}
          onProfile={onOpenProfile}
          onMusic={onOpenMusic}
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

  return (
    <div
      className="h-screen flex w-full relative bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: `url(${activeBg.url})` }}
    >
      <GameSidebar
        player={{ ...player, points: localPoints }}
        onSaveAndTitle={onLogout}
        onGoHome={onBack}
        onShop={onOpenShop}
        onProfile={onOpenProfile}
        onMusic={onOpenMusic}
        onAssist={() => setIsAssistOpen(true)}
        assistActive={
          assistSettings.keyboardHighlight ||
          assistSettings.showRomajiHint ||
          assistSettings.showFingerGuide
        }
      />

      <main className="flex-1 h-full flex flex-col items-center justify-center min-h-0 p-2 overflow-y-auto">
        <div className="w-full max-w-xl flex flex-col items-center gap-2 py-2">
          <div
            className={`bg-white/98 border-4 border-yellow-300 p-4 sm:p-5 rounded-3xl text-center w-full relative shadow-xl transition-transform duration-100 ${
              isShaking ? 'translate-x-2 rotate-1 bg-red-50' : ''
            }`}
          >
            {isTransitioning && (
              <div className="absolute inset-0 bg-white/90 rounded-3xl flex flex-col items-center justify-center z-20 animate-fade-in">
                <CheckCircle2 className="w-20 h-20 text-green-500 mb-2 animate-bounce" />
                <span className="text-4xl font-black text-green-500 tracking-widest">OK!</span>
              </div>
            )}

            <div className="flex flex-col items-center gap-1 mb-4 pb-3 border-b border-gray-100 shrink-0">
              <div className="flex gap-2 justify-center">
                {gameWords.map((word, index) => {
                  const isActive = index === wordIndex;
                  const isCleared = index < wordIndex;
                  let starClass = 'text-white fill-gray-200 opacity-50';
                  if (isCleared) starClass = 'text-yellow-400 fill-yellow-400 scale-110';
                  else if (isActive) starClass = 'text-yellow-400 fill-yellow-100 scale-125 animate-pulse';
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
                  {formatHint(currentWord?.romaji[0] || '')}
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
                  className="text-3xl sm:text-4xl font-black text-gray-900 tracking-widest mb-3"
                  style={{
                    textShadow: '0 2px 0 #fff, 0 -2px 0 #fff, 2px 0 0 #fff, -2px 0 0 #fff',
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
          />
        </div>
      </main>

      <CollectionSidebar player={{ ...player, points: localPoints }} />

      <AssistSettingsModal
        isOpen={isAssistOpen}
        settings={assistSettings}
        onChange={onAssistChange}
        onClose={() => setIsAssistOpen(false)}
      />
    </div>
  );
}
