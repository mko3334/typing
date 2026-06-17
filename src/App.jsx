import React, { useState, useRef, useEffect, useCallback } from 'react';
import localforage from 'localforage';
import { DEFAULT_ASSIST_SETTINGS } from './constants';
import { loadSingleCloudPlayer, saveCloudPlayer } from './firebase';
import { enrichPlayer } from './utils/player';
import { computeSessionUpdates } from './utils/playTime';
import useGameAudio from './hooks/useGameAudio';
import TitleScreen from './components/TitleScreen';
import HomeScreen from './components/HomeScreen';
import TypingScreen from './components/TypingScreen';
import QuestScreen from './components/QuestScreen';
import ProfileModal from './components/ProfileModal';
import MusicShopModal from './components/MusicShopModal';
import GachaShopScreen from './components/GachaShopScreen';
import ZukanModal from './components/ZukanModal';
import SaveCompleteModal, { SaveLoadingOverlay } from './components/SaveCompleteModal';
import GiftRewardModal from './components/GiftRewardModal';
import TitlePasswordGate, { isTitleAccessGranted } from './components/TitlePasswordGate';

export default function App() {
  const [appScreen, setAppScreen] = useState('title');
  const [isTitleUnlocked, setIsTitleUnlocked] = useState(isTitleAccessGranted);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [typingDifficulty, setTypingDifficulty] = useState('easy');
  const [assistSettings, setAssistSettings] = useState(DEFAULT_ASSIST_SETTINGS);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isZukanOpen, setIsZukanOpen] = useState(false);
  const [profileFocus, setProfileFocus] = useState(null);
  const [musicModalFocus, setMusicModalFocus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedPlayerPreview, setSavedPlayerPreview] = useState(null);
  const [activeGift, setActiveGift] = useState(null);
  const currentPlayerRef = useRef(currentPlayer);
  const assistSettingsRef = useRef(assistSettings);
  const sessionStartRef = useRef(null);

  useEffect(() => {
    currentPlayerRef.current = currentPlayer;
  }, [currentPlayer]);

  useEffect(() => {
    assistSettingsRef.current = assistSettings;
  }, [assistSettings]);

  const { playSE, playDecideSound, playCancelSound, resumeOnSelect, previewBgm, previewSe } =
    useGameAudio(currentPlayer, appScreen);

  const applySessionPlayTime = useCallback((player) => {
    const updates = computeSessionUpdates(player, sessionStartRef.current);
    sessionStartRef.current = null;
    if (!updates) return player;
    return { ...player, ...updates };
  }, []);

  const syncPendingGifts = useCallback(async (player) => {
    const cloudData = await loadSingleCloudPlayer(player.id);
    const pendingGifts = Array.isArray(cloudData?.pendingGifts)
      ? cloudData.pendingGifts
      : player.pendingGifts || [];
    return { ...player, pendingGifts };
  }, []);

  const showNextGift = useCallback((player) => {
    const pendingGifts = player.pendingGifts || [];
    if (pendingGifts.length > 0) {
      setActiveGift(pendingGifts[0]);
    } else {
      setActiveGift(null);
    }
  }, []);

  const handleSelectPlayer = async (player) => {
    const lastPlayedAt = new Date().toISOString();
    let next = { ...player, lastPlayedAt };
    next = await syncPendingGifts(next);
    currentPlayerRef.current = next;
    setCurrentPlayer(next);
    setAssistSettings(next?.assistSettings || DEFAULT_ASSIST_SETTINGS);
    sessionStartRef.current = Date.now();
    resumeOnSelect();
    setAppScreen('home');
    saveCloudPlayer(next.id, next).catch(() => {});
    showNextGift(next);
  };

  const handleAcceptGift = useCallback(async () => {
    const prev = currentPlayerRef.current;
    if (!prev?.id || !activeGift) return;

    const remainingGifts = (prev.pendingGifts || []).filter((g) => g.id !== activeGift.id);
    const next = {
      ...prev,
      points: (prev.points || 0) + (activeGift.points || 0),
      specialTickets: (prev.specialTickets || 0) + (activeGift.specialTickets || 0),
      bgmTickets: (prev.bgmTickets || 0) + (activeGift.bgmTickets || 0),
      seTickets: (prev.seTickets || 0) + (activeGift.seTickets || 0),
      legendTickets: (prev.legendTickets || 0) + (activeGift.legendTickets || 0),
      pendingGifts: remainingGifts,
    };
    currentPlayerRef.current = next;
    setCurrentPlayer(next);
    await saveCloudPlayer(next.id, next);
    localforage.setItem('player_data_' + next.id, { ...next, isCloudSync: true }).catch(() => {});

    if (remainingGifts.length > 0) {
      setActiveGift(remainingGifts[0]);
    } else {
      setActiveGift(null);
    }
  }, [activeGift]);

  const handleLogout = useCallback(async () => {
    const prev = currentPlayerRef.current;
    if (prev?.id) {
      const withPlayTime = applySessionPlayTime(prev);
      if (withPlayTime !== prev) {
        currentPlayerRef.current = withPlayTime;
        await saveCloudPlayer(withPlayTime.id, withPlayTime);
      }
    }
    sessionStartRef.current = null;
    currentPlayerRef.current = null;
    setCurrentPlayer(null);
    setActiveGift(null);
    setAppScreen('title');
  }, [applySessionPlayTime]);

  const handlePlayerUpdate = useCallback(async (updates) => {
    const prev = currentPlayerRef.current;
    if (!prev?.id) return;
    const next = { ...prev, ...updates };
    currentPlayerRef.current = next;
    setCurrentPlayer(next);
    await saveCloudPlayer(next.id, next);
  }, []);

  const handleSaveAndTitle = useCallback(async (updates = {}) => {
    const prev = currentPlayerRef.current;
    if (!prev?.id) return;

    setIsSaving(true);
    let merged = { ...prev, ...updates };
    merged = applySessionPlayTime(merged);
    const next = {
      ...merged,
      assistSettings: updates.assistSettings ?? assistSettingsRef.current,
      lastPlayedAt: new Date().toISOString(),
    };
    currentPlayerRef.current = next;
    setCurrentPlayer(next);

    try {
      const success = await saveCloudPlayer(next.id, next);
      if (!success) {
        throw new Error('save failed');
      }
      await localforage.setItem('player_data_' + next.id, { ...next, isCloudSync: true });
      setSavedPlayerPreview(enrichPlayer(next.id, next));
    } catch {
      alert('クラウドへのセーブに失敗しました。インターネット接続を確認してね。');
    } finally {
      setIsSaving(false);
    }
  }, [applySessionPlayTime]);

  const handleSaveCompleteOk = () => {
    playDecideSound();
    setSavedPlayerPreview(null);
    handleLogout();
  };

  const handleAssistChange = (key, value) => {
    const next = { ...assistSettings, [key]: value };
    setAssistSettings(next);
    handlePlayerUpdate({ assistSettings: next });
  };

  const handleStartTyping = (difficulty) => {
    setTypingDifficulty(difficulty);
    handlePlayerUpdate({ difficulty });
    setAppScreen('typing');
  };

  const openProfile = (focus) => {
    playDecideSound();
    setProfileFocus(focus || null);
    setIsProfileOpen(true);
  };

  const openMusic = (focus) => {
    playDecideSound();
    setMusicModalFocus(focus || null);
    setIsMusicOpen(true);
  };

  const openShop = () => {
    playDecideSound();
    setAppScreen('shop');
  };

  const openZukan = () => {
    playDecideSound();
    setIsZukanOpen(true);
  };

  return (
    <div className="w-full min-h-screen font-sans text-gray-800 overflow-hidden relative selection:bg-sky-200">
      {appScreen === 'title' && (
        <div className="w-full h-[100dvh] min-h-0 overflow-hidden">
          {isTitleUnlocked ? (
            <TitleScreen
              onSelectPlayer={handleSelectPlayer}
              playDecideSound={playDecideSound}
            />
          ) : (
            <TitlePasswordGate
              onUnlock={() => setIsTitleUnlocked(true)}
              playDecideSound={playDecideSound}
            />
          )}
        </div>
      )}

      {appScreen === 'home' && (
        <HomeScreen
          player={currentPlayer}
          assistSettings={assistSettings}
          onAssistChange={handleAssistChange}
          onStartTyping={handleStartTyping}
          onSaveAndTitle={handleSaveAndTitle}
          onOpenProfile={openProfile}
          onOpenMusic={openMusic}
          onOpenShop={openShop}
          onOpenZukan={openZukan}
          onPlayerUpdate={handlePlayerUpdate}
          playDecideSound={playDecideSound}
          playCancelSound={playCancelSound}
          playSE={playSE}
        />
      )}

      {appScreen === 'typing' && (
        <TypingScreen
          player={currentPlayer}
          difficulty={typingDifficulty}
          assistSettings={assistSettings}
          onAssistChange={handleAssistChange}
          onPlayerUpdate={handlePlayerUpdate}
          onBack={() => setAppScreen('home')}
          onSaveAndTitle={handleSaveAndTitle}
          onOpenProfile={openProfile}
          onOpenMusic={openMusic}
          onOpenShop={openShop}
          onOpenZukan={openZukan}
          playSE={playSE}
        />
      )}

      {appScreen === 'shop' && (
        <GachaShopScreen
          player={currentPlayer}
          onPlayerUpdate={handlePlayerUpdate}
          onBack={() => setAppScreen('home')}
          onSaveAndTitle={handleSaveAndTitle}
          onOpenProfile={openProfile}
          onOpenMusic={openMusic}
          onOpenZukan={openZukan}
          playDecideSound={playDecideSound}
          playCancelSound={playCancelSound}
          playSE={playSE}
          previewBgm={previewBgm}
          previewSe={previewSe}
        />
      )}

      {appScreen === 'quest' && (
        <QuestScreen player={currentPlayer} onBack={() => setAppScreen('home')} />
      )}

      <ProfileModal
        isOpen={isProfileOpen}
        player={currentPlayer}
        onClose={() => {
          setIsProfileOpen(false);
          setProfileFocus(null);
        }}
        onPlayerUpdate={handlePlayerUpdate}
        playDecideSound={playDecideSound}
        playCancelSound={playCancelSound}
        highlightBackgroundId={profileFocus?.backgroundId}
      />

      <MusicShopModal
        isOpen={isMusicOpen}
        player={currentPlayer}
        onClose={() => {
          setIsMusicOpen(false);
          setMusicModalFocus(null);
        }}
        onConfirm={handlePlayerUpdate}
        previewBgm={previewBgm}
        previewSe={previewSe}
        playDecideSound={playDecideSound}
        playCancelSound={playCancelSound}
        initialBgmId={musicModalFocus?.bgmId}
        initialSeId={musicModalFocus?.seId}
      />

      <ZukanModal
        isOpen={isZukanOpen}
        player={currentPlayer}
        onClose={() => setIsZukanOpen(false)}
        playDecideSound={playDecideSound}
        playCancelSound={playCancelSound}
      />

      {isSaving && <SaveLoadingOverlay />}
      <SaveCompleteModal player={savedPlayerPreview} onConfirm={handleSaveCompleteOk} />
      {activeGift && appScreen !== 'title' && (
        <GiftRewardModal
          gift={activeGift}
          onAccept={handleAcceptGift}
          playDecideSound={playDecideSound}
        />
      )}
    </div>
  );
}
