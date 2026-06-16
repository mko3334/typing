import fs from 'fs';

const APP_JSX_PATH = '/Users/motoyamayuuki/.gemini/antigravity/scratch/kids-typing-game/src/App.jsx';

const fixScript = () => {
  let content = fs.readFileSync(APP_JSX_PATH, 'utf8');
  
  const targetRegex = /highlightClass\s*=\s*"bg-red-500\s*text-white\s*-translate-y-0\.5\s*border-red-700\s*scale-105\s*shadow-md\s*shado[\s\S]*?<input[\s\S]*?type="text"[\s\S]*?placeholder="おなまえ検索\.\.\."/;
  
  const replacement = `highlightClass = "bg-red-500 text-white -translate-y-0.5 border-red-700 scale-105 shadow-md shadow-red-300/50 z-10 animate-pulse";
                        }
                      }

                      return (
                        <div
                          key={keyIndex}
                          className={\`relative flex items-center justify-center w-10 sm:w-12 h-12 sm:h-14 rounded-2xl border-b-4 bg-white border-gray-200 text-gray-700 shadow-sm transition-all
                            \${isTypedKey ? 'opacity-50 scale-95 border-b-0 translate-y-1' : ''}
                            \${highlightClass}
                          \`}
                        >
                          <span className="text-base sm:text-lg font-black">{displayKey}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* プレイヤー管理モーダル */}
      {isPlayerModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-55 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-card bg-white/95 w-full max-w-6xl p-4 sm:p-5 max-h-[95vh] flex flex-col shadow-2xl rounded-3xl relative overflow-hidden">
            {/* ヘッダーエリア（タイトル、検索、タグ選択、閉じるをコンパクトに統合） */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3 shrink-0 pb-3 border-b border-gray-100">
              <div className="flex items-center justify-between w-full lg:w-auto gap-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => { playGlobalDecideSound(); setPlayerModalTab('players'); }}
                    className={\`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer \${
                      playerModalTab === 'players'
                        ? 'bg-sky-500 text-white shadow-md border-b-2 border-sky-700'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }\`}
                  >
                    👤 だれがあそぶ？
                  </button>
                  <button
                    onClick={() => { playGlobalDecideSound(); setPlayerModalTab('requests'); }}
                    className={\`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer \${
                      playerModalTab === 'requests'
                        ? 'bg-orange-500 text-white shadow-md border-b-2 border-orange-700'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }\`}
                  >
                    📮 リクエストの確認
                  </button>
                </div>
                {/* モバイル・タブレット用の閉じるボタン */}
                <button onClick={() => { playGlobalCancelSound(); setIsPlayerModalOpen(false); }} className="lg:hidden p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* 検索とおなまえ・タグフィルタのコンテナ（プレイヤー管理タブの時だけ表示） */}
              {playerModalTab === 'players' && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-3xl justify-end">
                  {/* おなまえ検索バー */}
                  <div className="relative flex items-center w-full sm:max-w-xs shrink-0">
                    <span className="absolute left-3 text-gray-400">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="おなまえ検索..."`;
  
  if (targetRegex.test(content)) {
    content = content.replace(targetRegex, replacement);
    fs.writeFileSync(APP_JSX_PATH, content, 'utf8');
    console.log("Success: Replaced corrupted App.jsx code.");
  } else {
    console.error("Error: Target regex did not match!");
  }
};

fixScript();
