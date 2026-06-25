import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { DEFAULT_ASSIST_SETTINGS } from './constants';
import { listenToAnnouncements, loadSingleCloudPlayer, markAnnouncementReadForPlayer, saveCloudPlayer } from './firebase';
import { enrichPlayer } from './utils/player';
import { computeSessionUpdates } from './utils/playTime';
import { persistPlayerLocally, withTimeout } from './utils/playerStorage';
import {
  buildClearPlayingSessionPatch,
  buildPlayingSessionPatch,
  HEARTBEAT_INTERVAL_MS,
} from './utils/playerSession';
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
import AnnouncementModal from './components/AnnouncementModal';
import AnnouncementPanel from './components/AnnouncementPanel';
import HiraganaTypingScreen from './components/HiraganaTypingScreen';
import TitlePasswordGate, { isTitleAccessGranted } from './components/TitlePasswordGate';
import { CRITICAL_IMAGE_URLS, preloadImages } from './utils/assetImages';
import {
  buildGiftUpdatesFromAnnouncement,
  getUnreadPopupQueue,
  partitionAnnouncementsForPlayer,
} from './utils/announcements';

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
  const [announcements, setAnnouncements] = useState([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);
  const [isAnnouncementPanelOpen, setIsAnnouncementPanelOpen] = useState(false);
  const currentPlayerRef = useRef(currentPlayer);
  const assistSettingsRef = useRef(assistSettings);
  const sessionStartRef = useRef(null);

  useEffect(() => {
    currentPlayerRef.current = currentPlayer;
  }, [currentPlayer]);

  useEffect(() => {
    assistSettingsRef.current = assistSettings;
  }, [assistSettings]);

  useEffect(() => {
    preloadImages(CRITICAL_IMAGE_URLS);
  }, []);

  const { playSE, playDecideSound, playCancelSound, resumeOnSelect, previewBgm, previewSe } =
    useGameAudio(currentPlayer, appScreen);

  const applySessionPlayTime = useCallback((player) => {
    const updates = computeSessionUpdates(player, sessionStartRef.current);
    sessionStartRef.current = null;
    if (!updates) return player;
    return { ...player, ...updates };
  }, []);

  const syncPendingGifts = useCallback(async (player) => {
    const cloudData = await withTimeout(loadSingleCloudPlayer(player.id), 8000, null);
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

  const announcementPartition = useMemo(
    () => partitionAnnouncementsForPlayer(announcements, currentPlayer),
    [announcements, currentPlayer],
  );

  const hasUnreadAnnouncements =
    announcementPartition.unreadPersonal.length + announcementPartition.unreadBroadcast.length > 0;

  useEffect(() => {
    if (!currentPlayer?.id || appScreen === 'title') {
      setAnnouncements([]);
      return undefined;
    }
    const unsub = listenToAnnouncements(setAnnouncements);
    return unsub;
  }, [currentPlayer?.id, appScreen]);

  const handleReadAnnouncement = useCallback(async (announcement) => {
    const prev = currentPlayerRef.current;
    if (!prev?.id || !announcement?.id) return;
    if ((prev.readAnnouncementIds || []).includes(announcement.id)) return;

    const giftUpdates = buildGiftUpdatesFromAnnouncement(prev, announcement);
    const readIds = await markAnnouncementReadForPlayer(
      prev.id,
      announcement.id,
      prev.readAnnouncementIds,
    );
    if (!readIds) return;

    const next = {
      ...prev,
      ...giftUpdates,
      readAnnouncementIds: readIds,
    };
    currentPlayerRef.current = next;
    setCurrentPlayer(next);
    saveCloudPlayer(next.id, next).catch(() => {});
    persistPlayerLocally(next.id, next).catch(() => {});
  }, []);

  useEffect(() => {
    if (appScreen === 'title' || !currentPlayer?.id) {
      setActiveAnnouncement(null);
      setIsAnnouncementPanelOpen(false);
    }
  }, [appScreen, currentPlayer?.id]);

  useEffect(() => {
    if (appScreen !== 'home' || !currentPlayer?.id) return;
    if (activeGift || isAnnouncementPanelOpen || activeAnnouncement) return;
    const queue = getUnreadPopupQueue(announcements, currentPlayer);
    if (queue.length > 0) {
      setActiveAnnouncement(queue[0]);
    }
  }, [
    appScreen,
    currentPlayer,
    announcements,
    activeGift,
    isAnnouncementPanelOpen,
    activeAnnouncement,
  ]);

  const handleCloseAnnouncementPopup = useCallback(async () => {
    const ann = activeAnnouncement;
    if (!ann) return;
    await handleReadAnnouncement(ann);
    setActiveAnnouncement(null);
  }, [activeAnnouncement, handleReadAnnouncement]);

  const openAnnouncements = useCallback(() => {
    playDecideSound();
    setIsAnnouncementPanelOpen(true);
  }, [playDecideSound]);

  const handleSelectPlayer = (player) => {
    if (!player?.id) return;

    const lastPlayedAt = new Date().toISOString();
    const next = {
      ...player,
      lastPlayedAt,
      ...buildPlayingSessionPatch(),
    };

    currentPlayerRef.current = next;
    setCurrentPlayer(next);
    setAssistSettings(next?.assistSettings || DEFAULT_ASSIST_SETTINGS);
    sessionStartRef.current = Date.now();
    resumeOnSelect();
    setAppScreen('home');
    showNextGift(next);

    persistPlayerLocally(next.id, next).catch((error) => {
      console.error('persistPlayerLocally:', error);
    });
    saveCloudPlayer(next.id, next).catch(() => {});
    syncPendingGifts(next).then((synced) => {
      const syncedWithSession = {
        ...synced,
        ...buildPlayingSessionPatch(),
        readAnnouncementIds: synced.readAnnouncementIds || next.readAnnouncementIds || [],
      };
      currentPlayerRef.current = syncedWithSession;
      setCurrentPlayer(syncedWithSession);
      persistPlayerLocally(syncedWithSession.id, syncedWithSession).catch(() => {});
      saveCloudPlayer(syncedWithSession.id, syncedWithSession).catch(() => {});
      showNextGift(syncedWithSession);
    });
  };

  useEffect(() => {
    if (appScreen === 'title' || !currentPlayer?.id) return undefined;

    const sendHeartbeat = () => {
      const prev = currentPlayerRef.current;
      if (!prev?.id) return;
      const patch = buildPlayingSessionPatch();
      const next = { ...prev, ...patch };
      currentPlayerRef.current = next;
      setCurrentPlayer(next);
      saveCloudPlayer(prev.id, next).catch(() => {});
      persistPlayerLocally(prev.id, next).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [appScreen, currentPlayer?.id]);

  useEffect(() => {
    if (appScreen === 'title' || !currentPlayer?.id) return undefined;

    const releaseSession = () => {
      const prev = currentPlayerRef.current;
      if (!prev?.id) return;
      const next = {
        ...prev,
        ...buildClearPlayingSessionPatch(),
        lastUpdatedAt: new Date().toISOString(),
      };
      currentPlayerRef.current = next;
      persistPlayerLocally(prev.id, next).catch(() => {});
      saveCloudPlayer(prev.id, next).catch(() => {});
    };

    window.addEventListener('pagehide', releaseSession);
    return () => window.removeEventListener('pagehide', releaseSession);
  }, [appScreen, currentPlayer?.id]);

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
    await persistPlayerLocally(next.id, { ...next, isCloudSync: true });

    if (remainingGifts.length > 0) {
      setActiveGift(remainingGifts[0]);
    } else {
      setActiveGift(null);
    }
  }, [activeGift]);

  const handleLogout = useCallback(async () => {
    const prev = currentPlayerRef.current;
    if (prev?.id) {
      let next = applySessionPlayTime(prev);
      next = {
        ...next,
        ...buildClearPlayingSessionPatch(),
        lastUpdatedAt: new Date().toISOString(),
      };
      currentPlayerRef.current = next;
      await saveCloudPlayer(next.id, next);
      await persistPlayerLocally(next.id, next);
    }
    sessionStartRef.current = null;
    currentPlayerRef.current = null;
    setCurrentPlayer(null);
    setActiveGift(null);
    setAppScreen('title');
  }, [applySessionPlayTime]);

  const handlePlayerUpdate = useCallback((updates) => {
    const prev = currentPlayerRef.current;
    if (!prev?.id) return;
    const next = { ...prev, ...updates };
    currentPlayerRef.current = next;
    setCurrentPlayer(next);
    saveCloudPlayer(next.id, next).catch(() => {});
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
      lastUpdatedAt: new Date().toISOString(),
      ...buildClearPlayingSessionPatch(),
    };
    currentPlayerRef.current = next;
    setCurrentPlayer(next);

    try {
      await persistPlayerLocally(next.id, next);
      const success = await withTimeout(saveCloudPlayer(next.id, next), 12000, false);
      setSavedPlayerPreview(enrichPlayer(next.id, next));
      if (!success) {
        alert('この端末には セーブしました。クラウドへの 送信は 後でもう一度 試してね。');
      }
    } catch {
      alert('セーブに 失敗しました。もう一度 試してね。');
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

  const openHiragana = () => {
    playDecideSound();
    setAppScreen('hiragana');
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
          onOpenHiragana={openHiragana}
          onOpenAnnouncements={openAnnouncements}
          announcementUnread={hasUnreadAnnouncements}
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
          onOpenAnnouncements={openAnnouncements}
          announcementUnread={hasUnreadAnnouncements}
          playSE={playSE}
        />
      )}

      {appScreen === 'hiragana' && (
        <HiraganaTypingScreen
          player={currentPlayer}
          assistSettings={assistSettings}
          onAssistChange={handleAssistChange}
          onPlayerUpdate={handlePlayerUpdate}
          onBack={() => setAppScreen('home')}
          onSaveAndTitle={handleSaveAndTitle}
          onOpenProfile={openProfile}
          onOpenMusic={openMusic}
          onOpenShop={openShop}
          onOpenZukan={openZukan}
          onOpenAnnouncements={openAnnouncements}
          announcementUnread={hasUnreadAnnouncements}
          playDecideSound={playDecideSound}
          playCancelSound={playCancelSound}
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
          onOpenAnnouncements={openAnnouncements}
          announcementUnread={hasUnreadAnnouncements}
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

      {activeAnnouncement && !isAnnouncementPanelOpen && appScreen !== 'title' && (
        <AnnouncementModal
          announcement={activeAnnouncement}
          isRead={activeAnnouncement.isRead === true}
          mode="popup"
          playDecideSound={playDecideSound}
          onClose={handleCloseAnnouncementPopup}
        />
      )}

      {isAnnouncementPanelOpen && currentPlayer && appScreen !== 'title' && (
        <AnnouncementPanel
          player={currentPlayer}
          announcements={announcements}
          playDecideSound={playDecideSound}
          playCancelSound={playCancelSound}
          onReadAnnouncement={handleReadAnnouncement}
          onClose={() => {
            playCancelSound();
            setIsAnnouncementPanelOpen(false);
          }}
        />
      )}
    </div>
  );
}
