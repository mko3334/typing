/** @typedef {'bgm'|'type'|'error'|'wordClear'|'allClear'|'gacha'|'points'|'legend'|'correct'|'clear'|'countdown'|'go'} SeType */

const COMMON = '/sounds/共通音';

export const DEFAULT_SOUNDS = {
  bgm: '/sounds/BGM.mp3',
  type: `${COMMON}/入力.mp3`,
  error: `${COMMON}/ミス.mp3`,
  wordClear: `${COMMON}/ワード正解.mp3`,
  allClear: `${COMMON}/５問クリア時.mp3`,
  gacha: `${COMMON}/ガチャ開封時.mp3`,
  points: `${COMMON}/ポイント獲得時.mp3`,
  legend: `${COMMON}/確定演出.mp3`,
  countdown: `${COMMON}/カウントダウン.mp3`,
  go: `${COMMON}/GO!!.mp3`,
  correct: '/sounds/decide_cancel/decide.mp3',
  clear: `${COMMON}/ワード正解.mp3`,
  countdown_10s: `${COMMON}/タイピングショー10カウントダウン.mp3`,
  timeup: `${COMMON}/タイムアップ.mp3`,
};

export const DECIDE_SOUND = '/sounds/decide_cancel/decide.mp3';
export const CANCEL_SOUND = '/sounds/decide_cancel/cancel.mp3';

/** @type {{ id: string, name: string, url: string }[]} */
export const BGM_LIST = [
  { id: 'default', name: 'デフォルトBGM 🎵', url: '/sounds/BGM.mp3' },
  { id: 'happy_street', name: 'Happy Street 🛍️', url: '/sounds/BGM/Happy_Street.mp3' },
  { id: 'let_me_think', name: 'Let me think ! 💡', url: '/sounds/BGM/Let_me_think_!.mp3' },
  { id: 'new_challenge', name: 'New Challenge 🏁', url: '/sounds/BGM/New_Challenge.mp3' },
  { id: 'pleasure_field', name: 'Pleasure Field 🍀', url: '/sounds/BGM/Pleasure_Field.mp3' },
  { id: 'retail_magic_hour', name: 'Retail Magic Hour ✨', url: '/sounds/BGM/Retail_Magic_Hour.mp3' },
  { id: 'shiney_seaside', name: 'Shiney seaside 🏖️', url: '/sounds/BGM/Shiney_seaside.mp3' },
  { id: 'kitten_march', name: 'こねこのマーチ 🐈', url: '/sounds/BGM/こねこのマーチ.mp3' },
  { id: 'lively_amusement', name: 'にぎやかアミューズメント 🎡', url: '/sounds/BGM/にぎやかアミューズメント.mp3' },
  { id: 'bicycle_bluesky', name: '自転車と青空 🚲', url: '/sounds/BGM/自転車と青空.mp3' },
];

/** タイピング入力音（セーブデータの currentSe で選択） */
/** @type {{ id: string, name: string, url: string }[]} */
export const SE_LIST = [
  { id: 'default', name: 'デフォルト（入力） ⌨️', url: `${COMMON}/入力.mp3` },
  { id: 'ou', name: 'オウ！ 🗣️', url: '/sounds/SE/ou.mp3' },
  { id: 'shakeen', name: 'シャキーン ⚔️', url: '/sounds/SE/shakeen.mp3' },
  { id: 'shock', name: 'ショック 😱', url: '/sounds/SE/shock.mp3' },
  { id: 'chun', name: 'チュン 🐦', url: '/sounds/SE/chun.mp3' },
  { id: 'don', name: 'ドン 🥁', url: '/sounds/SE/don.mp3' },
  { id: 'nyu', name: 'ニュッ 🍮', url: '/sounds/SE/nyu.mp3' },
  { id: 'baan', name: 'バーン 💥', url: '/sounds/SE/baan.mp3' },
  { id: 'pafu', name: 'パフ 🎺', url: '/sounds/SE/pafu.mp3' },
  { id: 'pikot', name: 'ピコッ 👾', url: '/sounds/SE/pikot.mp3' },
  { id: 'popi', name: 'ポピ 🎵', url: '/sounds/SE/popi.mp3' },
  { id: 'pon', name: 'ポン 🔔', url: '/sounds/SE/pon.mp3' },
];

export const DEFAULT_VOLUME = { bgm: 0.3, se: 0.5 };

export function findBgm(id) {
  return BGM_LIST.find((b) => b.id === id) || BGM_LIST[0];
}

export function findSe(id) {
  return SE_LIST.find((s) => s.id === id) || SE_LIST[0];
}

let audioCtx = null;

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

const audioBufferCache = new Map();
const loadingPromises = new Map();

async function loadAudioBuffer(url) {
  if (audioBufferCache.has(url)) {
    return audioBufferCache.get(url);
  }
  if (loadingPromises.has(url)) {
    return loadingPromises.get(url);
  }

  const promise = (async () => {
    try {
      initAudio();
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      audioBufferCache.set(url, audioBuffer);
      return audioBuffer;
    } catch (e) {
      console.error(`Failed to load audio: ${url}`, e);
      return null;
    } finally {
      loadingPromises.delete(url);
    }
  })();

  loadingPromises.set(url, promise);
  return promise;
}

export function preloadAudio(url) {
  if (!url) return;
  loadAudioBuffer(url);
}

function playUrl(url, volume = 0.5) {
  if (!url) return;
  initAudio();

  loadAudioBuffer(url).then(buffer => {
    if (!buffer) return;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    source.start(0);
  });
}

/**
 * @param {SeType} type
 * @param {{ customAudio?: Record<string, string|null>, volume?: { bgm?: number, se?: number }, currentSe?: string, bgmRef?: { current: any } }} options
 */
export function playSE(type, options = {}) {
  const { customAudio = {}, volume = DEFAULT_VOLUME, currentSe = 'default', bgmRef } = options;
  const seVol = volume.se ?? DEFAULT_VOLUME.se;

  // BGM is now handled via GainNode/SourceNode in bgmRef, if suspended, resume context
  initAudio();

  if (type === 'type') {
    const se = findSe(currentSe);
    playUrl(se.url, seVol);
    return;
  }

  if (customAudio[type]) {
    playUrl(customAudio[type], seVol);
    return;
  }

  playUrl(DEFAULT_SOUNDS[type], seVol);
}

export function playDecideSound(volume = DEFAULT_VOLUME.se) {
  playUrl(DECIDE_SOUND, volume);
}

export function playCancelSound(volume = DEFAULT_VOLUME.se) {
  playUrl(CANCEL_SOUND, volume);
}

/**
 * @param {string} bgmId
 * @param {{ customAudio?: Record<string, string|null>, volume?: { bgm?: number, se?: number }, bgmRef: { current: any } }} options
 */
export function playBgm(bgmId, options) {
  const { customAudio = {}, volume = DEFAULT_VOLUME, bgmRef } = options;
  const track = findBgm(bgmId);
  const url = customAudio.bgm || track.url;
  const bgmVol = volume.bgm ?? DEFAULT_VOLUME.bgm;

  initAudio();

  if (bgmRef.current && bgmRef.current.url === url) {
    if (bgmRef.current.gainNode) {
      bgmRef.current.gainNode.gain.setValueAtTime(bgmVol, audioCtx.currentTime);
    }
    return;
  }

  stopBgm(bgmRef);

  const state = { url, source: null, gainNode: null, stopped: false };
  bgmRef.current = state;

  loadAudioBuffer(url).then(buffer => {
    if (state.stopped || !buffer) return;

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = bgmVol;

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    source.start(0);

    state.source = source;
    state.gainNode = gainNode;
  });
}

export function stopBgm(bgmRef) {
  if (bgmRef?.current) {
    bgmRef.current.stopped = true;
    if (bgmRef.current.source) {
      try {
        bgmRef.current.source.stop();
        bgmRef.current.source.disconnect();
      } catch (e) {}
    }
    if (bgmRef.current.gainNode) {
      try {
        bgmRef.current.gainNode.disconnect();
      } catch (e) {}
    }
    bgmRef.current = null;
  }
}

