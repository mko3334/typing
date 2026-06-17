import React, { useState } from 'react';
import { generateAllRomaji } from '../constants';
import { addWordRequest } from '../firebase';

export default function WordRequestModal({ isOpen, player, onClose, playDecideSound }) {
  const [kana, setKana] = useState('');
  const [romaji, setRomaji] = useState('');
  const [emoji, setEmoji] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleKanaChange = (value) => {
    setKana(value);
    if (value.trim()) {
      setRomaji(generateAllRomaji(value.trim()).join(' / '));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!kana.trim() || !romaji.trim()) {
      alert('「かな」と「ローマ字」は必ずいれてね！');
      return;
    }
    setSending(true);
    const success = await addWordRequest({
      kana: kana.trim(),
      romaji: romaji.split('/').map((r) => r.trim()).filter(Boolean),
      emoji: emoji.trim(),
      playerName: player?.name || 'ゲスト',
      playerId: player?.id || null,
    });
    setSending(false);
    if (success) {
      playDecideSound?.();
      alert('リクエストをおくったよ！ありがとう！');
      setKana('');
      setRomaji('');
      setEmoji('');
      onClose();
    } else {
      alert('おくれませんでした。インターネットの接続を確認してね。');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-pop-out">
        <h2 className="text-xl sm:text-2xl font-black text-center text-orange-600">📮 キーワードリクエスト</h2>
        <p className="text-gray-600 text-center text-xs sm:text-sm font-bold">
          ゲームに ほしい ことばを おくってね！
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1">
              追加したい言葉 (かな) <span className="text-red-500">*必須</span>
            </label>
            <input
              type="text"
              value={kana}
              onChange={(e) => handleKanaChange(e.target.value)}
              placeholder="例: どうぶつえん"
              className="w-full p-3 rounded-xl border-2 border-orange-100 focus:border-orange-400 focus:outline-none bg-gray-50 text-sm font-bold"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1">
              ローマ字 <span className="text-red-500">*必須</span>
            </label>
            <input
              type="text"
              value={romaji}
              onChange={(e) => setRomaji(e.target.value)}
              placeholder="例: dobutsuen / dobutu / en"
              className="w-full p-3 rounded-xl border-2 border-orange-100 focus:border-orange-400 focus:outline-none bg-gray-50 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1">絵文字（任意）</label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="例: 🦁"
              maxLength={4}
              className="w-full p-3 rounded-xl border-2 border-orange-100 focus:border-orange-400 focus:outline-none bg-gray-50 text-2xl text-center"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-black text-sm transition-colors"
            >
              やめる
            </button>
            <button
              type="submit"
              disabled={sending || !kana.trim() || !romaji.trim()}
              className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-xl font-black text-sm shadow-lg transition-all"
            >
              {sending ? 'おくってる...' : '📮 おくる！'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
