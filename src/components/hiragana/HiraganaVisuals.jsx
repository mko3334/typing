import React from 'react';

const FLOATERS = ['✨', '⭐', '💫', '🎀', '🌟', '💛', '💙', '💗'];

export function HiraganaSceneBackdrop({ children, className = '' }) {
  return (
    <div className={`relative min-h-0 flex flex-col ${className}`}>
      <div className="pointer-events-none absolute inset-0 hiragana-scene-bg" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {FLOATERS.map((icon, index) => (
          <span
            key={icon + index}
            className="absolute text-lg sm:text-2xl opacity-70 animate-hiragana-float select-none"
            style={{
              top: `${8 + (index * 11) % 78}%`,
              left: `${4 + (index * 13) % 88}%`,
              animationDelay: `${index * 0.35}s`,
              animationDuration: `${2.8 + (index % 3) * 0.6}s`,
            }}
          >
            {icon}
          </span>
        ))}
      </div>
      <div className="relative z-[1] min-h-0 flex flex-col flex-1">{children}</div>
    </div>
  );
}

export function HiraganaHero({ subtitle, compact = false }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.75rem] border-4 border-white/80 shadow-xl bg-gradient-to-r from-pink-400 via-sky-400 to-amber-300 ${
        compact ? 'p-3 sm:p-4' : 'p-4 sm:p-5'
      }`}
    >
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -left-4 bottom-0 w-24 h-24 rounded-full bg-yellow-200/40 blur-xl" />
      <div className="relative flex items-center gap-3 sm:gap-4">
        <div className={`shrink-0 ${compact ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-20 h-20 sm:w-24 sm:h-24'} animate-hiragana-pop-wiggle`}>
          <img
            src="/hiragana_mascot.png"
            alt="ひらがなマスコット"
            className="w-full h-full object-contain drop-shadow-lg"
          />
        </div>
        <div className="min-w-0 text-left">
          <p className="text-[10px] sm:text-xs font-black text-white/90 tracking-wider">POP CHALLENGE!</p>
          <h1 className="text-lg sm:text-2xl font-black text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.15)] leading-tight">
            🔤 ひらがなチャレンジ
          </h1>
          <p className="text-[10px] sm:text-xs font-bold text-white/95 mt-0.5">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export function HiraganaPopPanel({ children, className = '' }) {
  return (
    <div
      className={`rounded-[1.75rem] border-4 border-white/90 bg-white/88 backdrop-blur-md shadow-[0_12px_40px_rgba(99,102,241,0.18)] ${className}`}
    >
      {children}
    </div>
  );
}

export function HiraganaTabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 min-w-[5.5rem] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-black border-3 transition-all duration-200 ${
        active
          ? 'bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400 text-white border-white shadow-lg scale-[1.03] -translate-y-0.5'
          : 'bg-white/90 text-indigo-700 border-indigo-100 hover:border-pink-200 hover:bg-pink-50'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}

export function HiraganaInfoChip({ children, tone = 'amber' }) {
  const tones = {
    amber: 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-800',
    rose: 'bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200 text-rose-800',
    green: 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200 text-emerald-800',
    sky: 'bg-gradient-to-r from-sky-50 to-cyan-50 border-sky-200 text-sky-800',
    orange: 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 text-orange-800',
  };
  return (
    <p
      className={`text-xs font-black rounded-2xl px-3 py-2 border-2 shadow-sm ${tones[tone] || tones.amber}`}
    >
      {children}
    </p>
  );
}

export function HiraganaStageCard({ row, cleared, current, unlocked, selected, onSelect }) {
  const selectable = unlocked || cleared;
  return (
    <button
      type="button"
      disabled={!selectable}
      onClick={onSelect}
      className={`group relative overflow-hidden rounded-2xl border-3 p-3 text-left transition-all duration-200 ${
        selected ? `ring-4 ${row.ring} scale-[1.03] shadow-lg` : 'shadow-sm'
      } ${
        cleared
          ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300'
          : current
            ? `bg-gradient-to-br from-white to-sky-50 border-sky-300 ring-2 ring-sky-200`
            : unlocked
              ? 'bg-white border-indigo-100 hover:border-pink-300 hover:shadow-md'
              : 'bg-gray-100/80 border-gray-200 opacity-60 cursor-not-allowed'
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${row.theme}`} />
      <div className="flex items-start justify-between gap-1 mb-1.5 mt-1">
        <span className="text-2xl leading-none drop-shadow-sm">{row.emoji}</span>
        {cleared ? (
          <span className="text-lg animate-hiragana-pop-wiggle">✅</span>
        ) : !unlocked ? (
          <span className="text-sm opacity-60">🔒</span>
        ) : current ? (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-500 text-white">NOW</span>
        ) : null}
      </div>
      <div className="text-sm font-black text-gray-800">{row.label}</div>
      <p className="text-[10px] font-bold text-gray-500 mt-0.5 leading-snug">{row.chars.join(' ')}</p>
    </button>
  );
}

export function HiraganaKanaBubble({ kana, row, isTestPlay, displayRomaji, typedChars, shake }) {
  return (
    <div className={`relative ${shake ? 'animate-shake' : ''}`}>
      <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-r from-pink-300/40 via-sky-300/40 to-amber-300/40 blur-md" />
      <div className="relative rounded-[2rem] border-4 border-white bg-gradient-to-b from-white to-sky-50 px-6 py-6 sm:py-8 shadow-inner text-center">
        <p className="text-xs font-black text-pink-500 mb-3 tracking-wide">
          {isTestPlay ? '🎯 テスト！ ひらがなだけ見てね' : '✏️ うつ文字（ローマ字）'}
        </p>
        <div
          className={`inline-flex items-center justify-center min-w-[5.5rem] min-h-[5.5rem] sm:min-w-[6.5rem] sm:min-h-[6.5rem] rounded-3xl border-4 border-white shadow-lg bg-gradient-to-br ${row?.theme || 'from-sky-400 to-indigo-400'} animate-hiragana-pop-wiggle`}
        >
          <span className="text-5xl sm:text-6xl font-black text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.2)]">
            {kana}
          </span>
        </div>
        {displayRomaji && (
          <p className="text-lg font-black text-indigo-500 tracking-widest mt-3">{displayRomaji}</p>
        )}
        {isTestPlay && (
          <p className="text-xs font-black text-rose-500 mt-2 bg-rose-50 border border-rose-200 rounded-full px-3 py-1 inline-block">
            ヒントなし · キーボード光らせなし
          </p>
        )}
        <div className="mt-4 text-2xl sm:text-3xl font-mono font-black text-gray-700 min-h-[2.25rem] bg-white/70 rounded-xl px-4 py-1 border-2 border-dashed border-sky-200">
          {typedChars || '…'}
        </div>
      </div>
    </div>
  );
}

export function HiraganaProgressPills({ chars, currentIndex }) {
  return (
    <div className="flex justify-center gap-1.5 sm:gap-2 mb-4 flex-wrap">
      {chars.map((kana, index) => (
        <div
          key={`${kana}-${index}`}
          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-black border-3 transition-all duration-200 ${
            index < currentIndex
              ? 'bg-gradient-to-br from-green-300 to-emerald-400 border-white text-white shadow-md scale-95'
              : index === currentIndex
                ? 'bg-gradient-to-br from-sky-400 to-indigo-500 border-white text-white scale-110 shadow-lg animate-hiragana-pop-wiggle'
                : 'bg-white/80 border-gray-200 text-gray-400'
          }`}
        >
          {index < currentIndex ? '✓' : kana}
        </div>
      ))}
    </div>
  );
}

export function HiraganaPrimaryButton({ children, onClick, disabled, variant = 'sky' }) {
  const variants = {
    sky: 'bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 hover:from-sky-500 hover:via-blue-600 hover:to-indigo-600 shadow-sky-300/50',
    indigo: 'bg-gradient-to-r from-indigo-400 via-violet-500 to-purple-500 hover:from-indigo-500 hover:via-violet-600 hover:to-purple-600 shadow-violet-300/50',
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full py-3.5 rounded-2xl text-white font-black text-sm sm:text-base shadow-lg border-3 border-white/80 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:shadow-none ${variants[variant]}`}
    >
      {children}
    </button>
  );
}
