import React, { useState, useEffect } from 'react';
import { ArrowLeft, Map, Star, Gift, CheckCircle } from 'lucide-react';
import { generateAllRomaji, BACKGROUNDS } from '../constants';
import { saveCloudPlayer } from '../firebase';

const MOCK_EVENTS = [
  {
    title: 'ゴミがおちている！',
    choices: [
      { text: 'ゴミはゴミばこへ', kana: 'ゴミはゴミばこへ', romaji: generateAllRomaji('ゴミはゴミばこへ'), correct: true },
      { text: 'しらんかお', kana: 'しらんかお', romaji: generateAllRomaji('しらんかお'), correct: false }
    ],
    bg: '/subevent_litter.png'
  },
  {
    title: 'おばあちゃんがこまっている',
    choices: [
      { text: 'おてつだいします', kana: 'おてつだいします', romaji: generateAllRomaji('おてつだいします'), correct: true },
      { text: 'あっちいけ！', kana: 'あっちいけ！', romaji: generateAllRomaji('あっちいけ！'), correct: false }
    ],
    bg: '/subevent_grandma.png'
  }
];

export default function QuestScreen({ player, onBack }) {
  const [progress, setProgress] = useState(0);
  const [activeEvent, setActiveEvent] = useState(null);
  const [typingTarget, setTypingTarget] = useState(null);
  const [typedText, setTypedText] = useState('');
  const [showClear, setShowClear] = useState(false);

  // Advance quest
  const handleAdvance = () => {
    if (progress >= 10) return;
    
    // 30% chance of sub event
    if (Math.random() < 0.5) {
      const randomEvent = MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)];
      setActiveEvent(randomEvent);
    } else {
      setProgress(progress + 1);
    }
  };

  const handleChoice = (choice) => {
    if (choice.correct) {
      // Start typing phase for this choice
      setTypingTarget(choice);
      setTypedText('');
    } else {
      // Error sound
      alert('ちがうよ！やさしいことばをえらぼう！');
    }
  };

  // Typing logic for sub event
  useEffect(() => {
    if (!typingTarget) return;

    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key === 'Shift') return;

      const key = e.key.toLowerCase();
      const newTyped = typedText + key;

      const isValidPrefix = typingTarget.romaji.some(r => r.startsWith(newTyped));

      if (isValidPrefix) {
        setTypedText(newTyped);

        const isComplete = typingTarget.romaji.some(r => r === newTyped);
        if (isComplete) {
          // Clear sub event
          setTypingTarget(null);
          setActiveEvent(null);
          setProgress(progress + 1);
          
          if (player) {
            player.points = (player.points || 0) + 50;
            saveCloudPlayer(player.id, player);
          }
          
          setShowClear(true);
          setTimeout(() => setShowClear(false), 2000);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typingTarget, typedText, progress, player]);

  const bgItem = BACKGROUNDS.find(b => b.id === (player?.currentBackground || 'default')) || BACKGROUNDS[0];

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 z-[-1] pointer-events-none transition-all duration-1000 ease-in-out">
        <img 
          src={bgItem.url} 
          alt="Background" 
          className="absolute inset-0 w-full h-full object-cover object-center opacity-80" 
        />
      </div>

      <header className="absolute top-4 left-4 right-4 flex justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-md z-10">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> もどる
        </button>
        <div className="flex gap-4 text-xl font-black">
          <span className="text-yellow-600">🪙 {player?.points || 0}</span>
          <span className="text-blue-600">📍 すすんだきょり: {progress}/10</span>
        </div>
      </header>

      {/* Main Quest Area */}
      {!activeEvent ? (
        <div className="flex flex-col items-center gap-8 mt-12 bg-white/90 p-12 rounded-3xl shadow-xl">
          <Map className="w-24 h-24 text-green-500 animate-bounce" />
          <h1 className="text-4xl font-black text-gray-800">ぼうけんにしゅっぱつ！</h1>
          {progress >= 10 ? (
            <div className="text-center">
              <h2 className="text-3xl font-bold text-yellow-500 mb-4">クエストクリア！🎉</h2>
              <button onClick={onBack} className="px-8 py-4 bg-sky-500 text-white text-2xl font-bold rounded-2xl hover:bg-sky-600 shadow-xl">ホームにもどる</button>
            </div>
          ) : (
            <button 
              onClick={handleAdvance}
              className="px-8 py-4 bg-orange-400 hover:bg-orange-500 text-white text-2xl font-bold rounded-2xl shadow-xl transition-transform active:scale-95"
            >
              すすむ
            </button>
          )}
        </div>
      ) : (
        /* Sub Event Modal */
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl flex flex-col relative animate-in zoom-in-95">
            <div className="h-48 relative bg-gray-200">
              <img src={activeEvent.bg} alt="Event" className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
              <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
            </div>
            
            <div className="p-8 flex flex-col items-center text-center -mt-12 relative z-10">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md">
                <Star className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-3xl font-black text-gray-800 mb-8">{activeEvent.title}</h2>

              {!typingTarget ? (
                <div className="flex flex-col gap-4 w-full">
                  <p className="text-gray-500 font-bold mb-2">どうする？</p>
                  {activeEvent.choices.map((choice, i) => (
                    <button 
                      key={i}
                      onClick={() => handleChoice(choice)}
                      className="w-full py-4 bg-gray-50 hover:bg-sky-50 border-2 border-gray-200 hover:border-sky-300 rounded-xl text-xl font-bold text-gray-700 transition-all"
                    >
                      {choice.text}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-6">
                  <p className="text-sky-500 font-bold text-xl">タイピングで解決だ！</p>
                  <div className="text-4xl font-black tracking-widest text-gray-800">
                    {typingTarget.kana}
                  </div>
                  <div className="flex gap-1 text-3xl font-black font-mono">
                    {typingTarget.romaji[0].split('').map((char, index) => {
                      const isTyped = index < typedText.length;
                      const isCurrent = index === typedText.length;
                      const displayChar = isTyped ? typedText[index] : char;
                      return (
                        <span 
                          key={index} 
                          className={`${isTyped ? 'text-sky-500' : isCurrent ? 'text-gray-800 border-b-4 border-orange-400' : 'text-gray-300'}`}
                        >
                          {displayChar}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clear Animation Overlay */}
      {showClear && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
          <CheckCircle className="w-32 h-32 text-green-500 bg-white rounded-full" />
          <h2 className="text-5xl font-black text-white drop-shadow-lg mt-4">だいせいこう！</h2>
        </div>
      )}
    </div>
  );
}
