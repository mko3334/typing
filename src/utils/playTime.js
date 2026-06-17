export function formatDurationMs(ms) {
  if (!ms || ms <= 0) return '0分';
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours > 0) return `${hours}時間${minutes}分`;
  return `${minutes}分`;
}

export function getAveragePlayMs(totalPlayMs, sessionCount) {
  if (!sessionCount || sessionCount <= 0) return null;
  return (totalPlayMs || 0) / sessionCount;
}

export function computeSessionUpdates(player, sessionStartMs) {
  if (!player?.id || !sessionStartMs) return null;
  const sessionMs = Date.now() - sessionStartMs;
  if (sessionMs < 60000) return null;
  return {
    totalPlayMs: (player.totalPlayMs || 0) + sessionMs,
    sessionCount: (player.sessionCount || 0) + 1,
  };
}
