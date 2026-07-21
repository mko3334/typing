import React, { useRef, useEffect } from 'react';

export default function TypingCanvas({
  currentWord,
  typedChars,
  displayRomaji,
  assistSettings,
  isAlphabetQuiz,
  width = 600,
  height = 300,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!currentWord) return;

      const centerX = canvas.width / 2;
      let yOffset = 50;

      if (isAlphabetQuiz) {
        // Main Alphabet
        const char = (currentWord?.romaji[0] || '').toLowerCase();
        ctx.font = '900 100px sans-serif';
        ctx.fillStyle = '#f43f5e'; // rose-500
        ctx.textAlign = 'center';
        ctx.fillText(char, centerX, yOffset + 80);

        // Kana
        ctx.font = '900 20px sans-serif';
        ctx.fillStyle = '#374151'; // gray-700
        ctx.fillText(currentWord?.kana, centerX, yOffset + 140);
      } else {
        // Emoji
        ctx.font = '60px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(currentWord?.emoji || '', centerX, yOffset + 60);

        // Kana
        ctx.font = '900 36px sans-serif';
        ctx.fillStyle = currentWord?.isSpecial ? '#c026d3' : '#111827';
        ctx.fillText(currentWord?.kana, centerX, yOffset + 120);
      }

      // Romaji input area
      const typed = isAlphabetQuiz 
        ? typedChars.toLowerCase() 
        : (assistSettings.letterCase === 'upper' ? typedChars.toUpperCase() : typedChars);
        
      const untyped = isAlphabetQuiz
        ? displayRomaji.slice(typedChars.length).toLowerCase()
        : (assistSettings.letterCase === 'upper' ? displayRomaji.slice(typedChars.length).toUpperCase() : displayRomaji.slice(typedChars.length));

      const showHint = assistSettings.showRomajiHint;

      ctx.font = '900 32px monospace';
      const typedWidth = ctx.measureText(typed).width;
      const untypedWidth = showHint ? ctx.measureText(untyped).width : 0;
      const totalWidth = typedWidth + untypedWidth;
      
      const startX = centerX - totalWidth / 2;
      
      ctx.fillStyle = '#0284c7'; // sky-600
      ctx.textAlign = 'left';
      ctx.fillText(typed, startX, yOffset + 200);

      if (showHint) {
        ctx.fillStyle = '#9ca3af'; // gray-400
        ctx.fillText(untyped, startX + typedWidth, yOffset + 200);
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentWord, typedChars, displayRomaji, assistSettings, isAlphabetQuiz]);

  return (
    <div className="w-full max-w-xl mx-auto flex justify-center bg-gray-100 rounded-xl border-2 border-gray-200 shadow-inner overflow-hidden mb-4">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        className="max-w-full h-auto"
        style={{ width: '100%', maxWidth: '600px', aspectRatio: '2/1' }}
      />
    </div>
  );
}
