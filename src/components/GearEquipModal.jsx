import React, { useState, useMemo } from 'react';
import { X, Settings2, Trash2, Filter, ArrowDownUp, Save, ArrowUpCircle } from 'lucide-react';
import { GACHA_ITEMS, getRarityWeight } from '../constants';
import { getPowerType, GEAR_POWER_LABELS, calculateGearPowers, getItemPowerPoints, formatPowerPoint } from '../utils/gearPower';
import ItemSynthesisModal from './ItemSynthesisModal';

const POWER_DESCRIPTIONS = {
  score: "さいごにもらえる「スコア（得点）」がふえるよ！",
  time: "タイピングショーの「じかん」がながくなるよ！",
  combo: "れんぞくで正解したときにもらえる「コンボ」の点数がふえるよ！",
  guard: "まちがえても、たまに「ミス」にならないで守ってくれるよ！",
  special: "もらえる点数がとても多い「激アツ問題」が出やすくなるよ！",
};

export default function GearEquipModal({ isOpen, player, onClose, onPlayerUpdate, playDecideSound, playCancelSound }) {
  if (!isOpen || !player) return null;

  const initialGears = player.typingShowGears || { main: [null, null, null], sub: [null, null, null, null, null, null, null, null, null] };
  const [gears, setGears] = useState(initialGears);
  
  // 装備の選択用ステータス: { type: 'main' | 'sub', index: number } | null
  // nullの場合は、アイテムをクリックしたときに空いている枠に自動装備されるようにする
  const [selectingSlot, setSelectingSlot] = useState(null);
  
  // フィルター・ソート
  const [filterType, setFilterType] = useState('all'); // all, score, time, combo, guard, special
  const [sortType, setSortType] = useState('rarity'); // rarity, name
  
  // 合成・強化モーダル
  const [synthesisItem, setSynthesisItem] = useState(null);

  const handleClose = () => {
    playCancelSound?.();
    onClose();
  };

  const save = async () => {
    playDecideSound?.();
    await onPlayerUpdate?.({ typingShowGears: gears });
    onClose();
  };

  const handleSlotClick = (type, index) => {
    playDecideSound?.();
    setSelectingSlot({ type, index });
  };

  const handleItemSelect = (itemName) => {
    playDecideSound?.();
    setGears(prev => {
      const newGears = { 
        main: [...prev.main], 
        sub: [...prev.sub] 
      };
      
      if (selectingSlot) {
        if (selectingSlot.type === 'main') {
          newGears.main[selectingSlot.index] = itemName;
        } else {
          newGears.sub[selectingSlot.index] = itemName;
        }
      } else {
        // スロットが選ばれていない場合、空いている枠を探して自動装備
        const emptyMainIdx = newGears.main.findIndex(g => g === null);
        if (emptyMainIdx !== -1) {
          newGears.main[emptyMainIdx] = itemName;
        } else {
          const emptySubIdx = newGears.sub.findIndex(g => g === null);
          if (emptySubIdx !== -1) {
            newGears.sub[emptySubIdx] = itemName;
          } else {
            alert('装備枠がいっぱいです！外したいアイテム枠を選んでからクリックしてね。');
            return prev;
          }
        }
      }
      return newGears;
    });
    setSelectingSlot(null);
  };

  const handleRemove = (type, index, e) => {
    e.stopPropagation();
    playCancelSound?.();
    setGears(prev => {
      const newGears = { 
        main: [...prev.main], 
        sub: [...prev.sub] 
      };
      if (type === 'main') newGears.main[index] = null;
      else newGears.sub[index] = null;
      return newGears;
    });
  };

  // 持っているガチャアイテムをフィルタ＆ソート
  const displayItems = useMemo(() => {
    let items = GACHA_ITEMS.filter(item => player.collection && player.collection[item.name] > 0);
    
    if (filterType !== 'all') {
      items = items.filter(item => getPowerType(item.name) === filterType);
    }
    
    items.sort((a, b) => {
      if (sortType === 'rarity') {
        return getRarityWeight(b.rarity) - getRarityWeight(a.rarity) || a.name.localeCompare(b.name, 'ja');
      } else {
        return a.name.localeCompare(b.name, 'ja');
      }
    });
    return items;
  }, [player.collection, filterType, sortType]);

  const powers = calculateGearPowers(gears, player.itemLevels);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-white/95 w-full max-w-6xl rounded-3xl border-4 border-indigo-300 shadow-2xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-indigo-100 flex justify-between items-start gap-3 shrink-0 bg-indigo-50/50">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-indigo-900 flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-indigo-500 shrink-0" />
              アイテムスキル装備 (タイピングショー専用)
            </h2>
            <p className="text-sm font-bold text-indigo-600 mt-1">ガチャアイテムを装備して、スコアアップやタイム延長を狙おう！</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-white rounded-full transition-colors shrink-0 shadow-sm"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-slate-50 flex flex-col lg:flex-row">
          
          {/* 左カラム：ステータス＆装備枠 */}
          <div className="w-full lg:w-1/2 p-4 sm:p-6 overflow-y-auto lg:border-r border-indigo-100 flex flex-col gap-6">
            
            {/* 能力合計値パネル */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-indigo-100 relative overflow-hidden shrink-0">
              <h3 className="text-sm font-black text-indigo-800 mb-3 text-center bg-indigo-50 py-1 rounded-lg">
                発動中のアイテムスキル合計
                <span className="text-xs ml-2 text-indigo-500 font-normal">（アイコンにカーソルを合わせると説明が出ます）</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Object.entries(powers.points).map(([key, point]) => {
                  const info = GEAR_POWER_LABELS[key];
                  return (
                    <div 
                      key={key} 
                      className={`group relative flex flex-col items-center justify-center p-3 rounded-xl border cursor-help ${point > 0 ? `${info.bg} ${info.color} border-current shadow-sm scale-105 hover:scale-110` : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'} transition-all`}
                    >
                      <span className="text-2xl mb-1 pointer-events-none">{info.icon}</span>
                      <span className="text-[10px] font-black pointer-events-none">{info.label}</span>
                      <span className="text-base font-black mt-1 pointer-events-none">{formatPowerPoint(key, point)}</span>
                      
                      {/* ツールチップ */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-indigo-900 text-white text-xs font-bold rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none text-center leading-relaxed">
                        {POWER_DESCRIPTIONS[key]}
                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-900 rotate-45"></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-3 text-xs sm:text-sm font-bold text-gray-600 flex flex-wrap gap-4 justify-center bg-gray-50 py-2 rounded-xl">
                {powers.scoreBoost > 0 && <span>🪙 スコア <span className="text-yellow-600">+{Math.round(powers.scoreBoost * 100)}%</span></span>}
                {powers.timePlus > 0 && <span>⏳ タイム <span className="text-sky-600">+{powers.timePlus.toFixed(1)}秒</span></span>}
                {powers.comboBoost > 0 && <span>🎯 コンボ <span className="text-green-600">+{powers.comboBoost.toFixed(2)}倍</span></span>}
                {powers.missGuardProb > 0 && <span>🛡️ ミス無効 <span className="text-indigo-600">{Math.round(powers.missGuardProb * 100)}%</span></span>}
                {powers.specialRateUp > 0 && <span>✨ 激アツ率 <span className="text-rose-600">+{Math.round(powers.specialRateUp * 100)}%</span></span>}
                
                {powers.scoreBoost === 0 && powers.timePlus === 0 && powers.comboBoost === 0 && powers.missGuardProb === 0 && powers.specialRateUp === 0 && (
                  <span className="text-gray-400">まだ効果は発動していません</span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6 shrink-0">
            {/* メイン装備 */}
            <div className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-4 transition-colors ${selectingSlot?.type === 'main' ? 'border-amber-400 bg-amber-50' : 'border-amber-200'}`}>
              <h3 className="text-base font-black text-amber-800 mb-2 flex items-center gap-2">
                <span className="bg-amber-100 px-2 py-0.5 rounded text-amber-700">メイン枠</span> 
                大きく能力アップ！
              </h3>
              <div className="flex justify-around gap-2 mt-4">
                {[0, 1, 2].map(index => {
                  const itemName = gears.main[index];
                  const item = itemName ? GACHA_ITEMS.find(i => i.name === itemName) : null;
                  const powerKey = itemName ? getPowerType(itemName) : null;
                  const isSelectingThis = selectingSlot?.type === 'main' && selectingSlot?.index === index;
                  
                  return (
                    <div key={`main-${index}`} className="relative flex flex-col items-center">
                      <button
                        onClick={() => handleSlotClick('main', index)}
                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 transition-all flex flex-col items-center justify-center 
                          ${isSelectingThis ? 'border-amber-500 ring-4 ring-amber-200 scale-105 bg-white z-10 animate-pulse' : 'border-gray-200 hover:border-amber-300'}
                          ${item ? 'bg-white shadow-md' : 'bg-gray-50 border-dashed hover:bg-amber-50'}`}
                        style={item && !isSelectingThis ? { borderColor: item.color } : {}}
                      >
                        {item ? (
                          <>
                            <span className="text-4xl">{item.emoji}</span>
                            <span className="absolute -top-2 -right-2 bg-white text-lg rounded-full shadow-sm">
                              {GEAR_POWER_LABELS[powerKey].icon}
                            </span>
                            <div className="absolute -bottom-6 w-[120%] text-center">
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 shadow-sm border border-amber-200 whitespace-nowrap">
                                {formatPowerPoint(powerKey, getItemPowerPoints(item.name, true, player.itemLevels?.[item.name]))}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center text-gray-400">
                            <span className="text-3xl font-black mb-1">+</span>
                            <span className="text-[10px] font-bold">えらぶ</span>
                          </div>
                        )}
                      </button>
                      {item && (
                        <button onClick={(e) => handleRemove('main', index, e)} className="absolute -bottom-8 bg-white border border-gray-300 rounded-full p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 shadow-sm transition-colors z-20">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* サブ装備 */}
            <div className={`bg-white rounded-2xl p-4 sm:p-5 shadow-sm border-4 transition-colors ${selectingSlot?.type === 'sub' ? 'border-sky-400 bg-sky-50' : 'border-sky-200'}`}>
              <h3 className="text-base font-black text-sky-800 mb-2 flex items-center gap-2">
                <span className="bg-sky-100 px-2 py-0.5 rounded text-sky-700">サブ枠</span> 
                少し能力アップ！
              </h3>
              <div className="grid grid-cols-3 gap-y-6 gap-x-2 mt-4 justify-items-center">
                {[0,1,2,3,4,5,6,7,8].map(index => {
                  const itemName = gears.sub[index];
                  const item = itemName ? GACHA_ITEMS.find(i => i.name === itemName) : null;
                  const powerKey = itemName ? getPowerType(itemName) : null;
                  const isSelectingThis = selectingSlot?.type === 'sub' && selectingSlot?.index === index;
                  
                  return (
                    <div key={`sub-${index}`} className="relative flex flex-col items-center">
                      <button
                        onClick={() => handleSlotClick('sub', index)}
                        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 transition-all flex flex-col items-center justify-center
                          ${isSelectingThis ? 'border-sky-500 ring-4 ring-sky-200 scale-110 bg-white z-10 animate-pulse' : 'border-gray-200 hover:border-sky-300'}
                          ${item ? 'bg-white shadow-sm' : 'bg-gray-50 border-dashed hover:bg-sky-50'}`}
                        style={item && !isSelectingThis ? { borderColor: item.color } : {}}
                      >
                        {item ? (
                          <>
                            <span className="text-2xl">{item.emoji}</span>
                            <span className="absolute -top-1.5 -right-1.5 bg-white text-xs rounded-full shadow-sm">
                              {GEAR_POWER_LABELS[powerKey].icon}
                            </span>
                            <div className="absolute -bottom-4 w-[120%] text-center">
                              <span className="text-[9px] font-black px-1 py-0.5 rounded-full bg-sky-100 text-sky-800 shadow-sm border border-sky-200 whitespace-nowrap">
                                {formatPowerPoint(powerKey, getItemPowerPoints(item.name, false, player.itemLevels?.[item.name]))}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center text-gray-400">
                            <span className="text-xl font-black mb-0.5">+</span>
                          </div>
                        )}
                      </button>
                      {item && (
                        <button onClick={(e) => handleRemove('sub', index, e)} className="absolute -bottom-5 bg-white border border-gray-300 rounded-full p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 shadow-sm transition-colors z-20">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          </div>

          {/* 右カラム：アイテム選択領域（常時表示） */}
          <div className="w-full lg:w-1/2 p-4 sm:p-6 overflow-y-auto flex flex-col min-h-[300px] bg-slate-100/50">
            <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3 ${selectingSlot ? 'justify-between' : 'justify-end'}`}>
              {selectingSlot ? (
                <h3 className="font-black text-indigo-900 flex items-center gap-1.5 text-sm sm:text-base bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                  <span>🎒</span>
                  <span className="text-amber-600">{selectingSlot.type === 'main' ? 'メイン枠' : 'サブ枠'} に装備するアイテムを選択</span>
                </h3>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {/* フィルター */}
                <div className="relative">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="appearance-none bg-white border border-indigo-200 text-indigo-900 text-sm font-bold rounded-lg pl-8 pr-6 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                  >
                    <option value="all">すべての能力</option>
                    {Object.entries(GEAR_POWER_LABELS).map(([key, info]) => (
                      <option key={key} value={key}>{info.icon} {info.label}</option>
                    ))}
                  </select>
                  <Filter className="w-4 h-4 text-indigo-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {/* ソート */}
                <div className="relative">
                  <select
                    value={sortType}
                    onChange={(e) => setSortType(e.target.value)}
                    className="appearance-none bg-white border border-indigo-200 text-indigo-900 text-sm font-bold rounded-lg pl-8 pr-6 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                  >
                    <option value="rarity">レア順</option>
                    <option value="name">名前順</option>
                  </select>
                  <ArrowDownUp className="w-4 h-4 text-indigo-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                
                {selectingSlot && (
                  <button onClick={() => setSelectingSlot(null)} className="text-indigo-500 hover:text-indigo-700 font-bold text-sm bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-sm ml-2">
                    選択キャンセル
                  </button>
                )}
              </div>
            </div>
            
            {displayItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center py-8 text-gray-400 font-bold bg-gray-50 rounded-xl border-2 border-dashed">
                条件にあうアイテムがありません。
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-3 bg-white p-4 rounded-xl border-2 border-indigo-100 shadow-inner overflow-y-auto content-start">
                {displayItems.map(item => {
                  const powerKey = getPowerType(item.name);
                  const powerInfo = GEAR_POWER_LABELS[powerKey];
                  const isEquippedMain = gears.main.includes(item.name);
                  const isEquippedSub = gears.sub.includes(item.name);
                  const isEquipped = isEquippedMain || isEquippedSub;
                  const powerPoints = getItemPowerPoints(item.name, selectingSlot?.type === 'main' || !selectingSlot, player.itemLevels?.[item.name]); // デフォルト表示はメイン相当か、枠がない場合はサブ等考慮

                  return (
                    <div
                      key={item.name}
                      onClick={() => !isEquipped && handleItemSelect(item.name)}
                      className={`group relative flex flex-col items-center justify-center rounded-xl border-2 transition-transform hover:scale-105 active:scale-95 bg-white shadow-sm p-2 aspect-square ${isEquipped ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
                      style={{ borderColor: item.color }}
                      title={`${item.name} (${powerInfo.label} メイン: ${formatPowerPoint(powerKey, getItemPowerPoints(item.name, true, player.itemLevels?.[item.name]))} / サブ: ${formatPowerPoint(powerKey, getItemPowerPoints(item.name, false, player.itemLevels?.[item.name]))})`}
                    >
                      <span className="text-4xl mb-1">{item.emoji}</span>
                      <span className="text-[10px] font-black text-gray-700 truncate w-full text-center px-1 mb-4">{item.name}</span>
                      <div className={`absolute bottom-0 w-full text-[10px] font-black text-white py-0.5 rounded-b-[10px] text-center truncate px-1 flex items-center justify-center gap-0.5`} style={{ backgroundColor: item.color }}>
                        <span>{powerInfo.icon}</span>
                        <span>{formatPowerPoint(powerKey, powerPoints)}</span>
                      </div>
                      {isEquipped && (
                        <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
                          <span className="text-white text-xs font-black px-2 py-1 bg-black/60 rounded">装備中</span>
                        </div>
                      )}
                      
                      {/* レベルバッジ */}
                      {player.itemLevels?.[item.name] > 0 && (
                        <div className="absolute -top-2 -left-2 bg-indigo-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm z-10 border border-indigo-200">
                          Lv.{player.itemLevels[item.name]}
                        </div>
                      )}
                      
                      {/* 強化ボタン */}
                      {(player.collection[item.name] || 0) >= 2 && !isEquipped && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSynthesisItem(item); }}
                          className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full p-1 shadow-sm hover:scale-110 active:scale-95 transition-transform z-10 border border-white"
                          title="アイテムを強化する"
                        >
                          <ArrowUpCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-white border-t border-indigo-100 flex justify-end shrink-0 gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={save}
            className="px-8 py-3 rounded-xl font-black text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            保存して閉じる
          </button>
        </div>
      </div>
      
      {/* 強化モーダル */}
      <ItemSynthesisModal 
        isOpen={!!synthesisItem}
        item={synthesisItem}
        player={player}
        onClose={() => setSynthesisItem(null)}
        onPlayerUpdate={(newPlayer) => {
          onPlayerUpdate?.(newPlayer);
        }}
      />
    </div>
  );
}
