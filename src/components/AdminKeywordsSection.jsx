import React, { useState, useEffect, useMemo } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { WORDS } from '../constants';
import { getAdoptedWords, saveWordCorrection } from '../firebase';
import { refreshWordCorrections, buildMainWordKey } from '../utils/wordCorrections';

const DIFFICULTIES = ['easy', 'normal', 'hard', 'very_hard', 'insane', 'alphabet_quiz'];

function AdminKeywordEditModal({ word, onClose, onSave }) {
  const [kana, setKana] = useState(word.kana || '');
  const [romajiStr, setRomajiStr] = useState(Array.isArray(word.romaji) ? word.romaji.join(', ') : (word.romaji || ''));
  const [emoji, setEmoji] = useState(word.emoji || '');
  const [reading, setReading] = useState(word.reading || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const romajiArray = romajiStr.split(',').map(s => s.trim()).filter(Boolean);
      const correctionData = {
        sourceKey: buildMainWordKey(word.originalKana || word.kana),
        kana: kana.trim(),
        romaji: romajiArray,
        emoji: emoji.trim(),
        ...(reading.trim() ? { reading: reading.trim() } : {})
      };
      await saveWordCorrection(correctionData);
      onSave();
      onClose();
    } catch (err) {
      console.error(err);
      alert('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-black text-gray-800">キーワードの修正</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">表示テキスト (かな/漢字等)</label>
            <input
              type="text"
              value={kana}
              onChange={e => setKana(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl p-2 font-bold"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">ローマ字 (カンマ区切りで複数可)</label>
            <input
              type="text"
              value={romajiStr}
              onChange={e => setRomajiStr(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl p-2 font-mono text-sm"
              placeholder="例: taiping, typing"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">絵文字 (1〜2文字推奨)</label>
            <input
              type="text"
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl p-2 text-2xl"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">読み仮名 (ルビが必要な場合)</label>
            <input
              type="text"
              value={reading}
              onChange={e => setReading(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl p-2 font-bold text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200">
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !kana.trim() || !romajiStr.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50"
          >
            {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminKeywordsSection() {
  const [loading, setLoading] = useState(true);
  const [adoptedWords, setAdoptedWords] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState('normal');
  const [editingWord, setEditingWord] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [aw, corr] = await Promise.all([
        getAdoptedWords(),
        refreshWordCorrections()
      ]);
      setAdoptedWords(aw);
      setCorrections(corr);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const displayWords = useMemo(() => {
    const baseWords = WORDS[selectedDifficulty] || [];
    const extraWords = adoptedWords.filter(w => w.difficulty === selectedDifficulty);
    
    // Combine and apply corrections
    const all = [...baseWords.map(w => ({ ...w, isAdopted: false, originalKana: w.kana })), 
                 ...extraWords.map(w => ({ ...w, isAdopted: true, originalKana: w.kana }))];
                 
    return all.map(word => {
      const correction = corrections.find(c => c.sourceKey === buildMainWordKey(word.originalKana));
      if (correction) {
        return {
          ...word,
          kana: correction.kana || word.kana,
          romaji: Array.isArray(correction.romaji) ? correction.romaji : word.romaji,
          emoji: correction.emoji ?? word.emoji,
          reading: correction.reading || word.reading,
          isCorrected: true
        };
      }
      return word;
    });
  }, [selectedDifficulty, adoptedWords, corrections]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-gray-500">キーワードを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <div className="flex overflow-x-auto gap-2 pb-2 mb-4 shrink-0 px-2">
        {DIFFICULTIES.map(diff => (
          <button
            key={diff}
            onClick={() => setSelectedDifficulty(diff)}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-colors ${selectedDifficulty === diff ? 'bg-sky-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
          >
            {diff}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-200 shadow-inner p-4 space-y-2">
        {displayWords.length === 0 ? (
          <p className="text-center text-gray-500 py-10 font-bold">この難易度にはキーワードがありません。</p>
        ) : (
          displayWords.map((word, i) => (
            <div key={`${word.originalKana}-${i}`} className={`flex items-center justify-between p-3 rounded-xl border ${word.isCorrected ? 'border-amber-300 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}>
              <div className="flex items-center gap-4">
                <div className="text-3xl w-10 text-center">{word.emoji || '✨'}</div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg text-gray-800">{word.kana}</span>
                    {word.reading && <span className="text-xs text-gray-500 font-bold">({word.reading})</span>}
                    {word.isAdopted && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-black border border-green-200">リクエスト</span>}
                    {word.isCorrected && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black border border-amber-200">修正済み</span>}
                  </div>
                  <span className="font-mono text-xs text-sky-600 font-bold break-all max-w-[200px] sm:max-w-xs">
                    {Array.isArray(word.romaji) ? word.romaji.join(', ') : word.romaji}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingWord(word)}
                className="p-2 text-sky-500 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1 font-bold text-sm shrink-0 ml-2"
              >
                <Edit2 className="w-4 h-4" /> 修正
              </button>
            </div>
          ))
        )}
      </div>

      {editingWord && (
        <AdminKeywordEditModal 
          word={editingWord} 
          onClose={() => setEditingWord(null)} 
          onSave={loadData} 
        />
      )}
    </div>
  );
}
