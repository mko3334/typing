import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { FINGER_MAP, KEYBOARD_ROWS } from '../constants';
import { buildChoices, getChoiceDisplay, getValidRomajiList } from '../utils/subEvents';
import { pickSubEventReplacement } from '../utils/typingWords';
import { submitTypingReport } from '../firebase';
import { refreshWordCorrections } from '../utils/wordCorrections';
import FuriganaText from './FuriganaText';
import TypingProblemReportModal from './TypingProblemReportModal';

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
    <div className="mt-2 flex flex-col items-center bg-white p-2.5 rounded-xl border border-sky-100 shadow-md shrink-0 w-full max-w-md">
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
          </div>
        </div>
        <div
          className={`relative w-16 h-10 flex items-end justify-center rounded-b-xl border transition-all ${
            isRight ? 'border-red-500 bg-red-50/30 shadow-sm scale-105' : 'border-gray-200 bg-gray-50/30 opacity-60'
          }`}
        >
          <span className="absolute -top-3.5 text-[8px] font-black text-gray-500">みぎ手</span>
          <div className="absolute bottom-0 w-full flex justify-between px-1 items-end h-8 pointer-events-none">
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

function VirtualKeyboard({ assistSettings, nextCharForAssist }) {
  const formatChar = (c) => (assistSettings.letterCase === 'upper' ? c.toUpperCase() : c);

  return (
    <div className="mt-2 w-full max-w-xl shrink-0 mx-auto">
      <div className="bg-white/60 backdrop-blur-md p-3 rounded-[1.5rem] shadow-inner border border-white/40">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex justify-center mb-1 gap-0.5"
            style={{ paddingLeft: rowIndex === 3 ? '0.2rem' : `${rowIndex * 0.8}rem` }}
          >
            {row.map((key) => {
              const isNextKey =
                assistSettings.keyboardHighlight &&
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
                  className={`min-w-[1.35rem] h-7 sm:h-9 px-0.5 rounded-lg border-b-[3px] font-black text-[9px] sm:text-xs flex items-center justify-center transition-all select-none ${highlightClass}`}
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

export default function SubEventModal({
  event,
  player,
  assistSettings,
  onClose,
  onComplete,
  playSE,
  playCancelSound,
}) {
  const [rallyIndex, setRallyIndex] = useState(0);
  const [choiceSelected, setChoiceSelected] = useState(false);
  const [typedChars, setTypedChars] = useState('');
  const [wrongChoiceHint, setWrongChoiceHint] = useState('');
  const [rallyOverrides, setRallyOverrides] = useState({});
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportToast, setReportToast] = useState('');

  const baseRally = event.rallies[rallyIndex];
  const currentRally = useMemo(() => {
    if (!baseRally) return null;
    const override = rallyOverrides[rallyIndex];
    return override ? { ...baseRally, ...override } : baseRally;
  }, [baseRally, rallyIndex, rallyOverrides]);

  useEffect(() => {
    refreshWordCorrections();
  }, []);

  useEffect(() => {
    if (!reportToast) return undefined;
    const timer = setTimeout(() => setReportToast(''), 2800);
    return () => clearTimeout(timer);
  }, [reportToast]);
  const choices = useMemo(
    () => (baseRally ? buildChoices(baseRally.kana) : []),
    [baseRally],
  );

  const validRomajiList = useMemo(
    () => (currentRally ? getValidRomajiList(currentRally, event.id) : []),
    [currentRally, event.id],
  );

  const displayRomaji = useMemo(() => {
    if (validRomajiList.length === 0) return '';
    const sorted = [...validRomajiList].sort((a, b) => a.length - b.length);
    return sorted.find((r) => r.startsWith(typedChars)) || sorted[0] || '';
  }, [validRomajiList, typedChars]);

  const nextValidChars = useMemo(
    () => validRomajiList.map((r) => r[typedChars.length]).filter(Boolean),
    [validRomajiList, typedChars],
  );

  const nextCharForAssist = displayRomaji[typedChars.length] || '';

  const resetRallyState = useCallback(() => {
    setChoiceSelected(false);
    setTypedChars('');
    setWrongChoiceHint('');
  }, []);

  const handleClose = () => {
    playCancelSound?.();
    onClose?.();
  };

  const handleChoice = (choice) => {
    if (choice === baseRally.kana) {
      playSE?.('correct');
      setWrongChoiceHint('');
      setChoiceSelected(true);
    } else {
      playSE?.('error');
      setWrongChoiceHint('{ちが|違}うことを {おし|教}えてあげて');
    }
  };

  const handleReportConfirm = useCallback(
    async (reason) => {
      if (!currentRally || reportSubmitting) return;
      setReportSubmitting(true);
      try {
        const reportId = await submitTypingReport({
          context: 'sub_event',
          eventId: event.id,
          eventTitle: event.title,
          rallyIndex,
          playerId: player?.id || null,
          playerName: player?.name || 'ゲスト',
          kana: currentRally.kana,
          romaji: getValidRomajiList(currentRally, event.id),
          kanaDisplay: currentRally.kanaDisplay || currentRally.kana,
          displayRomaji,
          reason,
        });

        const excludeKanas = event.rallies.flatMap((rally, index) => {
          const override = rallyOverrides[index];
          return [override?.kana || rally.kana];
        });
        const replacement = pickSubEventReplacement(excludeKanas);
        if (replacement) {
          setRallyOverrides((prev) => ({
            ...prev,
            [rallyIndex]: {
              kana: replacement.kana,
              romaji: replacement.romaji,
              kanaDisplay: replacement.kana,
            },
          }));
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
      currentRally,
      displayRomaji,
      event.id,
      event.rallies,
      event.title,
      player?.id,
      player?.name,
      rallyIndex,
      rallyOverrides,
      reportSubmitting,
    ],
  );

  const advanceRally = useCallback(() => {
    if (rallyIndex + 1 >= event.rallies.length) {
      onComplete?.(event);
      return;
    }
    setRallyIndex((prev) => prev + 1);
    resetRallyState();
  }, [event, onComplete, rallyIndex, resetRallyState]);

  useEffect(() => {
    if (!choiceSelected) return undefined;

    const handleKeyDown = (e) => {
      if (e.repeat) return;
      if (e.key === 'Shift' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (!/^[a-zA-Z0-9\-!?,.]$/.test(e.key)) return;

      const inputChar = e.key.toLowerCase();
      if (!nextValidChars.includes(inputChar)) {
        playSE?.('error');
        return;
      }

      const newTyped = typedChars + inputChar;
      setTypedChars(newTyped);
      playSE?.('type');

      if (validRomajiList.some((r) => r === newTyped)) {
        playSE?.('correct');
        setTimeout(advanceRally, 400);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    advanceRally,
    choiceSelected,
    nextValidChars,
    playSE,
    typedChars,
    validRomajiList,
  ]);

  if (!event || !currentRally) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card bg-white/95 w-full max-w-xl p-6 max-h-[95vh] flex flex-col shadow-2xl rounded-3xl border-4 border-yellow-400 overflow-y-auto relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 p-1.5 hover:bg-gray-100 active:scale-95 rounded-full transition-all z-20"
          title="あとにする"
        >
          <X className="w-6 h-6 text-gray-500" />
        </button>

        <div className="flex justify-between items-center mb-4 shrink-0 pr-8">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0">{event.emoji}</span>
            <h2 className="text-lg sm:text-xl font-black text-gray-800 truncate">
              <FuriganaText>{event.titleDisplay || event.title}</FuriganaText>
            </h2>
          </div>
          <span className="bg-yellow-100 text-yellow-800 text-xs font-black px-3 py-1 rounded-full shrink-0">
            ラリー {rallyIndex + 1} / {event.rallies.length}
          </span>
        </div>

        <div className="flex gap-4 items-start mb-4">
          <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-yellow-400 overflow-hidden shadow-lg bg-white">
            {event.image ? (
              <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-yellow-100 to-orange-100">
                {event.emoji}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
            <div className="text-xs font-black text-amber-700 mb-1">{currentRally.speaker}</div>
            <p className="text-sm sm:text-base font-bold text-gray-700 leading-relaxed">
              <FuriganaText>{currentRally.textDisplay || currentRally.text}</FuriganaText>
            </p>
          </div>
        </div>

        {!choiceSelected ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="text-sm font-black text-sky-700 mb-3 text-center">
              どんな ことばで こたえる？（3つから えらんでね）
            </div>
            {wrongChoiceHint && (
              <div className="mb-3 rounded-2xl border-2 border-rose-300 bg-rose-50 px-4 py-3 text-center text-sm sm:text-base font-black text-rose-600 animate-fade-in">
                <FuriganaText>{wrongChoiceHint}</FuriganaText>
              </div>
            )}
            <div className="grid gap-3">
              {choices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => handleChoice(choice)}
                  className="bg-white hover:bg-sky-50 active:scale-[0.98] border-2 border-sky-200 hover:border-sky-400 text-gray-800 font-black text-base sm:text-lg py-3 px-4 rounded-2xl shadow-sm hover:shadow-md transition-all text-center"
                >
                  <FuriganaText>{getChoiceDisplay(choice, baseRally)}</FuriganaText>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 flex flex-col items-center justify-center py-4 bg-sky-50/50 rounded-2xl border border-sky-100/50 mb-4">
              <div className="text-xs sm:text-sm font-black text-sky-600 mb-2">
                えらんだ ことばを タイピングしよう！
              </div>
              <div className="text-2xl sm:text-3xl font-black text-gray-800 mb-4 tracking-wider">
                <FuriganaText>{currentRally.kanaDisplay || currentRally.kana}</FuriganaText>
              </div>

              {assistSettings.showRomajiHint && (
                <div className="text-lg sm:text-xl font-mono font-bold tracking-wider select-none mb-2">
                  <span className="text-sky-600">
                    {assistSettings.letterCase === 'upper'
                      ? typedChars.toUpperCase()
                      : typedChars.toLowerCase()}
                  </span>
                  <span className="text-gray-500">
                    {(assistSettings.letterCase === 'upper'
                      ? displayRomaji.toUpperCase()
                      : displayRomaji.toLowerCase()
                    ).slice(typedChars.length)}
                  </span>
                </div>
              )}

              {!assistSettings.showRomajiHint && (
                <div className="text-lg sm:text-xl font-mono font-bold tracking-wider text-sky-600 select-none mb-2">
                  {assistSettings.letterCase === 'upper'
                    ? typedChars.toUpperCase()
                    : typedChars.toLowerCase()}
                </div>
              )}
            </div>

            <FingerGuide nextChar={nextCharForAssist} assistSettings={assistSettings} />
            <VirtualKeyboard
              assistSettings={assistSettings}
              nextCharForAssist={nextCharForAssist}
            />
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="mt-3 mx-auto px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 border-2 border-amber-300 rounded-2xl font-black text-xs shadow-sm active:scale-95 transition-all"
            >
              🚨 問題を ほうこく
            </button>
          </>
        )}
      </div>

      <TypingProblemReportModal
        isOpen={reportOpen}
        wordLabel={currentRally?.kanaDisplay || currentRally?.kana || ''}
        onCancel={() => setReportOpen(false)}
        onConfirm={handleReportConfirm}
        submitting={reportSubmitting}
      />

      {reportToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[130] bg-amber-600/95 text-white px-5 py-3 rounded-2xl font-black text-sm shadow-xl animate-fade-in">
          {reportToast}
        </div>
      )}
    </div>
  );
}
