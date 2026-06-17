/**
 * Surgical repairs for known corruption zones in App.jsx
 */
const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, 'src/App.jsx');

const HANDLE_ADOPT_WORD = `  const handleAdoptWord = async (request, finalDifficulty) => {
    if (!request) return;

    const adoptedData = {
      kana: request.kana,
      romaji: request.romaji,
      difficulty: finalDifficulty,
      playerName: request.playerName || 'ゲスト',
      playerId: request.playerId || null
    };

    const successAdopt = await addAdoptedWord(adoptedData);
    if (!successAdopt) {
      alert('採用に失敗しました。接続を確認してください。');
      return;
    }

    await deleteWordRequest(request.id);

    let rewardMsg = '';
    if (request.playerId) {
      const pData = await localforage.getItem('player_data_' + request.playerId);
      if (pData) {
        const newPoints = (pData.points || 0) + 1000;
        const currentUnreadAdoptions = pData.unreadAdoptions || [];
        await updateAndSavePlayerData(request.playerId, {
          points: newPoints,
          unreadAdoptions: [...currentUnreadAdoptions, request.kana]
        });
        if (currentPlayerId === request.playerId) {
          setPoints(newPoints);
        }
        rewardMsg = \`\\n\\nプレイヤー「\${request.playerName}」に1000ポイントをおくりました！\`;
      }
    }

    await loadAdoptedWords();
    if (typeof loadWordRequests === 'function') {
      await loadWordRequests();
    }
    setAdoptingRequest(null);
    alert(\`「\${request.kana}」を採用しました！\${rewardMsg}\`);
  };`;

const SYNC_CLOUD_TAIL = `          if (playersChanged) {
            await localforage.setItem('players', currentPlayers);
          }

          const currentId = await localforage.getItem('currentPlayerId');
          if (!currentId || !currentPlayers.some(p => p.id === currentId && !p.isArchived)) {
            const activePlayers = currentPlayers.filter(p => !p.isArchived);
            if (activePlayers.length > 0) {
              await localforage.setItem('currentPlayerId', activePlayers[0].id);
            } else {
              await localforage.removeItem('currentPlayerId');
            }
          }

          await loadSettings();
        } catch (error) {
          console.error('Cloud sync failed:', error);
        } finally {
          setIsSyncing(false);
        }
      };
      syncCloudData();
    } else {
      setIsSyncing(false);
    }
  }, [isPasswordAuthenticated]);

  useEffect(() => {
    loadSettings();
    loadAdoptedWords();
  }, []);

  useEffect(() => {
    if (!currentPlayerId) return;

    const sendHeartbeat = async () => {
      try {
        const pData = await localforage.getItem('player_data_' + currentPlayerId);
        const cp = players.find(p => p.id === currentPlayerId);
        if (pData && cp) {
          await saveCloudPlayer(currentPlayerId, {
            ...pData,
            name: cp.name,
            isPlaying: true,
            lastActiveTime: new Date().toISOString()
          });
        }
      } catch (e) {
        console.error('Heartbeat send failed:', e);
      }
    };
    sendHeartbeat();

    const interval = setInterval(sendHeartbeat, 15000);
    return () => clearInterval(interval);
  }, [currentPlayerId, players]);`;

let s = fs.readFileSync(APP, 'utf8');

// Ensure firebase import
if (!s.includes("from './firebase'")) {
  s = s.replace(
    /import confetti from 'canvas-confetti';\n/,
    "import confetti from 'canvas-confetti';\nimport { saveCloudData, loadCloudData, saveDeviceTransfer, loadDeviceTransfer, saveFullBackup, loadFullBackup, saveCloudPlayer, loadSingleCloudPlayer, loadAllCloudPlayers, listenToAllCloudPlayers, deleteCloudPlayer, addWordRequest, getWordRequests, deleteWordRequest, addAdoptedWord, getAdoptedWords, deleteAdoptedWord, sendGiftToCloudPlayer } from './firebase';\n"
  );
}

// useMemo for hooks used later
if (!s.includes('useMemo')) {
  s = s.replace(
    "import React, { useState, useEffect, useRef, useCallback }",
    "import React, { useState, useEffect, useRef, useCallback, useMemo }"
  );
}

// ROMAJI_TABLE from constants
if (!s.includes('ROMAJI_TABLE')) {
  s = s.replace(
    /import \{ FINGER_MAP \} from '\.\/constants';/,
    "import { FINGER_MAP, ROMAJI_TABLE } from './constants';"
  );
}

// Fix corrupted handleAdoptWord block
s = s.replace(
  /  const handleAdoptWord = async \(request, finalDifficulty\) => \{[\s\S]*?\}, \[isSubEventModalOpen, activeSubEvent, currentRallyIndex\]\);/,
  HANDLE_ADOPT_WORD
);

// Complete sync cloud useEffect and add bootstrap + heartbeat
s = s.replace(
  /(\s+await localforage\.setItem\('player_data_' \+ playerId, \{ \.\.\.data, isCloudSync: true \}\);\n\s+\}\n\s+\}\n)[\s\S]*?(\n  const doSelectPlayer = async \(playerId\) => \{)/,
  `$1\n${SYNC_CLOUD_TAIL}\n\n$2`
);

// Remove broken first doSelectPlayer stub
s = s.replace(
  /\n  const doSelectPlayer = async \(playerId\) => \{\n    sessionStartRef\.current = Date\.now\(\); \/\/ セッション開始時刻を記録\n          await saveCloudPlayer\(currentPlayerId, \{[\s\S]*?\}, \[currentPlayerId, players\]\);\n\n  const doSelectPlayer = async/,
  '\n  const doSelectPlayer = async'
);

// Close doSelectPlayer before stray typing code
s = s.replace(
  /(await checkPendingGifts\(playerId\);)\n\s+let pts = 100;[\s\S]*?setTypedChars\(''\);\n    setCustomAudio/,
  `$1\n  };\n\n  const handleCustomAudioUpload = async (type, file) => {\n    setCustomAudio`
);

// Fix broken handleCustomAudio if name wrong - check if handleCustomAudio exists
if (!s.includes('handleCustomAudioUpload')) {
  s = s.replace(
    /await checkPendingGifts\(playerId\);\n  \};\n\n  const handleCustomAudioUpload/,
    'await checkPendingGifts(playerId);\n  };\n\n  const handleAudioUpload'
  );
}

// Remove duplicate loadWordRequests / handleSendRequest blocks (keep first clean block after fix)
const dupStart = s.indexOf('  const handleDeleteRequest = async (id) => {');
const dupMid = s.indexOf('  const loadWordRequests = useCallback', dupStart + 10);
if (dupStart >= 0 && dupMid > dupStart) {
  const secondUseEffect = s.indexOf('  useEffect(() => {', dupMid);
  const thirdChunk = s.indexOf('  // リクエストをFirestoreに送信する', dupMid);
  if (thirdChunk > dupMid) {
    s = s.slice(0, dupMid) + s.slice(thirdChunk);
  }
}

// Fix broken handleDeleteRequest missing closing brace
s = s.replace(
  /(const handleDeleteRequest = async \(id\) => \{[\s\S]*?alert\('削除に失敗しました。'\);\n      \}\n    \})\n  const loadWordRequests/,
  `$1\n    }\n  };\n\n  const loadWordRequests`
);

// Fix broken handleRequestKanaChange
s = s.replace(
  /const handleRequestKanaChange = \(val\) => \{\n    setRequestKana\(val\);\n    if \(val\.trim\(\)\) \{\n      kana: requestKana\.trim\(\),[\s\S]*?setRequestRomaji\(''\);\n    \}\n  \};/,
  `const handleRequestKanaChange = (val) => {
    setRequestKana(val);
    if (val.trim()) {
      const list = generateAllRomaji(val);
      if (list && list.length > 0) {
        setRequestRomaji(list.join(' / '));
      } else {
        setRequestRomaji('');
      }
    } else {
      setRequestRomaji('');
    }
  };`
);

// Fix broken handleSendRequest missing if guard
s = s.replace(
  /const handleSendRequest = async \(e\) => \{\n    e\.preventDefault\(\);\n      alert\('「かな」と「ローマ字」は必ずいれてね！'\);/,
  `const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!requestKana.trim() || !requestRomaji.trim()) {
      alert('「かな」と「ローマ字」は必ずいれてね！');`
);

fs.writeFileSync(APP, s, 'utf8');
console.log('fix_surgical.cjs done, lines:', s.split('\n').length);
