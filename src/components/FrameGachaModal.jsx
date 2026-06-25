import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { FRAME_GACHA_LABELS } from '../constants/saveFrames';
import { pullSaveFrame } from '../utils/saveFrameGacha';
import PlayerCard from './PlayerCard';

const SPIN_MS = 1400;

export default function FrameGachaModal({
  pool,
  player,
  unlockedFrames = [],
  onComplete,
  playDecideSound,
  playSE,
}) {
  const [phase, setPhase] = useState('ready');
  const [result, setResult] = useState(null);
  const labels = FRAME_GACHA_LABELS[pool] || FRAME_GACHA_LABELS.practice;

  useEffect(() => {
    if (phase !== 'spinning') return undefined;
    const timer = setTimeout(() => {
      const pull = pullSaveFrame(pool, unlockedFrames);
      setResult(pull);
      setPhase('result');
      playSE?.('gacha');
      if (pull.frame) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.65 } });
      }
    }, SPIN_MS);
    return () => clearTimeout(timer);
  }, [phase, playSE, pool, unlockedFrames]);

  const handlePull = () => {
    playDecideSound?.();
    setPhase('spinning');
  };

  const handleClose = () => {
    playDecideSound?.();
    onComplete?.(result);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-fade-in">
      <div className="relative max-w-sm w-full animate-pop-out">
        <div className="absolute -inset-2 rounded-[2rem] bg-gradient-to-r from-fuchsia-400 via-amber-300 to-sky-400 blur-sm opacity-90" />
        <div className="relative bg-white border-8 border-white rounded-[2rem] p-6 sm:p-8 text-center shadow-2xl">
          <div className="text-xs font-black text-fuchsia-600 mb-1">{labels.subtitle}</div>
          <h2 className="text-xl font-black text-gray-800 mb-4">{labels.title}</h2>

          {phase === 'ready' && (
            <>
              <div className="w-28 h-28 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-sky-100 to-indigo-100 border-4 border-indigo-200 flex items-center justify-center text-5xl animate-pulse">
                🖼️
              </div>
              <p className="text-sm font-bold text-gray-600 mb-5">
                タイトル画面の セーブデータに<br />
                かわいい フレームが つくよ！
              </p>
              <button
                type="button"
                onClick={handlePull}
                className="premium-button w-full py-3 bg-gradient-to-r from-pink-500 via-violet-500 to-indigo-500 text-white font-black text-lg border-b-4 border-indigo-800"
              >
                フレームガチャを まわす！
              </button>
            </>
          )}

          {phase === 'spinning' && (
            <>
              <div className="w-28 h-28 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-yellow-100 to-orange-100 border-4 border-amber-300 flex items-center justify-center text-5xl animate-spin-shake">
                ✨
              </div>
              <p className="text-sm font-black text-amber-600 animate-pulse">ガチャ中…</p>
            </>
          )}

          {phase === 'result' && (
            <>
              {result?.frame ? (
                <>
                  <p className="text-sm font-black text-emerald-600 mb-3">
                    セーブカードに つけたよ！ 🎉
                  </p>
                  {player ? (
                    <div className="w-full max-w-xs mx-auto mb-4 text-left">
                      <PlayerCard
                        readOnly
                        compact
                        player={{
                          ...player,
                          currentFrame: result.frame.id,
                          unlockedFrames: [...new Set([...(player.unlockedFrames || []), result.frame.id])],
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-5xl mb-4">{result.frame.emoji}</div>
                  )}
                  <p className="text-xs font-bold text-gray-500 mb-5">{result.frame.name}</p>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-3">🎁</div>
                  <p className="text-sm font-bold text-gray-600 mb-5">
                    このガチャの フレームは ぜんぶ そろってるね！
                  </p>
                </>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="premium-button w-full py-3 bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-black text-lg border-b-4 border-teal-700"
              >
                OK！
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
