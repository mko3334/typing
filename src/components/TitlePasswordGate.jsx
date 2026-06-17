import React, { useState } from 'react';
import { Key } from 'lucide-react';
import { TITLE_ACCESS_PASSWORD } from '../utils/admin';

const STORAGE_KEY = 'kids_typing_title_unlocked';

export function isTitleAccessGranted() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function grantTitleAccess() {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export default function TitlePasswordGate({ onUnlock, playDecideSound }) {
  const [passwordInput, setPasswordInput] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === TITLE_ACCESS_PASSWORD) {
      playDecideSound?.();
      grantTitleAccess();
      setPasswordInput('');
      setError('');
      onUnlock();
      return;
    }
    setError('パスワードがちがうよ！');
    setPasswordInput('');
  };

  return (
    <div className="relative w-full h-[100dvh] min-h-0 flex flex-col items-center justify-center px-4 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/title_bg.png)' }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-sky-100/40 via-white/20 to-indigo-100/50 pointer-events-none"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-sm bg-white/90 backdrop-blur-md rounded-3xl border-4 border-sky-300 shadow-2xl p-6 sm:p-8 text-center animate-pop-out">
        <div className="w-14 h-14 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-sky-200">
          <Key className="w-7 h-7 text-sky-600" />
        </div>
        <h1 className="text-lg sm:text-xl font-black text-sky-700 mb-1">あいことばを入力</h1>
        <p className="text-xs font-bold text-gray-500 mb-5 leading-relaxed">
          このゲームは リンクを知っている人だけ
          <br />
          あそべます
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="○○○○"
            maxLength={4}
            value={passwordInput}
            onChange={(e) => {
              setPasswordInput(e.target.value.replace(/\D/g, '').slice(0, 4));
              setError('');
            }}
            className="w-full text-center text-2xl tracking-[0.5em] font-black p-3 rounded-xl border-4 border-sky-200 focus:border-sky-500 focus:outline-none bg-white text-gray-700"
            autoFocus
          />
          {error && <p className="text-xs font-black text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={passwordInput.length < 4}
            className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 text-white font-black text-base py-3 rounded-xl shadow-md active:scale-95 transition-all"
          >
            すすむ
          </button>
        </form>
      </div>
    </div>
  );
}
