import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ArrowUpCircle, CheckCircle2 } from 'lucide-react';
import { GACHA_ITEMS } from '../constants';
import { getPowerType, GEAR_POWER_LABELS, getItemPowerPoints, formatPowerPoint, ITEM_READINGS } from '../utils/gearPower';
import { generateAllRomaji } from '../constants';
import { playSE } from '../audio';

// タイピングミニゲームコンポーネント
const SynthesisTypingGame = ({ item, count, onComplete, onCancel }) => {
  const [wordCount, setWordCount] = useState(0);
  const [typedChars, setTypedChars] = useState('');
  
  const targetCount = Math.min(count, 10);
  
  const targetKana = ITEM_READINGS[item?.name] || 'えらー';
  const validRomajiList = useMemo(() => {
    try {
      return generateAllRomaji(targetKana);
    } catch (err) {
      console.error("Failed to generate romaji for:", targetKana, err);
      return ['era-'];
    }
  }, [targetKana]);
  
  // 次に打つべき文字のリストを取得する関数
  const getNextValidChars = (typed) => {
    const nextChars = new Set();
    for (const romaji of validRomajiList) {
      if (romaji.startsWith(typed)) {
        nextChars.add(romaji[typed.length]);
      }
    }
    return Array.from(nextChars);
  };
  
  const nextValidChars = useMemo(() => getNextValidChars(typedChars), [typedChars, validRomajiList]);
  
  // 現在の入力で完結しているか（いずれかの正解パターンと完全一致するか）
  const isWordComplete = useMemo(() => validRomajiList.includes(typedChars), [typedChars, validRomajiList]);
  
  // 正解パターンの中で、現在入力中のものと最も近いもの（ヒント表示用）
  const bestMatchRomaji = useMemo(() => {
    const matches = validRomajiList.filter(r => r.startsWith(typedChars));
    return matches.length > 0 ? matches[0] : validRomajiList[0];
  }, [typedChars, validRomajiList]);
  
  const [isShaking, setIsShaking] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  useEffect(() => {
    if (isWordComplete && !isSynthesizing) {
      setIsSynthesizing(true);
      playSE?.('levelUp');
      
      setTimeout(() => {
        setIsSynthesizing(false);
        if (wordCount + 1 >= targetCount) {
          onComplete();
        } else {
          setWordCount(prev => prev + 1);
          setTypedChars('');
        }
      }, 500);
    }
  }, [isWordComplete, isSynthesizing, wordCount, targetCount, onComplete]);

  const handleKeyDown = useCallback((e) => {
    if (isSynthesizing) return;
    if (e.ctrlKey || e.altKey || e.metaKey || e.key.length !== 1) return;
    
    const key = e.key.toLowerCase();
    
    if (nextValidChars.includes(key)) {
      setTypedChars(prev => prev + key);
      playSE?.('type');
    } else {
      setIsShaking(true);
      playSE?.('error');
      setTimeout(() => setIsShaking(false), 300);
    }
  }, [nextValidChars, isSynthesizing]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col items-center justify-center py-6 w-full relative">
      <div className="text-xl font-bold text-gray-500 mb-2">
        {targetCount}回 タイピングして合成しよう！ ({wordCount + 1} / {targetCount})
      </div>
      
      <div className="flex items-center gap-4 mb-8">
        <div className={`text-6xl transition-all duration-300 ${isSynthesizing ? 'scale-[2.5] rotate-12 brightness-150 drop-shadow-[0_0_40px_rgba(250,204,21,1)] z-10' : 'scale-100'}`}>
          {item.emoji}
        </div>
      </div>
      
      <div className={`text-4xl font-black mb-4 tracking-widest text-indigo-900 ${isShaking ? 'animate-shake text-red-500' : ''}`}>
        {targetKana}
      </div>
      
      <div className="text-3xl font-bold tracking-[0.2em] relative mb-8 flex">
        <span className="text-indigo-500">{typedChars}</span>
        <span className="text-gray-300">{bestMatchRomaji.slice(typedChars.length)}</span>
      </div>
      
      <button 
        onClick={onCancel}
        className="text-gray-500 underline font-bold mt-4"
      >
        やめる
      </button>
    </div>
  );
};


export default function ItemSynthesisModal({ isOpen, item, player, onClose, onPlayerUpdate }) {
  if (!isOpen || !item || !player) return null;

  const currentLevel = player.itemLevels?.[item.name] || 0;
  const maxUpgradable = Math.max(0, (player.collection?.[item.name] || 0) - 1);
  
  const [upgradeAmount, setUpgradeAmount] = useState(1);
  const [phase, setPhase] = useState('select'); // select, typing, success
  
  // もし強化できない状態なら閉じる
  useEffect(() => {
    if (maxUpgradable <= 0 && phase === 'select') {
      onClose();
    }
  }, [maxUpgradable, phase, onClose]);

  // モーダルリセット
  useEffect(() => {
    if (isOpen) {
      setPhase('select');
      setUpgradeAmount(1);
    }
  }, [isOpen, item]);

  if (maxUpgradable <= 0) return null;

  const powerKey = getPowerType(item.name);
  const powerInfo = GEAR_POWER_LABELS[powerKey];
  
  const currentMainPower = getItemPowerPoints(item.name, true, currentLevel);
  const nextMainPower = getItemPowerPoints(item.name, true, currentLevel + upgradeAmount);
  
  const handleComplete = () => {
    // 成功処理
    const newPlayer = { ...player };
    if (!newPlayer.itemLevels) newPlayer.itemLevels = {};
    
    newPlayer.itemLevels[item.name] = (newPlayer.itemLevels[item.name] || 0) + upgradeAmount;
    newPlayer.collection[item.name] = (newPlayer.collection[item.name] || 0) - upgradeAmount;
    
    onPlayerUpdate(newPlayer);
    setPhase('success');
    playSE?.('legend');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col relative overflow-hidden border-4 border-indigo-200">
        
        {phase === 'select' && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className="p-6">
          {phase === 'select' && (
            <>
              <h2 className="text-2xl font-black text-indigo-900 mb-6 text-center flex items-center justify-center gap-2">
                <ArrowUpCircle className="w-8 h-8 text-indigo-500" />
                アイテム合成・強化
              </h2>
              
              <div className="bg-indigo-50 rounded-2xl p-6 flex flex-col items-center mb-6">
                <div className="text-6xl mb-2">{item.emoji}</div>
                <div className="text-xl font-black text-indigo-900 mb-4">{item.name}</div>
                
                <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-xl shadow-sm border-2 border-indigo-100 w-full justify-center">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 font-bold mb-1">現在のレベル</div>
                    <div className="text-2xl font-black text-gray-700">Lv.{currentLevel}</div>
                    <div className="text-sm font-bold text-amber-600">{formatPowerPoint(powerKey, currentMainPower)}</div>
                  </div>
                  <div className="text-indigo-300 font-black text-2xl">➔</div>
                  <div className="text-center">
                    <div className="text-xs text-indigo-500 font-bold mb-1">強化後</div>
                    <div className="text-2xl font-black text-indigo-600">Lv.{currentLevel + upgradeAmount}</div>
                    <div className="text-sm font-bold text-amber-600">{formatPowerPoint(powerKey, nextMainPower)}</div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-600 mb-2 text-center">
                  合成に使う数を選んでください (所持数: {player.collection[item.name]})<br/>
                  <span className="text-xs text-gray-400">※1つは手元に残ります</span>
                </label>
                <div className="flex items-center justify-center gap-4">
                  <input 
                    type="range" 
                    min="1" 
                    max={maxUpgradable} 
                    value={upgradeAmount}
                    onChange={(e) => setUpgradeAmount(parseInt(e.target.value, 10))}
                    className="w-48 accent-indigo-500 cursor-pointer"
                  />
                  <span className="text-xl font-black text-indigo-600 w-12">{upgradeAmount}個</span>
                </div>
              </div>
              
              <button
                onClick={() => setPhase('typing')}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black text-xl py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
              >
                <ArrowUpCircle className="w-6 h-6" />
                タイピングで合成開始！
              </button>
            </>
          )}

          {phase === 'typing' && (
            <SynthesisTypingGame 
              item={item} 
              count={upgradeAmount} 
              onComplete={handleComplete} 
              onCancel={() => setPhase('select')} 
            />
          )}

          {phase === 'success' && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="w-24 h-24 text-green-500 mb-4 animate-bounce" />
              <h2 className="text-3xl font-black text-indigo-900 mb-2">合成成功！</h2>
              <p className="text-gray-600 font-bold mb-8 text-center">
                {item.name} が Lv.{currentLevel + upgradeAmount} になりました！<br/>
                効果がさらにアップしました。
              </p>
              <button
                onClick={onClose}
                className="w-full bg-indigo-500 text-white font-black text-xl py-4 rounded-2xl shadow-md hover:bg-indigo-600 transition-colors"
              >
                装備画面にもどる
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
