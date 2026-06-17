import { useState, useEffect, useRef, useCallback } from 'react';
import localforage from 'localforage';
import {
  DEFAULT_VOLUME,
  initAudio,
  playBgm,
  playSE,
  playDecideSound,
  playCancelSound,
  stopBgm,
} from '../audio';

export default function useGameAudio(player, appScreen) {
  const bgmRef = useRef(null);
  const [customAudio, setCustomAudio] = useState({
    bgm: null,
    type: null,
    error: null,
    wordClear: null,
    allClear: null,
  });
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  useEffect(() => {
    (async () => {
      const savedAudio = await localforage.getItem('customAudio');
      if (savedAudio) setCustomAudio(savedAudio);
      const savedVolume = await localforage.getItem('volume');
      if (savedVolume) setVolume(savedVolume);
    })();
  }, []);

  useEffect(() => {
    if (!bgmRef.current) {
      bgmRef.current = new Audio('/sounds/BGM.mp3');
      bgmRef.current.preload = 'auto';
      bgmRef.current.loop = true;
      bgmRef.current.load();
    }
  }, []);

  useEffect(() => {
    if (bgmRef.current) {
      bgmRef.current.volume = volume.bgm ?? DEFAULT_VOLUME.bgm;
    }
  }, [volume.bgm]);

  const currentBgm = player?.currentBgm || 'default';
  const currentSe = player?.currentSe || 'default';

  useEffect(() => {
    if (appScreen === 'title') {
      stopBgm(bgmRef);
      return;
    }
    if (appScreen === 'home' || appScreen === 'typing' || appScreen === 'shop') {
      playBgm(currentBgm, { customAudio, volume, bgmRef });
    }
  }, [appScreen, currentBgm, customAudio, volume]);

  useEffect(() => {
    const unlock = () => {
      initAudio();
      if (appScreen !== 'title' && bgmRef.current?.paused) {
        bgmRef.current.play().catch(() => {});
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [appScreen]);

  const audioOptions = { customAudio, volume, currentSe, bgmRef };

  const playGameSE = useCallback(
    (type) => {
      playSE(type, audioOptions);
    },
    [customAudio, volume, currentSe],
  );

  const playDecide = useCallback(() => {
    playDecideSound(volume.se ?? DEFAULT_VOLUME.se);
  }, [volume.se]);

  const playCancel = useCallback(() => {
    playCancelSound(volume.se ?? DEFAULT_VOLUME.se);
  }, [volume.se]);

  const resumeOnSelect = useCallback(() => {
    initAudio();
  }, []);

  const previewBgm = useCallback(
    (bgmId) => {
      playBgm(bgmId, { customAudio, volume, bgmRef });
    },
    [customAudio, volume],
  );

  const previewSe = useCallback(
    (url) => {
      const audio = new Audio(url);
      audio.volume = volume.se ?? DEFAULT_VOLUME.se;
      audio.play().catch(() => {});
    },
    [volume.se],
  );

  return {
    playSE: playGameSE,
    playDecideSound: playDecide,
    playCancelSound: playCancel,
    resumeOnSelect,
    previewBgm,
    previewSe,
    volume,
    setVolume,
    customAudio,
    setCustomAudio,
  };
}
