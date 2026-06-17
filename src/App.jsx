import React, { useState } from 'react';
import { DEFAULT_ASSIST_SETTINGS } from './constants';
import { saveCloudPlayer } from './firebase';
import useGameAudio from './hooks/useGameAudio';
import TitleScreen from './components/TitleScreen';
import HomeScreen from './components/HomeScreen';
import TypingScreen from './components/TypingScreen';
import QuestScreen from './components/QuestScreen';
import ProfileModal from './components/ProfileModal';
import MusicShopModal from './components/MusicShopModal';
import GachaShopScreen from './components/GachaShopScreen';

export default function App() {
  const [appScreen, setAppScreen] = useState('title');
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [typingDifficulty, setTypingDifficulty] = useState('easy');
  const [assistSettings, setAssistSettings] = useState(DEFAULT_ASSIST_SETTINGS);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMusicOpen, setIsMusicOpen] = useState(false);

  const { playSE, playDecideSound, playCancelSound, resumeOnSelect, previewBgm, previewSe } =
    useGameAudio(currentPlayer, appScreen);

  const handleSelectPlayer = (player) => {
    setCurrentPlayer(player);
    setAssistSettings(player?.assistSettings || DEFAULT_ASSIST_SETTINGS);
    resumeOnSelect();
    setAppScreen('home');
  };

  const handleLogout = () => {
    setCurrentPlayer(null);
    setAppScreen('title');
  };

  const handlePlayerUpdate = async (updates) => {
    if (!currentPlayer?.id) return;
    const next = { ...currentPlayer, ...updates };
    setCurrentPlayer(next);
    await saveCloudPlayer(next.id, next);
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

  const openProfile = () => {
    playDecideSound();
    setIsProfileOpen(true);
  };

  const openMusic = () => {
    playDecideSound();
    setIsMusicOpen(true);
  };

  const openShop = () => {
    playDecideSound();
    setAppScreen('shop');
  };

  return (
    <div className="w-full min-h-screen font-sans text-gray-800 overflow-hidden relative selection:bg-sky-200">
      {appScreen === 'title' && (
        <div className="w-full min-h-screen bg-sky-50">
          <TitleScreen
            onSelectPlayer={handleSelectPlayer}
            playDecideSound={playDecideSound}
          />
        </div>
      )}

      {appScreen === 'home' && (
        <HomeScreen
          player={currentPlayer}
          assistSettings={assistSettings}
          onAssistChange={handleAssistChange}
          onStartTyping={handleStartTyping}
          onLogout={handleLogout}
          onOpenProfile={openProfile}
          onOpenMusic={openMusic}
          onOpenShop={openShop}
          playDecideSound={playDecideSound}
          playCancelSound={playCancelSound}
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
          onLogout={handleLogout}
          onOpenProfile={openProfile}
          onOpenMusic={openMusic}
          onOpenShop={openShop}
          playSE={playSE}
        />
      )}

      {appScreen === 'shop' && (
        <GachaShopScreen
          player={currentPlayer}
          onPlayerUpdate={handlePlayerUpdate}
          onBack={() => setAppScreen('home')}
          onLogout={handleLogout}
          onOpenProfile={openProfile}
          onOpenMusic={openMusic}
          playDecideSound={playDecideSound}
          playCancelSound={playCancelSound}
          playSE={playSE}
        />
      )}

      {appScreen === 'quest' && (
        <QuestScreen player={currentPlayer} onBack={() => setAppScreen('home')} />
      )}

      <ProfileModal
        isOpen={isProfileOpen}
        player={currentPlayer}
        onClose={() => setIsProfileOpen(false)}
        onPlayerUpdate={handlePlayerUpdate}
        playDecideSound={playDecideSound}
        playCancelSound={playCancelSound}
      />

      <MusicShopModal
        isOpen={isMusicOpen}
        player={currentPlayer}
        onClose={() => setIsMusicOpen(false)}
        onConfirm={handlePlayerUpdate}
        previewBgm={previewBgm}
        previewSe={previewSe}
        playDecideSound={playDecideSound}
        playCancelSound={playCancelSound}
      />
    </div>
  );
}
