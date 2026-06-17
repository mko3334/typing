/**
 * Restore App.jsx from pre-corruption transcript snapshots (step < 9500).
 */
const fs = require('fs');
const readline = require('readline');

const LOG_PATH =
  '/Users/motoyamayuuki/.gemini/antigravity/brain/e2d837ab-6070-48fb-92a9-898e42663f1d/.system_generated/logs/transcript_full.jsonl';
const EXTRACTED_PATH =
  '/Users/motoyamayuuki/.gemini/antigravity/scratch/kids-typing-game/extracted_all.txt';
const HEAD_PATH =
  '/Users/motoyamayuuki/.gemini/antigravity/scratch/kids-typing-game/head_extracted_9056.txt';
const OUT_PATH =
  '/Users/motoyamayuuki/.gemini/antigravity/scratch/kids-typing-game/src/App.jsx';

const LINE_RE = /^(\d+):\s?(.*)$/;
const MARKER = 'Please note that any changes targeting the original code';
const CORRUPT_STEP = 9500;
const BODY_START = 89;
const FINAL_MAX = 7133;

const JUNK =
  /^(# |### |-\s*\[|```|Please note that the above|Transformation completed|console\.log\("Transformation|reconstructedLines|transcriptPath|fs\.writeFileSync|extract_history|restore_app|path\.join|walkthrough|ビルド・デプロイ|タスクリスト|\[diff_block|code = code\.replace|<\/main>\\n|\/\/ Close the appScreen|\/\/ Add "Back to Title"|検証結果)/;

const AUDIO_TAIL = `  setTimeout(() => playTone(783.99, 'triangle', 0.2, 0.3 * vol), 400);
  setTimeout(() => playTone(1046.50, 'triangle', 0.4, 0.3 * vol), 600);
};
const playGachaResultSound = (vol=0.5) => {
  initAudio();
  playTone(440, 'square', 0.1, 0.1 * vol);
  setTimeout(() => playTone(554.37, 'square', 0.1, 0.1 * vol), 100);
  setTimeout(() => playTone(659.25, 'square', 0.4, 0.1 * vol), 200);
};

const DEFAULT_SOUNDS = {
  bgm:       '/sounds/BGM.mp3',
  type:      '/sounds/入力.mp3',
  error:     '/sounds/ミス.mp3',
  wordClear: '/sounds/ワード正解.mp3',
  allClear:  '/sounds/５問クリア時.mp3',
  gacha:     '/sounds/ガチャ開封時.mp3',
  points:    '/sounds/ポイント獲得時.mp3',
  legend:    '/sounds/確定演出.mp3',
};

const playDefaultSE = (type, vol = 0.5) => {
  const path = DEFAULT_SOUNDS[type];
  if (!path) return;
  const audio = new Audio(path);
  audio.volume = vol;
  audio.play().catch(() => {});
};

const playSE = (type, customAudio, volume) => {
  if (customAudio && customAudio[type]) {
    const audio = new Audio(customAudio[type]);
    audio.volume = volume?.se ?? 0.5;
    audio.play().catch(() => {});
    return;
  }
  playDefaultSE(type, volume?.se ?? 0.5);
};`;

function isBadLine(text, lineNo, total) {
  if (text == null || text === '') return true;
  if (JUNK.test(text)) return true;
  if (/^import React/.test(text)) return true;
  if (/^import \{/.test(text) && text.includes("from './")) return true;
  if (/^import confetti/.test(text)) return true;
  if (/^import localforage/.test(text)) return true;
  if (total >= 7000 && lineNo === 739 && !text.includes('export default function App')) return true;
  if (total >= 7000 && lineNo >= 739 && lineNo <= 820 && /nextP\.current/.test(text)) return true;
  return false;
}

function score(total, step) {
  return total * 1e9 + step;
}

async function loadTranscriptMerge() {
  const merged = new Map();
  const rl = readline.createInterface({
    input: fs.createReadStream(LOG_PATH),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.includes('"type":"VIEW_FILE"') || !line.includes('App.jsx')) continue;
    if (line.includes('App.jsx.reconstructed') || line.includes('App.jsx.broken')) continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    if (parsed.step_index >= CORRUPT_STEP) continue;

    const content = parsed.content || '';
    const totalM = content.match(/Total Lines: (\d+)/);
    const rangeM = content.match(/Showing lines (\d+) to (\d+)/);
    if (!totalM || !rangeM) continue;

    const total = Number(totalM[1]);
    if (total < 6000) continue;

    const from = Number(rangeM[1]);
    const to = Number(rangeM[2]);
    const start = content.indexOf(MARKER);
    if (start < 0) continue;

    let section = content.slice(start);
    const end = section.indexOf('The above content');
    if (end > 0) section = section.slice(0, end);

    const sc = score(total, parsed.step_index);

    for (const raw of section.split('\n')) {
      const lm = raw.match(LINE_RE);
      if (!lm) continue;
      const n = Number(lm[1]);
      const text = lm[2];
      if (n < BODY_START || n > FINAL_MAX || n < from || n > to) continue;
      if (isBadLine(text, n, total)) continue;

      const prev = merged.get(n);
      if (!prev || sc > prev.score || (sc === prev.score && text.length > prev.text.length)) {
        merged.set(n, { text, score: sc });
      }
    }
  }

  return merged;
}

function loadExtractedFill(merged) {
  if (!fs.existsSync(EXTRACTED_PATH)) return 0;
  let added = 0;
  for (const raw of fs.readFileSync(EXTRACTED_PATH, 'utf8').split('\n')) {
    const m = raw.match(LINE_RE);
    if (!m) continue;
    const n = Number(m[1]);
    const text = m[2];
    if (n < BODY_START || n > FINAL_MAX || merged.has(n) || isBadLine(text, n, 7136)) continue;
    merged.set(n, { text, score: 1 });
    added++;
  }
  return added;
}

function buildPreamble() {
  const headLines = {};
  for (const raw of fs.readFileSync(HEAD_PATH, 'utf8').split('\n')) {
    const m = raw.match(LINE_RE);
    if (m) headLines[Number(m[1])] = m[2];
  }

  const lines = [];
  for (let i = 1; i <= 5; i++) lines.push(headLines[i]);
  lines.push(
    "import { BACKGROUNDS, TITLES, GACHA_ITEMS, ROMAJI_TABLE, toHiragana, generateAllRomaji, WORDS, FINGER_MAP } from './constants';"
  );
  lines.push('');

  for (let i = 7; i <= 45; i++) {
    if (i === 45) {
      lines.push("  setTimeout(() => playTone(659.25, 'triangle', 0.2, 0.3 * vol), 200);");
    } else {
      lines.push(headLines[i] || '');
    }
  }

  lines.push(...AUDIO_TAIL.split('\n'));
  return lines;
}

function removeDuplicateBlocks(source, signature) {
  let idx = 0;
  let seen = 0;
  let out = source;
  while ((idx = out.indexOf(signature, idx)) !== -1) {
    seen++;
    if (seen === 1) {
      idx += signature.length;
      continue;
    }
    let brace = 0;
    let started = false;
    let end = idx;
    for (let i = idx; i < out.length; i++) {
      const ch = out[i];
      if (ch === '{') {
        brace++;
        started = true;
      } else if (ch === '}') {
        brace--;
      }
      if (started && brace === 0) {
        end = i + 1;
        break;
      }
    }
    while (end < out.length && (out[end] === ';' || out[end] === '\n' || out[end] === '\r')) end++;
    out = out.slice(0, idx) + out.slice(end);
  }
  return out;
}

function postProcess(source) {
  let out = source;
  out = out.replace(/\};onst /g, '};\n\n  const ');
  out = out.replace(/\};onst\[/g, '};\n\n  const [');
  out = out.replace(/\};onst\(/g, '};\n\n  const (');

  for (const sig of [
    'const handleBackToTitle = async () => {',
    'const handleSendRequest = async () => {',
    'const handleRequestKanaChange = (',
    'const handleDeleteRequest = async (',
    'const renderKeyboard = (',
  ]) {
    out = removeDuplicateBlocks(out, sig);
  }

  const end = out.lastIndexOf('\n    </div>\n  );\n}\n');
  if (end > 0) out = out.slice(0, end + '\n    </div>\n  );\n}\n'.length);

  return out;
}

async function main() {
  const merged = await loadTranscriptMerge();
  const extractedAdded = loadExtractedFill(merged);

  const body = [];
  let filled = 0;
  let missing = 0;

  for (let i = BODY_START; i <= FINAL_MAX; i++) {
    const t = merged.get(i);
    if (t) {
      body.push(t.text);
      filled++;
    } else {
      missing++;
    }
  }

  while (body.length && body[body.length - 1] === '') {
    body.pop();
    missing--;
  }

  let source = postProcess([...buildPreamble(), ...body].join('\n'));
  fs.writeFileSync(OUT_PATH, source, 'utf8');

  console.log(
    JSON.stringify(
      {
        outputLines: source.split('\n').length,
        filled,
        missing,
        extractedAdded,
        exportDefault: source.includes('export default function App()'),
        handleBackToTitle: (source.match(/const handleBackToTitle/g) || []).length,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
