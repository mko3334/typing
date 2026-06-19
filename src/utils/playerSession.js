const DEVICE_SESSION_KEY = 'kids_typing_device_session';

export const PLAYING_TIMEOUT_MS = 45000;
export const HEARTBEAT_INTERVAL_MS = 15000;

export function getDeviceSessionId() {
  if (typeof window === 'undefined') return 'server';
  let id = sessionStorage.getItem(DEVICE_SESSION_KEY);
  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(DEVICE_SESSION_KEY, id);
  }
  return id;
}

export function isPlayerLockedElsewhere(player, localSessionId = getDeviceSessionId()) {
  if (!player?.isPlaying || !player?.lastActiveTime) return false;
  const elapsed = Date.now() - new Date(player.lastActiveTime).getTime();
  if (elapsed >= PLAYING_TIMEOUT_MS) return false;
  if (player.playingSessionId && player.playingSessionId === localSessionId) return false;
  return true;
}

export function buildPlayingSessionPatch(sessionId = getDeviceSessionId()) {
  return {
    isPlaying: true,
    lastActiveTime: new Date().toISOString(),
    playingSessionId: sessionId,
  };
}

export function buildClearPlayingSessionPatch() {
  return {
    isPlaying: false,
    lastActiveTime: null,
    playingSessionId: null,
  };
}
