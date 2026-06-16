import fs from 'fs';

const APP_JSX_PATH = '/Users/motoyamayuuki/.gemini/antigravity/scratch/kids-typing-game/src/App.jsx';

const fixScript = () => {
  let content = fs.readFileSync(APP_JSX_PATH, 'utf8');
  
  const badTags = `              </div>
            </div>
          </>
        )}
      </div>

      {/* プレイヤー管理モーダル */}`;
      
  const goodTags = `              </div>
            </div>
          </>
        )}
        </main>
      )}

      {/* プレイヤー管理モーダル */}`;
  
  if (content.includes(badTags)) {
    content = content.replace(badTags, goodTags);
    fs.writeFileSync(APP_JSX_PATH, content, 'utf8');
    console.log("Success: Replaced bad closing tags.");
  } else {
    console.error("Error: Could not find bad tags to replace.");
  }
};

fixScript();
