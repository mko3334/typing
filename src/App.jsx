import React, { useState } from 'react';
import TitleScreen from './components/TitleScreen';
import HomeScreen from './components/HomeScreen';
import TypingScreen from './components/TypingScreen';
import QuestScreen from './components/QuestScreen';

export default function App() {
  const [appScreen, setAppScreen] = useState('title');
  const [currentPlayer, setCurrentPlayer] = useState(null);

  const handleSelectPlayer = (player) => {
    setCurrentPlayer(player);
    setAppScreen('home');
  };

  const handleLogout = () => {
    setCurrentPlayer(null);
    setAppScreen('title');
  };

  const handleNavigate = (screen) => {
    setAppScreen(screen);
  };

  return (
    <div className="w-full min-h-screen font-sans bg-sky-50 text-gray-800 overflow-hidden relative selection:bg-sky-200">
      {appScreen === 'title' && (
        <TitleScreen onSelectPlayer={handleSelectPlayer} />
      )}
      
      {appScreen === 'home' && (
        <HomeScreen 
          player={currentPlayer} 
          onNavigate={handleNavigate} 
          onLogout={handleLogout} 
        />
      )}

      {/* Placeholders for other screens */}
      {appScreen === 'typing' && (
        <TypingScreen player={currentPlayer} onBack={() => setAppScreen('home')} />
      )}
      {appScreen === 'quest' && (
        <QuestScreen player={currentPlayer} onBack={() => setAppScreen('home')} />
      )}
    </div>
  );
}
