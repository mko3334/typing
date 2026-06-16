const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Add appScreen state
code = code.replace(
  "const [gameMode, setGameMode] = useState('classic');",
  "const [appScreen, setAppScreen] = useState('title');\n  const [gameMode, setGameMode] = useState('classic');"
);

// Add handleBackToTitle
code = code.replace(
  "const handleRestart = () => {",
  "const handleBackToTitle = () => {\n    setAppScreen('title');\n    setGachaState('hidden');\n    setCurrentReward(null);\n    setIsAllClear(false);\n  };\n\n  const handleRestart = () => {"
);

// Modify header
code = code.replace(
  /<header[\s\S]*?<\/header>/,
  `<header className="w-full max-w-3xl flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center">
          {appScreen === 'playing' && gameMode === 'points' && (
            <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-yellow-200 font-black text-sm sm:text-base flex items-center gap-1 text-orange-500 animate-pop-out">
              🪙 {points} pt
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsZukanOpen(true)} className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white text-orange-500 shadow-md hover:scale-105 transition-transform"><Book className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          <button onClick={() => setIsSettingsOpen(true)} className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white text-gray-500 shadow-md hover:scale-105 transition-transform"><Settings className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          <button onClick={() => setIsAssistSettingsOpen(true)} className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 shadow-md hover:scale-105 active:scale-95 bg-yellow-400 text-yellow-900 ring-2 ring-yellow-200"><Sparkles className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />アシストせってい</button>
        </div>
      </header>`
);

// Add Title Screen before main tag
code = code.replace(
  /<main className="w-full max-w-3xl flex-1 flex flex-col items-center justify-center min-h-0">/,
  `{appScreen === 'title' ? (
        <main className="w-full max-w-3xl flex-1 flex flex-col items-center justify-center min-h-0 animate-fade-in">
          <div className="glass-card p-6 sm:p-10 text-center w-full max-w-md flex flex-col items-center gap-6">
            <h1 className="text-3xl sm:text-4xl font-black text-sky-600 flex flex-col items-center gap-3 drop-shadow-sm mb-2">
              <div className="bg-white p-3 rounded-2xl shadow-md border-b-4 border-sky-100">
                <Keyboard className="w-12 h-12 text-sky-500" />
              </div>
              はじめてのタイピング
            </h1>

            <div className="flex flex-col w-full gap-4 bg-white/50 p-4 rounded-2xl border border-white/60">
              <div className="flex flex-col gap-2">
                <p className="text-xs sm:text-sm font-bold text-gray-500">あそびかた</p>
                <button onClick={handleGameModeChange} className={\`flex justify-center items-center px-4 py-3 rounded-xl font-bold text-base sm:text-lg shadow-sm transition-all hover:scale-105 active:scale-95 \${gameMode === 'points' ? 'bg-orange-100 text-orange-700 border-2 border-orange-300' : 'bg-white text-gray-600 border-2 border-gray-200'}\`}>
                  {gameMode === 'points' ? '🪙 ポイントためてガチャ' : '🎁 自動で1回ガチャ'}
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs sm:text-sm font-bold text-gray-500">むずかしさ</p>
                <button onClick={handleDifficultyChange} className={\`flex justify-center items-center px-4 py-3 rounded-xl font-bold text-base sm:text-lg shadow-sm transition-all hover:scale-105 active:scale-95 \${difficulty === 'hard' ? 'bg-red-100 text-red-700 border-2 border-red-300' : difficulty === 'normal' ? 'bg-green-100 text-green-700 border-2 border-green-300' : 'bg-blue-100 text-blue-700 border-2 border-blue-300'}\`}>
                  {difficulty === 'hard' ? '🔥 ハード' : difficulty === 'normal' ? '⭐ ノーマル' : '🔰 イージー'}
                </button>
              </div>
            </div>

            <button onClick={() => { handleRestart(); setAppScreen('playing'); }} className="w-full premium-button bg-sky-500 hover:bg-sky-600 text-white text-2xl py-4 mt-2 shadow-xl flex justify-center items-center gap-2">スタート！</button>
          </div>
        </main>
      ) : (
        <main className="w-full max-w-3xl flex-1 flex flex-col items-center justify-center min-h-0">`
);

// Close the appScreen condition block
code = code.replace(
  /<\/main>\s*\{\/\* 右側：コレクションサイドバー/,
  `</main>\n      )}\n\n      {/* 右側：コレクションサイドバー`
);

// Add "Back to Title" links in clear screens
code = code.replace(
  /<button\s*onClick=\{handleRestart\}\s*className="premium-button bg-sky-500 hover:bg-sky-600 text-white text-xl px-6 py-3 flex items-center gap-3 mt-4"\s*>\s*<RefreshCcw className="w-6 h-6" \/>\s*もういちどあそぶ\s*<\/button>/g,
  `<div className="flex flex-col gap-3 mt-4 w-full"><button onClick={handleRestart} className="premium-button bg-sky-500 hover:bg-sky-600 text-white text-xl px-6 py-3 flex justify-center items-center gap-3"><RefreshCcw className="w-6 h-6" /> もういちどあそぶ</button><button onClick={handleBackToTitle} className="text-gray-500 hover:text-gray-700 font-bold underline">タイトルにもどる</button></div>`
);

code = code.replace(
  /<button onClick=\{handleRestart\} className="mt-4 text-gray-400 hover:text-gray-600 font-bold underline text-sm">\s*やっぱりタイピングにもどる\s*<\/button>/g,
  `<button onClick={handleBackToTitle} className="mt-4 text-gray-400 hover:text-gray-600 font-bold underline text-sm">タイトルにもどる</button>`
);

code = code.replace(
  /<div className="flex gap-4">\s*<button onClick=\{\(\) => setGachaState\('shop'\)\} className="premium-button bg-gray-400 hover:bg-gray-500 text-white text-base sm:text-lg px-4 sm:px-6 py-2 flex items-center gap-2">\s*<Gift className="w-5 h-5" \/> ショップ\s*<\/button>\s*<button onClick=\{handleRestart\} className="premium-button bg-sky-500 hover:bg-sky-600 text-white text-base sm:text-lg px-4 sm:px-6 py-2 flex items-center gap-2">\s*<RefreshCcw className="w-5 h-5" \/> タイピング\s*<\/button>\s*<\/div>/g,
  `<div className="flex flex-col sm:flex-row gap-3"><button onClick={() => setGachaState('shop')} className="premium-button bg-gray-400 hover:bg-gray-500 text-white text-base sm:text-lg px-4 sm:px-6 py-2 flex justify-center items-center gap-2 flex-1"><Gift className="w-5 h-5" /> ショップ</button><button onClick={handleRestart} className="premium-button bg-sky-500 hover:bg-sky-600 text-white text-base sm:text-lg px-4 sm:px-6 py-2 flex justify-center items-center gap-2 flex-1"><RefreshCcw className="w-5 h-5" /> タイピング</button></div><button onClick={handleBackToTitle} className="text-gray-400 hover:text-gray-600 font-bold underline text-sm mt-2">タイトルにもどる</button>`
);

code = code.replace(
  /<div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-sm mx-auto">\s*<button onClick=\{handleRestart\} className="premium-button bg-sky-500 hover:bg-sky-600 text-white text-lg px-6 py-3 flex items-center justify-center gap-2 flex-1">\s*<RefreshCcw className="w-5 h-5" \/>\s*つづける\s*<\/button>\s*<button onClick=\{\(\) => setGachaState\('shop'\)\} className="premium-button bg-gradient-to-r from-pink-500 to-orange-400 text-white text-lg px-6 py-3 flex items-center justify-center gap-2 flex-1 animate-pulse-fast">\s*<Gift className="w-5 h-5" \/>\s*ショップ\s*<\/button>\s*<\/div>/g,
  `<div className="flex flex-col gap-3 justify-center w-full max-w-sm mx-auto"><div className="flex flex-col sm:flex-row gap-3"><button onClick={handleRestart} className="premium-button bg-sky-500 hover:bg-sky-600 text-white text-lg px-6 py-3 flex items-center justify-center gap-2 flex-1"><RefreshCcw className="w-5 h-5" /> つづける</button><button onClick={() => setGachaState('shop')} className="premium-button bg-gradient-to-r from-pink-500 to-orange-400 text-white text-lg px-6 py-3 flex items-center justify-center gap-2 flex-1 animate-pulse-fast"><Gift className="w-5 h-5" /> ショップ</button></div><button onClick={handleBackToTitle} className="text-gray-400 hover:text-gray-600 font-bold underline text-sm mt-2">タイトルにもどる</button></div>`
);

// Conditional dummy sidebar
code = code.replace(
  /<div className="w-20 sm:w-28 md:w-48 shrink hidden sm:block"><\/div>/,
  `{appScreen === 'playing' && <div className="w-20 sm:w-28 md:w-48 shrink hidden sm:block"></div>}`
);

// Conditional actual sidebar
code = code.replace(
  /<aside className="w-20 sm:w-28 md:w-48 h-full bg-white\/60 backdrop-blur-md border-l border-white\/50 shadow-lg p-2 sm:p-4 flex flex-col shrink-0 overflow-y-auto z-10">/,
  `{appScreen === 'playing' && <aside className="w-20 sm:w-28 md:w-48 h-full bg-white/60 backdrop-blur-md border-l border-white/50 shadow-lg p-2 sm:p-4 flex flex-col shrink-0 overflow-y-auto z-10">`
);

code = code.replace(
  /<\/aside>\s*<\/div>/,
  `</aside>}\n    </div>`
);

fs.writeFileSync('src/App.jsx', code);
console.log("Transformation completed.");
