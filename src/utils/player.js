import { normalizeHiraganaProgress } from './hiraganaTyping';
import { getActivePlazaSubEvents } from './subEvents';
import { normalizeUnlockedFrames } from './saveFrameGacha';
import { normalizePlayingSession } from './playerSession';

export function enrichPlayer(id, data) {
  const collection = data.collection || {};
  const ownedCount = Object.keys(collection).filter((k) => collection[k] > 0).length;
  return normalizePlayingSession({
    id,
    name: data.name,
    points: data.points || 0,
    collection,
    collectionCount: ownedCount,
    currentTitle: data.currentTitle || 'rookie',
    currentIcon: data.currentIcon ?? null,
    currentBackground: data.currentBackground || 'default',
    currentBgm: data.currentBgm || 'default',
    currentSe: data.currentSe || 'default',
    unlockedBgms: Array.isArray(data.unlockedBgms) ? data.unlockedBgms : ['default'],
    unlockedSes: Array.isArray(data.unlockedSes) ? data.unlockedSes : ['default'],
    achievements: Array.isArray(data.achievements) ? data.achievements : ['rookie'],
    backgrounds: Array.isArray(data.backgrounds) ? data.backgrounds : ['default'],
    assistSettings: data.assistSettings || null,
    specialTickets: data.specialTickets || 0,
    legendTickets: data.legendTickets || 0,
    bgmTickets: data.bgmTickets || 0,
    seTickets: data.seTickets || 0,
    frameTickets:
      (data.frameTickets || 0) +
      (data.practiceFrameTickets || 0) +
      (data.testFrameTickets || 0),
    playCount:
      Number.isFinite(Number(data.playCount)) && Number(data.playCount) >= 0
        ? Number(data.playCount)
        : 0,
    specialWordTriggered: data.specialWordTriggered === true,
    newItems: data.newItems || [],
    tags: data.tags || [],
    isArchived: data.isArchived || false,
    lastUpdatedAt: data.lastUpdatedAt || null,
    lastPlayedAt: data.lastPlayedAt || null,
    totalPlayMs:
      Number.isFinite(Number(data.totalPlayMs)) && Number(data.totalPlayMs) >= 0
        ? Number(data.totalPlayMs)
        : 0,
    sessionCount:
      Number.isFinite(Number(data.sessionCount)) && Number(data.sessionCount) >= 0
        ? Number(data.sessionCount)
        : 0,
    pendingGifts: Array.isArray(data.pendingGifts) ? data.pendingGifts : [],
    readAnnouncementIds: Array.isArray(data.readAnnouncementIds) ? data.readAnnouncementIds : [],
    solvedSubEventIds: Array.isArray(data.solvedSubEventIds) ? data.solvedSubEventIds : [],
    plazaSubEvents: getActivePlazaSubEvents({
      plazaSubEvents: Array.isArray(data.plazaSubEvents) ? data.plazaSubEvents : [],
      solvedSubEventIds: Array.isArray(data.solvedSubEventIds) ? data.solvedSubEventIds : [],
    }),
    isPlaying: data.isPlaying === true,
    lastActiveTime: data.lastActiveTime || null,
    playingSessionId: data.playingSessionId || null,
    hiraganaProgress: normalizeHiraganaProgress(data.hiraganaProgress),
    unlockedFrames: normalizeUnlockedFrames(data.unlockedFrames),
    currentFrame: data.currentFrame || null,
    difficultyClears:
      data.difficultyClears && typeof data.difficultyClears === 'object' ? data.difficultyClears : {},
    noMissClear: data.noMissClear === true,
    gachaPullCount:
      Number.isFinite(Number(data.gachaPullCount)) && Number(data.gachaPullCount) >= 0
        ? Number(data.gachaPullCount)
        : 0,
  });
}
