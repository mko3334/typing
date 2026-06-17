/**
 * Reconstruct src/App.jsx from transcript_full.jsonl VIEW_FILE snapshots.
 * Prefers pre-corruption snapshots (step < 9500), fills gaps from later logs.
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
const COMPONENT_START = 739;
const MAX_LINE = 7133;
const CORRUPT_STEP = 9500;

const JUNK =
  /^(# |-\s*\[|```|Please note that the above|Transformation completed|console\.log\("Transformation|^\s*origin:\s*\{|^\s*colors:\s*\[|^\s*spread:|reconstructedLines|transcriptPath|fs\.writeFileSync|extract_history|restore_app|path\.join|walkthrough|ビルド・デプロイ|タスクリスト|\[diff_block|code = code\.replace|<\/main>\\n|\/\/ Close the appScreen|\/\/ Add "Back to Title")/;

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
  if (text == null) return true;
  if (JUNK.test(text)) return true;
  if (/^import React/.test(text) && text.includes('from')) return true;
  if (/^import \{/.test(text) && text.includes('from')) return true;
  if (/^import confetti/.test(text)) return true;
  if (/^import localforage/.test(text)) return true;
  if (/^import \{ saveCloudData/.test(text)) return true;
  return false;
}

function scoreLine(total, step) {
  const cleanBonus = step < CORRUPT_STEP ? 1e12 : 0;
  return cleanBonus + total * 1e9 + step;
}

function parseNumberedFile(path) {
  const merged = new Map();
  if (!fs.existsSync(path)) return merged;
  for (const raw of fs.readFileSync(path, 'utf8').split('\n')) {
    const m = raw.match(LINE_RE);
    if (!m) continue;
    const n = Number(m[1]);
    const text = m[2];
    if (n < COMPONENT_START || n > MAX_LINE || isBadLine(text)) continue;
    merged.set(n, { text, score: 1 });
  }
  return merged;
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

    const score = scoreLine(total, parsed.step_index);

    for (const raw of section.split('\n')) {
      const lm = raw.match(LINE_RE);
      if (!lm) continue;
      const n = Number(lm[1]);
      const text = lm[2];
      if (n < COMPONENT_START || n > MAX_LINE || n < from || n > to || isBadLine(text)) continue;

      const prev = merged.get(n);
      if (!prev || score > prev.score || (score === prev.score && text.length > prev.text.length)) {
        merged.set(n, { text, score });
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
  for (const sig of dupSigs) {
    out = removeDuplicateBlocks(out, sig);
  }

  const endMatch = out.match(/\n    <\/div>\n  \);\n}\n/);
  if (endMatch) {
    const idx = out.indexOf(endMatch[0]) + endMatch[0].length;
    if (out.slice(idx).trim()) out = out.slice(0, idx);
  }

  return out;
}

async function main() {
  const transcript = await loadTranscriptMerge();
  const extracted = parseNumberedFile(EXTRACTED_PATH);

  for (const [n, v] of extracted) {
    const prev = transcript.get(n);
    if (!prev || prev.score < 2) {
      transcript.set(n, v);
    }
  }

  const componentLines = [];
  let filled = 0;
  let missing = 0;
  const missingRanges = [];
  let rangeStart = null;

  for (let i = COMPONENT_START; i <= MAX_LINE; i++) {
    const t = transcript.get(i);
    if (t && t.text !== '') {
      componentLines.push(t.text);
      filled++;
      if (rangeStart !== null) {
        missingRanges.push([rangeStart, i - 1]);
        rangeStart = null;
      }
    } else {
      componentLines.push('');
      missing++;
      if (rangeStart === null) rangeStart = i;
    }
  }
  if (rangeStart !== null) missingRanges.push([rangeStart, MAX_LINE]);

  while (componentLines.length && componentLines[componentLines.length - 1] === '') {
    componentLines.pop();
    missing--;
  }

  let source = postProcess([...buildPreamble(), ...componentLines].join('\n'));
  fs.writeFileSync(OUT_PATH, source, 'utf8');

  const stats = {
    outputLines: source.split('\n').length,
    filled,
    missing,
    missingRangeCount: missingRanges.length,
    firstMissingRanges: missingRanges.slice(0, 8),
    handleBackToTitle: (source.match(/const handleBackToTitle/g) || []).length,
    selectedBgm: (source.match(/const selectedBgm = unobtained/g) || []).length,
  };
  console.log(JSON.stringify(stats, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
