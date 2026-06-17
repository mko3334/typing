/**
 * Two-phase restore:
 * 1) Base file from pre-corruption era (total ~6586, step < 9500)
 * 2) Extension lines 6587-7133 from latest era snapshots
 */
const fs = require('fs');
const readline = require('readline');

const LOG_PATH =
  '/Users/motoyamayuuki/.gemini/antigravity/brain/e2d837ab-6070-48fb-92a9-898e42663f1d/.system_generated/logs/transcript_full.jsonl';
const HEAD_PATH =
  '/Users/motoyamayuuki/.gemini/antigravity/scratch/kids-typing-game/head_extracted_9056.txt';
const OUT_PATH =
  '/Users/motoyamayuuki/.gemini/antigravity/scratch/kids-typing-game/src/App.jsx';

const LINE_RE = /^(\d+):\s?(.*)$/;
const MARKER = 'Please note that any changes targeting the original code';
const CORRUPT_STEP = 9500;
const BASE_MAX = 6586;
const FINAL_MAX = 7133;
const BODY_START = 89;

const JUNK =
  /^(# |-\s*\[|```|Please note that the above|Transformation completed|console\.log\("Transformation|reconstructedLines|transcriptPath|fs\.writeFileSync|extract_history|restore_app|path\.join|walkthrough|ビルド・デプロイ|タスクリスト|\[diff_block|code = code\.replace|<\/main>\\n|\/\/ Close the appScreen|\/\/ Add "Back to Title")/;

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

function isBadLine(text) {
  if (text == null || text === '') return true;
  if (JUNK.test(text)) return true;
  if (/^import React/.test(text)) return true;
  if (/^import \{/.test(text) && text.includes("from './")) return true;
  if (/^import confetti/.test(text)) return true;
  if (/^import localforage/.test(text)) return true;
  if (/^const WORDS =/.test(text)) return true;
  if (/^const ROMAJI_TABLE =/.test(text)) return true;
  if (/^function generateAllRomaji/.test(text)) return true;
  if (/^const toHiragana =/.test(text)) return true;
  if (/^\s*recurse\(index \+ 1/.test(text)) return true;
  if (/^\s*recurse\(0, ''\)/.test(text)) return true;
  if (/^\s*return \[\.\.\.new Set\(results\)\]/.test(text)) return true;
  return false;
}

function score(total, step, phase) {
  const clean = step < CORRUPT_STEP ? 1e13 : 0;
  if (phase === 'base') {
    const dist = Math.abs(total - BASE_MAX);
    return clean + (1e10 - dist * 1e7) + step;
  }
  return clean + total * 1e9 + step;
}

async function loadMerge(phase) {
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

    const content = parsed.content || '';
    const totalM = content.match(/Total Lines: (\d+)/);
    const rangeM = content.match(/Showing lines (\d+) to (\d+)/);
    if (!totalM || !rangeM) continue;

    const total = Number(totalM[1]);
    const step = parsed.step_index;
    const from = Number(rangeM[1]);
    const to = Number(rangeM[2]);
    if (total < 6000) continue;

    if (phase === 'base') {
      if (step >= CORRUPT_STEP) continue;
      if (total < 6000 || total > 6800) continue;
    } else if (phase === 'ext') {
      if (total < 7000) continue;
    }

    const start = content.indexOf(MARKER);
    if (start < 0) continue;

    let section = content.slice(start);
    const end = section.indexOf('The above content');
    if (end > 0) section = section.slice(0, end);

    const lineMin = phase === 'ext' ? BASE_MAX + 1 : BODY_START;
    const lineMax = phase === 'ext' ? FINAL_MAX : BASE_MAX;
    const sc = score(total, step, phase === 'ext' ? 'ext' : 'base');

    for (const raw of section.split('\n')) {
      const lm = raw.match(LINE_RE);
      if (!lm) continue;
      const n = Number(lm[1]);
      const text = lm[2];
      if (n < lineMin || n > lineMax || n < from || n > to || isBadLine(text)) continue;

      // Skip corrupted splice lines in high-line-number snapshots
      if (total >= 7000 && n === 739 && !text.includes('export default function App')) continue;
      if (total >= 7000 && n >= 739 && n <= 800 && text.includes('nextP.currentIcon')) continue;

      const prev = merged.get(n);
      if (!prev || sc > prev.score || (sc === prev.score && text.length > prev.text.length)) {
        merged.set(n, { text, score: sc, total, step });
      }
    }
  }

  return merged;
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
  let first = -1;
  let out = source;
  while ((idx = out.indexOf(signature, idx)) !== -1) {
    if (first === -1) {
      first = idx;
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

  const dupSigs = [
    'const handleBackToTitle = async () => {',
    'const handleSendRequest = async () => {',
    'const handleRequestKanaChange = (',
    'const handleDeleteRequest = async (',
    'const renderKeyboard = (',
  ];
  for (const sig of dupSigs) out = removeDuplicateBlocks(out, sig);

  const tail = '\n    </div>\n  );\n}\n';
  const endIdx = out.lastIndexOf(tail);
  if (endIdx > 0) {
    const cut = endIdx + tail.length;
    if (out.slice(cut).trim()) out = out.slice(0, cut);
  }

  return out;
}

async function main() {
  const base = await loadMerge('base');
  const ext = await loadMerge('ext');
  const merged = new Map([...base, ...ext]);

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

  const exportLine = [...merged.entries()].find(([, v]) => v.text.includes('export default function App'));
  console.log(
    JSON.stringify(
      {
        outputLines: source.split('\n').length,
        filled,
        missing,
        exportAt: exportLine ? exportLine[0] : null,
        exportText: exportLine ? exportLine[1].text : null,
        line739: merged.get(739)?.text?.slice(0, 60) || null,
        handleBackToTitle: (source.match(/const handleBackToTitle/g) || []).length,
        missingMarkers: (source.match(/__MISSING_LINE_/g) || []).length,
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
