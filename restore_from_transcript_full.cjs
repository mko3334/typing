/**
 * Reconstruct src/App.jsx from transcript_full VIEW_FILE snapshots (7133-line era).
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
const COMPONENT_START = 739;
const MAX_LINE = 7133;

const BAD =
  /reconstructedLines|transcriptPath|matchesCount|fs\.writeFileSync|extract_history|restore_app|path\.join|### |^---$|検証結果|lineNumbers|outputPath|reconstruct\(|^- |^\+ |^\s*-\s*\[[ x]\]|walkthrough|ビルド・デプロイ|タスクリスト|diff_block|Please note that the above|Transformation completed|console\.log\("Transformation/;

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
  if (!text) return true;
  if (BAD.test(text)) return true;
  if (/^\s+origin:\s*\{/.test(text)) return true;
  if (/^\s+colors:\s*\[/.test(text)) return true;
  if (/^\s+spread:/.test(text)) return true;
  if (/const isExistInCloud = cloudPlayersMap/.test(text)) return false;
  if (/await localforage/.test(text) && !/^\s*(const|let|var|if|return|await update|await auto|for|while)/.test(text))
    return true;
  return false;
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
    if (total < 7000) continue;

    const from = Number(rangeM[1]);
    const to = Number(rangeM[2]);
    const start = content.indexOf(MARKER);
    if (start < 0) continue;

    let section = content.slice(start);
    const end = section.indexOf('The above content');
    if (end > 0) section = section.slice(0, end);

    const score = total * 1e9 + parsed.step_index;

    for (const raw of section.split('\n')) {
      const lm = raw.match(LINE_RE);
      if (!lm) continue;
      const n = Number(lm[1]);
      const text = lm[2];
      if (n < COMPONENT_START || n < from || n > to || isBadLine(text)) continue;

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

async function main() {
  const merged = await loadTranscriptMerge();
  const componentLines = [];
  let filled = 0;
  let missing = 0;

  for (let i = COMPONENT_START; i <= MAX_LINE; i++) {
    const t = merged.get(i);
    if (t && !isBadLine(t.text)) {
      componentLines.push(t.text);
      filled++;
    } else {
      componentLines.push('');
      missing++;
    }
  }

  while (componentLines.length && componentLines[componentLines.length - 1] === '') {
    componentLines.pop();
    missing--;
  }

  let source = [...buildPreamble(), ...componentLines].join('\n');
  source = source.replace(/\};onst /g, '};\n\n  const ');

  const endMatch = source.match(/\n    <\/div>\n  \);\n}\n/);
  if (endMatch) {
    const idx = source.indexOf(endMatch[0]) + endMatch[0].length;
    if (source.slice(idx).trim()) source = source.slice(0, idx);
  }

  fs.writeFileSync(OUT_PATH, source, 'utf8');
  console.log(JSON.stringify({ outputLines: source.split('\n').length, filled, missing }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
