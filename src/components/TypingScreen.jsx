import React, { useState, useEffect, useCallback } from 'react';
import { Keyboard, ArrowLeft } from 'lucide-react';
import { WORDS, FINGER_MAP, BACKGROUNDS } from '../constants';
import { saveCloudPlayer } from '../firebase';

export default function TypingScreen({ player, onBack }) {
  const [currentWord, setCurrentWord] = useState(null);
  const [typedText, setTypedText] = useState('');
  const [points, setPoints] = useState(player?.points || 0);

  // Initialize the first word
  useEffect(() => {
    nextWord();
  }, []);

  const nextWord = useCallback(() => {
    const difficulty = player?.currentDifficulty || 'normal';
    const wordList = WORDS[difficulty] || WORDS.normal;
    const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
    setCurrentWord(randomWord);
    setTypedText('');
  }, [player]);

  // Handle typing logic
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore meta keys
      if (e.ctrlKey || e.metaKey || e.altKey || e.key === 'Shift') return;
      if (!currentWord) return;

      const key = e.key.toLowerCase();
      const newTyped = typedText + key;

      // Check if newTyped is a valid prefix for ANY of the acceptable romaji patterns
      const isValidPrefix = currentWord.romaji.some(r => r.startsWith(newTyped));

      if (isValidPrefix) {
        // Correct key
        // playTypeSound()
        setTypedText(newTyped);

        // Check if word is fully typed
        const isComplete = currentWord.romaji.some(r => r === newTyped);
        if (isComplete) {
          // Word cleared!
          const newPoints = points + 10;
          setPoints(newPoints);
          
          if (player) {
            player.points = newPoints;
            saveCloudPlayer(player.id, player); // Save in background
          }
          
          setTimeout(() => {
            nextWord();
          }, 300);
        }
      } else {
        // Wrong key
        // playErrorSound()
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentWord, typedText, points, nextWord, player]);

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

      <header className="absolute top-4 left-4 right-4 flex justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-md border-2 border-white/50 z-10">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> もどる
        </button>
        <div className="text-xl font-black text-yellow-600">
          🪙 {points}
        </div>
      </header>

      <main className="w-full max-w-2xl bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-xl flex flex-col items-center gap-8 mt-12">
        <div className="text-8xl">{currentWord?.emoji}</div>
        
        <div className="text-5xl font-black tracking-widest text-gray-800">
          {currentWord?.kana}
        </div>

        {/* Display romaji target */}
        <div className="flex gap-1 text-4xl font-black font-mono">
          {currentWord?.romaji[0].split('').map((char, index) => {
            const isTyped = index < typedText.length;
            const isCurrent = index === typedText.length;
            // NOTE: This visual display uses just the FIRST valid romaji pattern (romaji[0])
            // for simplicity. The actual logic accepts ANY valid romaji pattern.
            // If the user types a different valid prefix, the display will still show their typed chars correctly.
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

      </main>
    </div>
  );
}
