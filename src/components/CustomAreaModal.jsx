import React, { useState, useEffect } from 'react';
import { X, Plus, Play, Search, Save, Trash2, Edit2 } from 'lucide-react';
import { getFirestore, collection, doc, setDoc, getDoc, serverTimestamp, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { GACHA_ITEMS, generateAllRomaji } from '../constants';

const db = getFirestore();

export default function CustomAreaModal({ isOpen, onClose, player, playDecideSound, playCancelSound, onPlayCustomStage, onPlayerUpdate }) {
  const [tab, setTab] = useState('menu'); // menu, create, list, input_code
  const [stageName, setStageName] = useState('');
  const [words, setWords] = useState([{ kana: '', text: '' }]);
  const [decorations, setDecorations] = useState([]);
  const [myStages, setMyStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shareCodeInput, setShareCodeInput] = useState('');
  
  // ダブりアイテムの計算
  const duplicateItems = React.useMemo(() => {
    if (!player?.items) return [];
    const counts = {};
    player.items.forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
    });
    // 2個以上持っているアイテム（1つは保存用、残りが装飾用）
    const dups = [];
    Object.keys(counts).forEach(id => {
      if (counts[id] > 1) {
        const itemDef = GACHA_ITEMS.find(g => g.name === id);
        if (itemDef) {
          dups.push({ ...itemDef, availableCount: counts[id] - 1 });
        }
      }
    });
    return dups;
  }, [player?.items]);

  useEffect(() => {
    if (isOpen && tab === 'list') {
      loadMyStages();
    }
  }, [isOpen, tab]);

  const loadMyStages = async () => {
    if (!player?.id) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'custom_stages'), where('creatorId', '==', player.id), orderBy('createdAt', 'desc'), limit(20));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setMyStages(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleClose = () => {
    playCancelSound?.();
    setTab('menu');
    onClose();
  };

  const handleAddWord = () => {
    setWords([...words, { kana: '', text: '' }]);
  };

  const handleWordChange = (index, field, value) => {
    const newWords = [...words];
    newWords[index][field] = value;
    setWords(newWords);
  };

  const handleRemoveWord = (index) => {
    const newWords = [...words];
    newWords.splice(index, 1);
    setWords(newWords);
  };

  const handleAddDecoration = (item) => {
    playDecideSound?.();
    // すでに同じデコレーションがあるか
    const existingIndex = decorations.findIndex(d => d.name === item.name);
    if (existingIndex >= 0) {
      const newDeco = [...decorations];
      if (newDeco[existingIndex].count < item.availableCount) {
        newDeco[existingIndex].count += 1;
        setDecorations(newDeco);
      }
    } else {
      setDecorations([...decorations, { name: item.name, emoji: item.emoji, count: 1 }]);
    }
  };

  const handleRemoveDecoration = (index) => {
    playCancelSound?.();
    const newDeco = [...decorations];
    newDeco[index].count -= 1;
    if (newDeco[index].count <= 0) {
      newDeco.splice(index, 1);
    }
    setDecorations(newDeco);
  };

  const generateShareCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSaveStage = async () => {
    if (!stageName.trim()) return alert('ステージ名を入力してください。');
    const validWords = words.filter(w => w.kana.trim() && w.text.trim());
    if (validWords.length === 0) return alert('キーワードを1つ以上入力してください。');

    if (!confirm('このステージを保存しますか？（装飾に使ったダブりアイテムは消費されます）')) return;

    setLoading(true);
    try {
      const shareCode = generateShareCode();
      const stageData = {
        creatorId: player.id,
        creatorName: player.name,
        title: stageName,
        words: validWords,
        decorations: decorations,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'custom_stages', shareCode), stageData);
      
      // プレイヤーのアイテムを消費
      if (decorations.length > 0) {
        const newItems = [...player.items];
        decorations.forEach(deco => {
          for (let i = 0; i < deco.count; i++) {
            const idx = newItems.findIndex(id => id === deco.name);
            if (idx >= 0) {
              newItems.splice(idx, 1);
            }
          }
        });
        if (onPlayerUpdate) {
          onPlayerUpdate({ items: newItems });
        }
      }

      alert(`ステージを作成しました！\nシェアコード: ${shareCode}\n友達に教えて遊んでもらおう！`);
      setTab('menu');
      setStageName('');
      setWords([{ kana: '', text: '' }]);
      setDecorations([]);
    } catch (e) {
      console.error(e);
      alert('保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayByCode = async () => {
    if (!shareCodeInput.trim()) return;
    setLoading(true);
    try {
      const code = shareCodeInput.trim().toUpperCase();
      const docRef = doc(db, 'custom_stages', code);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const stage = { id: docSnap.id, ...docSnap.data() };
        onPlayCustomStage(stage);
      } else {
        alert('ステージが見つかりませんでした。コードを確認してください。');
      }
    } catch (e) {
      console.error(e);
      alert('エラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white/95 backdrop-blur-md w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col border-4 border-sky-300 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-400 to-indigo-500 p-4 shrink-0 flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            🏬 マイステージ（新エリア）
          </h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-sky-50/50">
          {tab === 'menu' && (
            <div className="flex flex-col gap-4 max-w-md mx-auto mt-8">
              <button
                onClick={() => { playDecideSound?.(); setTab('input_code'); }}
                className="p-6 bg-gradient-to-r from-orange-400 to-rose-400 rounded-2xl text-white font-black text-xl sm:text-2xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Play fill="currentColor" size={32} />
                合言葉で あそぶ
              </button>
              
              <button
                onClick={() => { playDecideSound?.(); setTab('create'); }}
                className="p-6 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl text-white font-black text-xl sm:text-2xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Plus size={32} strokeWidth={3} />
                ステージを つくる
              </button>
              
              <button
                onClick={() => { playDecideSound?.(); setTab('list'); }}
                className="p-4 bg-white border-2 border-sky-200 text-sky-600 rounded-2xl font-black text-lg shadow hover:bg-sky-50 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Save size={24} />
                つくったステージ一覧
              </button>
            </div>
          )}

          {tab === 'input_code' && (
            <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto gap-6">
              <div className="text-center">
                <h3 className="text-2xl font-black text-gray-800 mb-2">合言葉を入力</h3>
                <p className="text-gray-500 font-bold text-sm">友達から教えてもらったコードを入力してね！</p>
              </div>
              <input
                type="text"
                value={shareCodeInput}
                onChange={(e) => setShareCodeInput(e.target.value)}
                placeholder="例: A3K9X"
                className="w-full text-center text-4xl font-black p-4 rounded-2xl border-4 border-sky-200 focus:border-sky-400 focus:ring-0 outline-none uppercase tracking-widest"
                maxLength={6}
              />
              <button
                onClick={handlePlayByCode}
                disabled={loading || !shareCodeInput.trim()}
                className="w-full py-4 bg-sky-500 text-white font-black text-xl rounded-2xl shadow-lg disabled:opacity-50 hover:bg-sky-400 active:scale-95 transition-all"
              >
                {loading ? 'さがしています...' : 'このステージであそぶ！'}
              </button>
              <button onClick={() => setTab('menu')} className="text-gray-400 font-bold hover:text-gray-600 mt-4">
                もどる
              </button>
            </div>
          )}

          {tab === 'list' && (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-gray-800">つくったステージ一覧</h3>
                <button onClick={() => setTab('menu')} className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-600">
                  もどる
                </button>
              </div>
              {loading ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 font-bold">よみこみ中...</div>
              ) : myStages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 font-bold">まだステージを作っていません</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myStages.map(stage => (
                    <div key={stage.id} className="bg-white p-4 rounded-2xl shadow-sm border-2 border-sky-100 flex flex-col gap-2">
                      <div className="font-black text-lg text-gray-800">{stage.title}</div>
                      <div className="text-sm font-bold text-gray-500">コード: <span className="bg-gray-100 px-2 py-1 rounded text-sky-600 tracking-wider select-all">{stage.id}</span></div>
                      <div className="text-xs text-gray-400">単語数: {stage.words?.length || 0}</div>
                      <button
                        onClick={() => onPlayCustomStage(stage)}
                        className="mt-2 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-400 active:scale-95 transition-all"
                      >
                        あそぶ
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'create' && (
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              {/* Left: Input form */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-gray-800">ステージを つくる</h3>
                  <button onClick={() => setTab('menu')} className="px-3 py-1.5 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-600">もどる</button>
                </div>
                <div>
                  <label className="block text-sm font-black text-sky-600 mb-1">ステージ名</label>
                  <input
                    type="text"
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    className="w-full p-3 rounded-xl border-2 border-sky-200 focus:border-sky-400 outline-none font-bold text-gray-800"
                    placeholder="例: かっこいい くるま"
                    maxLength={20}
                  />
                </div>
                
                <div className="flex-1 min-h-0 flex flex-col border-2 border-sky-100 rounded-2xl bg-white p-3 shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-black text-sky-600">お題（キーワード）</label>
                    <span className="text-xs font-bold text-gray-400">{words.length} / 20</span>
                  </div>
                  <div className="flex-1 overflow-auto pr-2 space-y-2">
                    {words.map((word, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                        <span className="font-black text-gray-300 w-6 text-center">{idx + 1}</span>
                        <div className="flex-1 flex flex-col gap-1">
                          <input
                            type="text"
                            value={word.kana}
                            onChange={(e) => handleWordChange(idx, 'kana', e.target.value)}
                            className="w-full p-1.5 text-sm rounded border border-gray-200 font-bold focus:border-sky-400 outline-none"
                            placeholder="よみ（ひらがな）"
                          />
                          <input
                            type="text"
                            value={word.text}
                            onChange={(e) => handleWordChange(idx, 'text', e.target.value)}
                            className="w-full p-1.5 text-sm rounded border border-gray-200 font-bold focus:border-sky-400 outline-none"
                            placeholder="ひょうじ（漢字など）"
                          />
                          {word.kana && (
                            <div className="text-[10px] text-gray-400 font-mono tracking-widest pl-1 mt-0.5 truncate max-w-[150px] sm:max-w-[200px]" title="タイピングで使うローマ字">
                              {generateAllRomaji(word.kana)[0] || '未対応の文字が含まれています'}
                            </div>
                          )}
                        </div>
                        {words.length > 1 && (
                          <button onClick={() => handleRemoveWord(idx)} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                    {words.length < 20 && (
                      <button
                        onClick={handleAddWord}
                        className="w-full py-3 border-2 border-dashed border-sky-200 text-sky-500 font-black rounded-xl hover:bg-sky-50 active:scale-95 transition-all flex items-center justify-center gap-1"
                      >
                        <Plus size={20} />
                        キーワードをついか
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Decoration */}
              <div className="w-full lg:w-80 flex flex-col gap-4">
                <div className="flex flex-col border-2 border-amber-200 bg-amber-50 rounded-2xl p-4 shadow-sm h-full">
                  <h4 className="font-black text-amber-700 mb-2 flex items-center gap-1">
                    <span>✨</span> デコレーション
                  </h4>
                  <p className="text-xs font-bold text-amber-600/80 mb-3 leading-relaxed">
                    ダブったガチャアイテムを消費して、ステージをステッカーで飾ろう！
                  </p>
                  
                  {/* 使用中のデコレーション */}
                  <div className="bg-white rounded-xl border border-amber-200 p-2 min-h-[80px] mb-4 flex flex-wrap gap-2 content-start">
                    {decorations.length === 0 ? (
                      <div className="text-xs font-bold text-gray-300 w-full text-center py-4">飾りがありません</div>
                    ) : (
                      decorations.map((deco, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleRemoveDecoration(idx)}
                          className="relative flex items-center justify-center w-10 h-10 bg-amber-50 border border-amber-300 rounded-lg text-2xl hover:bg-red-50 hover:border-red-300 transition-colors group"
                          title="クリックではずす"
                        >
                          {deco.emoji}
                          <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                            {deco.count}
                          </span>
                          <div className="absolute inset-0 bg-red-500/20 rounded-lg hidden group-hover:block" />
                        </button>
                      ))
                    )}
                  </div>

                  {/* ダブりアイテム一覧 */}
                  <div className="flex-1 min-h-0 flex flex-col">
                    <h5 className="text-xs font-black text-amber-700 mb-2">使えるダブりアイテム</h5>
                    <div className="flex-1 overflow-auto bg-white rounded-xl border border-amber-200 p-2">
                      {duplicateItems.length === 0 ? (
                        <div className="text-xs font-bold text-gray-400 w-full text-center py-4">ダブりアイテムがありません</div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {duplicateItems.map((item, idx) => {
                            const usedCount = decorations.find(d => d.name === item.name)?.count || 0;
                            const remainCount = item.availableCount - usedCount;
                            
                            return (
                              <button
                                key={idx}
                                onClick={() => handleAddDecoration(item)}
                                disabled={remainCount <= 0}
                                className="relative flex flex-col items-center justify-center p-1 border-2 border-gray-100 rounded-lg hover:border-amber-300 hover:bg-amber-50 disabled:opacity-30 transition-colors"
                              >
                                <span className="text-2xl">{item.emoji}</span>
                                <span className="text-[10px] font-black text-gray-500 mt-1">余: {remainCount}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveStage}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-black text-xl rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? 'ほぞん中...' : 'かんせい！'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
