/**
 * Post-process restored App.jsx: remove merge artifacts, dedupe state, patch core functions.
 */
const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, 'src/App.jsx');
const BROKEN = path.join(__dirname, 'src/App.jsx.broken');

const UPDATE_FN = `  const updateAndSavePlayerData = async (playerId, updates) => {
    if (!playerId) return;
    const currentData = await localforage.getItem('player_data_' + playerId) || {};
    const nowIso = new Date().toISOString();
    const newData = { ...currentData, ...updates, lastUpdatedAt: nowIso };
    await localforage.setItem('player_data_' + playerId, newData);

    let nextPlayersState = null;
    setPlayers((prev) => {
      const updated = prev.map((p) => {
        if (p.id === playerId) {
          const nextP = { ...p };
          if (updates.points !== undefined) nextP.points = updates.points;
          if (updates.collection !== undefined) {
            nextP.collectionCount = Object.keys(updates.collection).length;
            nextP.collection = updates.collection;
          }
          if (updates.newItems !== undefined) nextP.newItems = updates.newItems;
          if (updates.achievements !== undefined) nextP.achievements = updates.achievements;
          if (updates.currentTitle !== undefined) nextP.currentTitle = updates.currentTitle;
          if (updates.currentIcon !== undefined) nextP.currentIcon = updates.currentIcon;
          if (updates.backgrounds !== undefined) nextP.backgrounds = updates.backgrounds;
          if (updates.currentBackground !== undefined) nextP.currentBackground = updates.currentBackground;
          if (updates.specialTickets !== undefined) nextP.specialTickets = updates.specialTickets;
          if (updates.legendTickets !== undefined) nextP.legendTickets = updates.legendTickets;
          if (updates.bgmTickets !== undefined) nextP.bgmTickets = updates.bgmTickets;
          if (updates.seTickets !== undefined) nextP.seTickets = updates.seTickets;
          if (updates.unlockedBgms !== undefined) nextP.unlockedBgms = updates.unlockedBgms;
          if (updates.currentBgm !== undefined) nextP.currentBgm = updates.currentBgm;
          if (updates.unlockedSes !== undefined) nextP.unlockedSes = updates.unlockedSes;
          if (updates.currentSe !== undefined) nextP.currentSe = updates.currentSe;
          if (updates.cloudId !== undefined) nextP.cloudId = updates.cloudId;
          if (updates.playCount !== undefined) nextP.playCount = updates.playCount;
          if (updates.specialWordTriggered !== undefined) nextP.specialWordTriggered = updates.specialWordTriggered;
          if (updates.isArchived !== undefined) nextP.isArchived = updates.isArchived;
          if (updates.recentPlays !== undefined) nextP.recentPlays = updates.recentPlays;
          if (updates.totalPlayMs !== undefined) nextP.totalPlayMs = updates.totalPlayMs;
          if (updates.sessionCount !== undefined) nextP.sessionCount = updates.sessionCount;
          if (updates.mallLayout !== undefined) nextP.mallLayout = updates.mallLayout;
          if (updates.unlockedShops !== undefined) nextP.unlockedShops = updates.unlockedShops;
          nextP.isCloudSync = updates.isCloudSync !== undefined ? updates.isCloudSync : false;
          nextP.hasPassword = false;
          return nextP;
        }
        return p;
      });
      nextPlayersState = updated;
      return updated;
    });

    if (nextPlayersState) {
      await localforage.setItem(
        'players',
        nextPlayersState.map(({ id, name, isCloudSync, isArchived }) => ({
          id,
          name,
          isCloudSync,
          isArchived: isArchived || false,
        }))
      );
    }

    await autoSaveToCloud(playerId);
  };`;

const TRIGGER_CONFETTI = `  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0ea5e9', '#facc15', '#f43f5e', '#10b981'],
    });
  }, []);`;

function isOrphanFragment(line) {
  if (/^\s{6,}if \(updates\./.test(line)) return true;
  if (/^\s+origin:\s*\{/.test(line)) return true;
  if (/^\s+spread:\s*\d/.test(line)) return true;
  if (/^\s+colors:\s*\[/.test(line)) return true;
  if (/^\s+particleCount:\s*\d/.test(line)) return true;
  if (/^\s*\}\), \[\]\);$/.test(line)) return true;
  if (/^\s*const pList = await localforage/.test(line)) return true;
  if (/^\s*const nowIso = new Date/.test(line)) return true;
  if (/^\s*const newData = \{/.test(line)) return true;
  if (/^\s*if \(p\.id === playerId\)/.test(line)) return true;
  return false;
}

function dedupeUseState(lines) {
  const seen = new Set();
  const out = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    const m = line.match(/const \[(\w+),/);
    if (m) {
      if (seen.has(m[1])) continue;
      seen.add(m[1]);
    }
    out.unshift(line);
  }
  return out;
}

function fixTruncatedUseState(line) {
  if (/const \[requestTabInputPassword, setRequestTabInputPassword\]\s*$/.test(line)) {
    return line + " = useState('');";
  }
  if (/const \[shopRewards, setShopRewards\]\s*$/.test(line)) {
    return line + ' = useState([]);';
  }
  if (/const \[inputMasterCode, setInputMasterCode\]/.test(line) && !line.includes('useState')) {
    return "  const [inputMasterCode, setInputMasterCode] = useState('');";
  }
  return line;
}

function replaceBetween(source, startMarker, endMarker, replacement) {
  const start = source.indexOf(startMarker);
  if (start < 0) return source;
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (end < 0) return source;
  return source.slice(0, start) + replacement + source.slice(end);
}

function removeAllUpdateFns(source) {
  let s = source;
  while (s.includes('const updateAndSavePlayerData = async')) {
    const start = s.indexOf('const updateAndSavePlayerData = async');
    let depth = 0;
    let i = start;
    let found = false;
    for (; i < s.length; i++) {
      if (s[i] === '{') {
        depth++;
        found = true;
      } else if (s[i] === '}') {
        depth--;
        if (found && depth === 0) {
          i++;
          while (s[i] === ' ' || s[i] === '\n') i++;
          if (s[i] === ';') i++;
          break;
        }
      }
    }
    s = s.slice(0, start) + '/* removed duplicate updateAndSavePlayerData */' + s.slice(i);
  }
  return s;
}

function removeBrokenTriggerConfetti(source) {
  let s = source;
  while (s.includes('const triggerConfetti = useCallback')) {
    const start = s.indexOf('const triggerConfetti = useCallback');
    const end = s.indexOf('}, []);', start);
    if (end < 0) break;
    s = s.slice(0, start) + '/* removed broken triggerConfetti */' + s.slice(end + 7);
  }
  return s;
}

function main() {
  let lines = fs.readFileSync(APP, 'utf8').split('\n');
  lines = lines.filter((l) => !isOrphanFragment(l));
  lines = lines.map(fixTruncatedUseState);

  const exportIdx = lines.findIndex((l) => l.includes('export default function App'));
  if (exportIdx >= 0) {
    const body = dedupeUseState(lines.slice(exportIdx + 1));
    lines = [...lines.slice(0, exportIdx + 1), ...body];
  }

  let source = lines.join('\n');
  source = source.replace(/\};onst /g, '};\n\n  const ');
  source = removeAllUpdateFns(source);
  source = removeBrokenTriggerConfetti(source);

  const insertAfter = source.indexOf('const bgmRef = useRef(null);');
  if (insertAfter >= 0) {
    const pos = source.indexOf('\n', insertAfter) + 1;
    source = source.slice(0, pos) + '\n' + TRIGGER_CONFETTI + '\n\n' + UPDATE_FN + '\n' + source.slice(pos);
  }

  source = source.replace(/\/\* removed duplicate updateAndSavePlayerData \*\//g, '');
  source = source.replace(/\/\* removed broken triggerConfetti \*\//g, '');

  // Remove duplicate export default if any
  const parts = source.split('export default function App');
  if (parts.length > 2) {
    source = parts[0] + 'export default function App' + parts[1];
  }

  fs.writeFileSync(APP, source, 'utf8');
  console.log('repair_app.cjs done, lines:', source.split('\n').length);
}

main();
