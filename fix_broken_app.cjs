/**
 * Surgical fixes for App.jsx.broken structure.
 */
const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, 'src/App.jsx');

let s = fs.readFileSync(APP, 'utf8');

// 1. Import FINGER_MAP from constants (remove broken local FINGER_MAP stub)
if (!s.includes("from './constants'")) {
  s = s.replace(
    /import confetti from 'canvas-confetti';\n/,
    "import confetti from 'canvas-confetti';\nimport { FINGER_MAP } from './constants';\n"
  );
}

s = s.replace(
  /\/\/ タイピング時の指ガイド用マッピング\nconst FINGER_MAP = \{[\s\S]*?h: \{ hand: 'right', finger: 'index', label: 'みぎ手・ひとさしゆび' \},\n\n+[\s\S]*?(?=\{ name: 'きょうりゅう')/,
  "// ガチャコレクション用アイテム（emoji付き）\nconst COLLECTION_GACHA_ITEMS = [\n  "
);

// 2. Remove duplicate broken SUB_EVENTS / KEYBOARD_ROWS / BAD_WORDS block
s = s.replace(
  /\/\/ 人助けサブイベントのマスターデータ（10種類）\nconst SUB_EVENTS = \[\n  \{\n    id: 'lost_child'[\s\S]*?\];\n\n\/\/ 難易度自動判定ロジック/,
  '// 難易度自動判定ロジック'
);

// 3. Fix cleanup sub-event + remove misplaced updateAndSavePlayerData before component
s = s.replace(
  /name: 'ゆうとく  const updateAndSavePlayerData[\s\S]*?await autoSaveToCloud\(playerId\);\n  \};onst/,
  `name: 'ゆうとくん',
    text: 'サッカーボールをなくしちゃった！探すの手伝って！',
    requiredItems: ['サッカーボール'],
    reward: { points: 120, tickets: { special: 1 } }
  }
];

export default function App() {
  const`
);

// 4. Fix triggerConfetti
s = s.replace(
  /const triggerConfetti = useCallback\(\(\) => \{[\s\S]*?\}, \[\]\);/,
  `const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0ea5e9', '#facc15', '#f43f5e', '#10b981'],
    });
  }, []);`
);

// 5. Remove empty/broken duplicate updateAndSavePlayerData stubs before the real one
s = s.replace(
  /\n  const updateAndSavePlayerData = async \(playerId, updates\) => \{\n  \}, \[\]\);\n\n/g,
  '\n'
);
while (
  /\n  const updateAndSavePlayerData = async \(playerId, updates\) => \{\n    if \(!playerId\) return;[\s\S]*?origin: \{ y: 0\.6 \},[\s\S]*?\}\), \[\]\);\n\n/.test(
    s
  )
) {
  s = s.replace(
    /\n  const updateAndSavePlayerData = async \(playerId, updates\) => \{\n    if \(!playerId\) return;[\s\S]*?origin: \{ y: 0\.6 \},[\s\S]*?\}\), \[\]\);\n\n/,
    '\n'
  );
}

// 6. Remove duplicate component ending + trailing dead code
const end = s.match(/\n    <\/div>\n  \);\n\}\n/);
if (end) {
  const idx = s.indexOf(end[0]) + end[0].length;
  s = s.slice(0, idx) + '\n';
}

// 7. Rename GACHA_ITEMS references for collection if needed - keep COLLECTION_GACHA_ITEMS name
// (component may reference GACHA_ITEMS for collection - check later)

fs.writeFileSync(APP, s, 'utf8');
console.log('fix_broken_app.cjs applied, lines:', s.split('\n').length);
