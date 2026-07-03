import React, { useState, useEffect } from 'react';
import { X, Plus, Play, Search, Save, Trash2, Edit2 } from 'lucide-react';
import { getFirestore, collection, doc, setDoc, getDoc, serverTimestamp, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { GACHA_ITEMS, generateAllRomaji } from '../constants';

const db = getFirestore();

export default function CustomAreaModal({ isOpen, onClose, player, playDecideSound, playCancelSound, onPlayCustomStage, onPlayerUpdate }) {
  const [tab, setTab] = useState('public_list'); // public_list, create, list
  const [stageName, setStageName] = useState('');
  const [words, setWords] = useState([{ kana: '', text: '' }]);
  const [canvasElements, setCanvasElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [dragInfo, setDragInfo] = useState(null);
  const [myStages, setMyStages] = useState([]);
  const [publicStages, setPublicStages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // ダブりアイテムの計算
  const duplicateItems = React.useMemo(() => {
    if (!player?.collection) return [];
    
    // 2個以上持っているアイテム（1つは保存用、残りが装飾用）
    const dups = [];
    Object.keys(player.collection).forEach(id => {
      if (player.collection[id] > 1) {
        const itemDef = GACHA_ITEMS.find(g => g.name === id);
        if (itemDef) {
          dups.push({ ...itemDef, availableCount: player.collection[id] - 1 });
        }
      }
    });
    return dups;
  }, [player?.collection]);

  const loadPublicStages = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'custom_stages'), orderBy('createdAt', 'desc'), limit(50));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setPublicStages(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (tab === 'list') loadMyStages();
      if (tab === 'public_list') loadPublicStages();
    }
  }, [isOpen, tab]);

  if (!isOpen) return null;

  const handleClose = () => {
    playCancelSound?.();
    setTab('public_list');
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
    const usedCount = canvasElements.filter(el => el.name === item.name).length;
    if (usedCount >= item.availableCount) {
      alert('これ以上このアイテムは使えません！');
      return;
    }
    const newElement = {
      id: Date.now().toString(),
      type: 'sticker',
      name: item.name,
      emoji: item.emoji,
      x: 50,
      y: 50,
      scale: 1,
      rotation: 0
    };
    setCanvasElements([...canvasElements, newElement]);
    setSelectedElementId(newElement.id);
  };

  const handleAddText = () => {
    playDecideSound?.();
    const newElement = {
      id: Date.now().toString(),
      type: 'text',
      text: 'あたらしいテキスト',
      color: '#ffffff',
      x: 50,
      y: 20,
      scale: 1,
      rotation: 0
    };
    setCanvasElements([...canvasElements, newElement]);
    setSelectedElementId(newElement.id);
  };

  const handlePointerDown = (e, id) => {
    setSelectedElementId(id);
    const canvasRect = e.currentTarget.parentElement.getBoundingClientRect();
    setDragInfo({
      id,
      startX: e.clientX,
      startY: e.clientY,
      canvasW: canvasRect.width,
      canvasH: canvasRect.height
    });
  };

  const handlePointerMove = (e) => {
    if (!dragInfo) return;
    const dx = e.clientX - dragInfo.startX;
    const dy = e.clientY - dragInfo.startY;
    
    const xPct = (dx / dragInfo.canvasW) * 100;
    const yPct = (dy / dragInfo.canvasH) * 100;
    
    setCanvasElements(canvasElements.map(el => 
      el.id === dragInfo.id ? { ...el, x: el.x + xPct, y: el.y + yPct } : el
    ));
    
    setDragInfo({
      ...dragInfo,
      startX: e.clientX,
      startY: e.clientY
    });
  };

  const handlePointerUp = () => {
    setDragInfo(null);
  };

  const updateCanvasElement = (id, changes) => {
    setCanvasElements(canvasElements.map(el => el.id === id ? { ...el, ...changes } : el));
  };

  const handleRemoveElement = (id) => {
    playCancelSound?.();
    setCanvasElements(canvasElements.filter(el => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleSaveStage = async () => {
    if (!stageName.trim()) return alert('ステージ名を入力してください。');
    const validWords = words.filter(w => w.kana.trim() && w.text.trim());
    if (validWords.length === 0) return alert('キーワードを1つ以上入力してください。');

    if (!confirm('このステージを保存しますか？（装飾に使ったダブりアイテムは消費されます）')) return;

    setLoading(true);
    try {
      // 合言葉なし。IDはランダムな20文字程度（Firestore自動採番でも良いがURL共有を考慮し短い英数字）
      const stageId = Math.random().toString(36).substring(2, 10).toUpperCase();
      const stageData = {
        creatorId: player.id,
        creatorName: player.name,
        title: stageName,
        words: validWords,
        decorations: canvasElements, // 保存
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'custom_stages', stageId), stageData);
      
      // プレイヤーのアイテムを消費
      const stickersUsed = canvasElements.filter(el => el.type === 'sticker');
      if (stickersUsed.length > 0) {
        const newCollection = { ...player.collection };
        stickersUsed.forEach(sticker => {
          if (newCollection[sticker.name]) {
            newCollection[sticker.name] -= 1;
          }
        });
        if (onPlayerUpdate) {
          onPlayerUpdate({ collection: newCollection });
        }
      }

      alert(`ステージを作成しました！\nみんなのステージに公開されました！`);
      setTab('public_list');
      setStageName('');
      setWords([{ kana: '', text: '' }]);
      setCanvasElements([]);
      setSelectedElementId(null);
    } catch (e) {
      console.error(e);
      alert('保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[url('/show_bg.png')] bg-cover bg-center animate-fade-in">
      {/* Header */}
      <div className="bg-amber-800/90 backdrop-blur shadow-xl p-4 shrink-0 flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black text-amber-50 flex items-center gap-2">
          🎭 タイピングショー（みんなのステージ）
        </h2>
        <button
          onClick={handleClose}
          className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 w-full max-w-6xl mx-auto">
          {(tab === 'list' || tab === 'public_list') && (
            <div className="flex flex-col h-full relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-black text-gray-800 bg-white/80 px-4 py-2 rounded-xl">
                  {tab === 'list' ? 'つくったステージ一覧' : 'みんなのステージ'}
                </h3>
                {tab === 'list' && (
                  <button onClick={() => setTab('public_list')} className="px-4 py-2 bg-white/80 border-2 border-amber-200 rounded-xl font-bold text-amber-700 hover:bg-white">
                    もどる
                  </button>
                )}
              </div>
              {loading ? (
                <div className="flex-1 flex items-center justify-center text-gray-600 font-bold">よみこみ中...</div>
              ) : (tab === 'list' ? myStages : publicStages).length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-600 font-bold">まだステージがありません</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(tab === 'list' ? myStages : publicStages).map(stage => {
                    const isNewFormat = stage.decorations && stage.decorations.length > 0 && stage.decorations[0].type;
                    return (
                      <div key={stage.id} className="relative bg-white/90 p-4 rounded-2xl shadow-sm border-2 border-amber-100 flex flex-col gap-2 overflow-hidden h-40">
                        {/* 背景にデコレーションを描画 */}
                        {stage.decorations && stage.decorations.length > 0 && (
                          <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {isNewFormat ? (
                              stage.decorations.map((deco, i) => (
                                <div
                                  key={i}
                                  className="absolute origin-center font-black"
                                  style={{
                                    left: `${deco.x}%`,
                                    top: `${deco.y}%`,
                                    transform: `translate(-50%, -50%) scale(${deco.scale}) rotate(${deco.rotation}deg)`,
                                    color: deco.color || 'inherit',
                                    fontSize: deco.type === 'sticker' ? '2rem' : '1.5rem',
                                  }}
                                >
                                  {deco.type === 'sticker' ? deco.emoji : deco.text}
                                </div>
                              ))
                            ) : (
                              <div className="w-full h-full opacity-20 flex flex-wrap gap-2 p-2">
                                {stage.decorations.map((deco, i) => 
                                  Array.from({ length: deco.count }).map((_, j) => (
                                    <span key={`${i}-${j}`} className="text-3xl">{deco.emoji}</span>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="relative z-10 flex-1 flex flex-col items-center justify-center pointer-events-none drop-shadow-md">
                          <div className="font-black text-xl text-gray-800 text-center bg-white/80 px-3 py-1 rounded-full">{stage.title}</div>
                          {tab === 'public_list' && <div className="text-sm font-bold text-gray-500 mt-1">作: {stage.creatorName}</div>}
                          <div className="text-xs text-gray-500 mt-1">単語数: {stage.words?.length || 0}</div>
                        </div>
                        <button
                          onClick={() => onPlayCustomStage(stage)}
                          className="relative z-10 mt-auto py-2 bg-gradient-to-r from-orange-400 to-rose-400 text-white font-black text-lg rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md"
                        >
                          あそぶ
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {tab === 'public_list' && (
                <button
                  onClick={() => { playDecideSound?.(); setTab('create'); }}
                  className="absolute bottom-2 right-2 w-16 h-16 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full shadow-2xl text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                  title="オリジナルのステージを作る"
                >
                  <Plus size={36} strokeWidth={3} />
                </button>
              )}
            </div>
          )}

          {tab === 'create' && (
            <div className="flex flex-col lg:flex-row gap-6 h-full">
              {/* Left: Input form */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black text-gray-800 bg-white/80 px-4 py-2 rounded-xl">ステージを つくる</h3>
                  <button onClick={() => setTab('public_list')} className="px-3 py-1.5 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-600">もどる</button>
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

              {/* Right: Canvas Editor */}
              <div className="w-full lg:w-96 flex flex-col gap-4">
                <div className="flex flex-col border-2 border-amber-200 bg-amber-50 rounded-2xl p-4 shadow-sm h-full flex-1 min-h-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-black text-amber-700 flex items-center gap-1">
                      <span>🖼️</span> サムネイルをつくる
                    </h4>
                    <button onClick={handleAddText} className="px-3 py-1 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-400 active:scale-95 text-xs">
                      + もじを追加
                    </button>
                  </div>
                  
                  {/* キャンバスエリア */}
                  <div 
                    className="relative w-full aspect-video bg-white rounded-xl border-4 border-amber-300 overflow-hidden shadow-inner touch-none"
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    onClick={() => setSelectedElementId(null)}
                  >
                    {canvasElements.map((el) => (
                      <div
                        key={el.id}
                        onPointerDown={(e) => { e.stopPropagation(); handlePointerDown(e, el.id); }}
                        onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); }}
                        className={`absolute origin-center cursor-move select-none ${selectedElementId === el.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                        style={{
                          left: `${el.x}%`,
                          top: `${el.y}%`,
                          transform: `translate(-50%, -50%) scale(${el.scale}) rotate(${el.rotation}deg)`,
                          color: el.color || 'inherit',
                          fontSize: el.type === 'sticker' ? '3rem' : '2rem',
                          fontWeight: '900',
                          textShadow: el.type === 'text' ? '0px 2px 4px rgba(0,0,0,0.3)' : 'none',
                          zIndex: selectedElementId === el.id ? 10 : 1
                        }}
                      >
                        {el.type === 'sticker' ? el.emoji : el.text}
                      </div>
                    ))}
                    {canvasElements.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-amber-200 font-bold pointer-events-none">
                        下からシールをえらんでね！
                      </div>
                    )}
                  </div>

                  {/* 選択中のアイテムのコントロール */}
                  {selectedElementId ? (
                    <div className="mt-3 bg-white p-2 rounded-xl border border-amber-200 shadow-sm">
                      {(() => {
                        const sel = canvasElements.find(e => e.id === selectedElementId);
                        if (!sel) return null;
                        return (
                          <div className="flex flex-col gap-2">
                            {sel.type === 'text' && (
                              <input 
                                type="text"
                                value={sel.text}
                                onChange={(e) => updateCanvasElement(sel.id, { text: e.target.value })}
                                className="w-full p-2 border border-gray-200 rounded font-bold outline-none focus:border-amber-400"
                                placeholder="テキストを入力"
                              />
                            )}
                            <div className="flex items-center gap-2 justify-between">
                              <div className="flex gap-1">
                                <button onClick={() => updateCanvasElement(sel.id, { scale: Math.max(0.3, sel.scale - 0.2) })} className="px-2 py-1 bg-gray-100 rounded text-sm font-bold hover:bg-gray-200">小さく</button>
                                <button onClick={() => updateCanvasElement(sel.id, { scale: Math.min(3.0, sel.scale + 0.2) })} className="px-2 py-1 bg-gray-100 rounded text-sm font-bold hover:bg-gray-200">大きく</button>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => updateCanvasElement(sel.id, { rotation: sel.rotation - 15 })} className="px-2 py-1 bg-gray-100 rounded text-sm font-bold hover:bg-gray-200">左かいてん</button>
                                <button onClick={() => updateCanvasElement(sel.id, { rotation: sel.rotation + 15 })} className="px-2 py-1 bg-gray-100 rounded text-sm font-bold hover:bg-gray-200">右かいてん</button>
                              </div>
                              <button onClick={() => handleRemoveElement(sel.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                                <Trash2 size={16} />
                              </button>
                            </div>
                            {sel.type === 'text' && (
                              <div className="flex gap-1 mt-1">
                                {['#ffffff', '#ff4d4d', '#4dff4d', '#4d4dff', '#ffff4d', '#ff4dff', '#000000'].map(color => (
                                  <button 
                                    key={color} 
                                    onClick={() => updateCanvasElement(sel.id, { color })}
                                    className={`w-6 h-6 rounded-full border-2 ${sel.color === color ? 'border-gray-800' : 'border-gray-200'}`}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="mt-3 text-xs text-amber-500 font-bold text-center">アイテムをさわって動かせるよ！</div>
                  )}

                  {/* ダブりアイテム一覧 */}
                  <div className="flex-1 min-h-0 flex flex-col mt-4">
                    <h5 className="text-xs font-black text-amber-700 mb-2">使えるダブりアイテム（シール）</h5>
                    <div className="flex-1 overflow-auto bg-white rounded-xl border border-amber-200 p-2">
                      {duplicateItems.length === 0 ? (
                        <div className="text-xs font-bold text-gray-400 w-full text-center py-4">ダブりアイテムがありません</div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {duplicateItems.map((item, idx) => {
                            const usedCount = canvasElements.filter(el => el.name === item.name).length;
                            const remainCount = item.availableCount - usedCount;
                            
                            return (
                              <button
                                key={idx}
                                onClick={() => handleAddDecoration(item)}
                                disabled={remainCount <= 0}
                                className="relative flex flex-col items-center justify-center p-2 border-2 border-gray-100 rounded-lg hover:border-amber-300 hover:bg-amber-50 disabled:opacity-30 transition-colors"
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
                  className="w-full py-4 bg-gradient-to-r from-sky-400 to-indigo-500 text-white font-black text-xl rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 shrink-0"
                >
                  {loading ? 'ほぞん中...' : 'かんせい！'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
