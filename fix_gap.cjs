const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, 'src/App.jsx');
let s = fs.readFileSync(APP, 'utf8');

const handleKeyDownTail = `              setGachaState('ready');
              checkAchievements('clear');
            } else {
              let pts = 100;
              if (difficulty === 'very_hard') pts = 1000;
              else if (difficulty === 'hard') pts = 500;
              else if (difficulty === 'normal') pts = 200;
              else if (difficulty === 'alphabet_quiz') pts = 50;

              if (difficulty !== 'easy' && difficulty !== 'alphabet_quiz') {
                if (missCount === 0) {
                  pts = pts * 2;
                } else if (missCount <= 3) {
                  pts = pts + 100;
                }
              }

              if (!assistSettings.keyboardHighlight) pts += 100;
              if (!assistSettings.showRomajiHint) pts += 100;
              setEarnedPoints(pts);
              setClearStep(0);
              setGachaState('point_reward');
              setTimeout(() => setClearStep(1), 900);
              setTimeout(() => {
                setClearStep(2);
                addPoints(pts);
                checkAchievements('clear', { points: points + pts });
                playSE('points');
              }, 1800);
            }
          } else {
            setWordIndex((prev) => prev + 1);
            setTypedChars('');
          }
          setMissCount(0);
          setIsTransitioning(false);
        };

        playSE('wordClear');
        setTimeout(proceedToNext, 350);
      }
    } else {
      setMissCount((c) => c + 1);
      playSE('error');
    }
  }, [isSubEventModalOpen, isPlayerModalOpen, isAuthModalOpen, passwordChangePlayerId, isTransitioning, isAllClear, ticketReward, nextValidChars, typedChars, validRomajiList, currentWord, wordIndex, gameWords, gameMode, difficulty, missCount, assistSettings, points, playSE, spawnRandomSubEvents, checkAchievements, addPoints, setGachaState, setClearStep, setEarnedPoints, setWordIndex, setTypedChars, setIsAllClear, setTicketReward, setIsTransitioning, setMissCount]);`;

const handleSolveSubEvent = `  const handleSolveSubEvent = useCallback(async () => {
    if (!activeSubEvent) return;

    const BONUS_POINTS = 1000;
    const newPoints = points + BONUS_POINTS;
    setPoints(newPoints);
    const updates = { points: newPoints };

    const nextSolved = [...solvedSubEventIds, activeSubEvent.id];
    setSolvedSubEventIds(nextSolved);

    if (currentPlayerId) {
      await updateAndSavePlayerData(currentPlayerId, {
        ...updates,
        solvedSubEventIds: nextSolved
      });
    }

    setActiveEvents((prev) => prev.filter((e) => e.eventId !== activeSubEvent.id));
    setSubEventReward({
      name: activeSubEvent.name,
      title: activeSubEvent.title,
      rewardPoints: BONUS_POINTS,
      image: activeSubEvent.image
    });
    setIsSubEventModalOpen(false);
    setActiveSubEvent(null);
    setCurrentRallyIndex(0);
    setSubEventTypedChars('');
    playSE('clear');
  }, [activeSubEvent, points, solvedSubEventIds, currentPlayerId, updateAndSavePlayerData, playSE]);`;

const handleGiveItem = `  const handleGiveItem = useCallback(async (selectedItemName) => {
    if (!activeSubEvent || activeSubEvent.type !== 'give_item') return;

    const currentCount = collection[selectedItemName] || 0;
    if (currentCount < 1) {
      playSE('error');
      return;
    }

    const updatedCollection = { ...collection, [selectedItemName]: currentCount - 1 };
    if (updatedCollection[selectedItemName] === 0) {
      delete updatedCollection[selectedItemName];
    }
    setCollection(updatedCollection);

    let iconResetUpdate = {};
    if (currentIcon === selectedItemName && !updatedCollection[selectedItemName]) {
      setCurrentIcon(null);
      iconResetUpdate = { currentIcon: null };
    }

    const BONUS_POINTS = 1000;
    const newPoints = points + BONUS_POINTS;
    setPoints(newPoints);
    const nextSolved = [...solvedSubEventIds, activeSubEvent.id];
    setSolvedSubEventIds(nextSolved);

    if (currentPlayerId) {
      await updateAndSavePlayerData(currentPlayerId, {
        points: newPoints,
        collection: updatedCollection,
        solvedSubEventIds: nextSolved,
        ...iconResetUpdate
      });
    }

    setActiveEvents((prev) => prev.filter((e) => e.eventId !== activeSubEvent.id));
    setSubEventReward({
      name: activeSubEvent.name,
      title: activeSubEvent.title,
      rewardPoints: BONUS_POINTS,
      image: activeSubEvent.image
    });
    setIsSubEventModalOpen(false);
    setActiveSubEvent(null);
    setCurrentRallyIndex(0);
    setSubEventTypedChars('');
    setSelectedGivingItem(null);
    playSE('clear');
  }, [activeSubEvent, collection, points, solvedSubEventIds, currentPlayerId, currentIcon, updateAndSavePlayerData, playSE]);`;

const handleSubEventKeyDown = `  const handleSubEventKeyDown = useCallback((e) => {
    if (e.repeat) return;
    if (!isSubEventModalOpen || !activeSubEvent) return;
    if (activeSubEvent.type === 'typing' && !subEventSelected) return;
    if (activeSubEvent.type === 'give_item' && !selectedGivingItem) return;
    if (!/^[a-zA-Z0-9\\-\\!\\?\\,\\.]$/.test(e.key)) return;

    const inputChar = e.key.toLowerCase();
    let validRomajiList = [];
    if (activeSubEvent.type === 'typing') {
      const currentRally = activeSubEvent.rallies[currentRallyIndex];
      const manualRomaji = currentRally?.romaji || [];
      const autoRomaji = currentRally ? generateAllRomaji(currentRally.kana) : [];
      validRomajiList = [...new Set([...manualRomaji, ...autoRomaji])];
    } else if (activeSubEvent.type === 'give_item' && selectedGivingItem) {
      validRomajiList = generateAllRomaji('どうぞ');
    }

    const subEventNextValidChars = [...new Set(
      validRomajiList
        .filter((r) => r.startsWith(subEventTypedChars))
        .map((r) => r[subEventTypedChars.length])
        .filter(Boolean)
    )];

    if (!subEventNextValidChars.includes(inputChar)) {
      playSE('error');
      return;
    }

    const newTyped = subEventTypedChars + inputChar;
    setSubEventTypedChars(newTyped);
    playSE('type');

    if (validRomajiList.some((r) => r === newTyped)) {
      if (activeSubEvent.type === 'typing') {
        if (currentRallyIndex + 1 < activeSubEvent.rallies.length) {
          setCurrentRallyIndex((i) => i + 1);
          setSubEventTypedChars('');
        } else {
          handleSolveSubEvent();
        }
      } else {
        handleGiveItem(selectedGivingItem);
      }
    }
  }, [isSubEventModalOpen, activeSubEvent, subEventSelected, selectedGivingItem, currentRallyIndex, subEventTypedChars, playSE, handleSolveSubEvent, handleGiveItem]);`;

// Fix proceedToNext gap through broken handleSubEvent tail
s = s.replace(
  /if \(gameMode === 'classic'\) \{[\s\S]*?playSE\('clear'\);\n  \}, \[activeSubEvent, collection, points, specialTickets, bgmTickets, seTickets, legendTickets, solvedSubEventIds, currentPlayerId, players, updateAndSavePlayerData, playSE, currentIcon\]\);\n\n\n  \/\/ サブイベント（人助け）のキー入力ハンドラ\n  const handleSubEventKeyDown = useCallback\(\(e\) => \{[\s\S]*?const subEventNextValidChars = \[\.\.\.new Set\(\n  const handleSolveSubEvent/,
  `if (gameMode === 'classic') {\n${handleKeyDownTail}\n\n${handleSolveSubEvent}\n\n${handleGiveItem}\n\n${handleSubEventKeyDown}\n\n  const handleSolveSubEvent_PLACEHOLDER`
);

// Remove duplicate broken functions until useEffect keydown listener
s = s.replace(
  /\n  const handleSolveSubEvent_PLACEHOLDER[\s\S]*?useEffect\(\(\) => \{\n    window\.addEventListener\('keydown', handleKeyDown\);/,
  `\n\n  useEffect(() => {\n    window.addEventListener('keydown', handleKeyDown);`
);

// Remove duplicate handleSubEventKeyDown blocks if any remain before useEffect
while ((s.match(/const handleSubEventKeyDown = useCallback/g) || []).length > 1) {
  s = s.replace(
    /\n  \/\/ サブイベント（人助け）のキー入力ハンドラ\n  const handleSubEventKeyDown = useCallback[\s\S]*?const subEventNextValidChars = \[\.\.\.new Set\(\n  const handleSolveSubEvent/,
    '\n  const handleSolveSubEvent'
  );
}

fs.writeFileSync(APP, s, 'utf8');
console.log('fix_gap.cjs done, lines:', s.split('\n').length);
