export function formatAnnouncementTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('ja-JP', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function isAnnouncementVisible(announcement, now = Date.now()) {
  if (!announcement) return false;
  if (announcement.status === 'archived' || announcement.status === 'cancelled') return false;
  if (announcement.status !== 'published' || !announcement.publishedAt) return false;
  return new Date(announcement.publishedAt).getTime() <= now;
}

export function isAnnouncementForPlayer(announcement, playerId) {
  if (!announcement || !playerId) return false;
  if (announcement.scope === 'broadcast') return true;
  return announcement.scope === 'personal' && announcement.targetPlayerId === playerId;
}

export function getReadAnnouncementIds(player) {
  return Array.isArray(player?.readAnnouncementIds) ? player.readAnnouncementIds : [];
}

export function partitionAnnouncementsForPlayer(announcements, player, extraWords = []) {
  const readIds = new Set(getReadAnnouncementIds(player));
  const personal = [];
  const broadcast = [];

  for (const item of announcements) {
    if (!isAnnouncementVisible(item)) continue;
    if (item.scope === 'personal') {
      if (item.targetPlayerId !== player?.id) continue;
      personal.push({ ...item, isRead: readIds.has(item.id) });
    } else if (item.scope === 'broadcast') {
      broadcast.push({ ...item, isRead: readIds.has(item.id) });
    }
  }

  const receivedGifts = Array.isArray(player?.receivedGifts) ? player.receivedGifts : [];
  const existingGiftTitles = new Set(receivedGifts.map(g => g.title));
  
  for (const gift of receivedGifts) {
    personal.push({
      ...gift,
      id: gift.id || `gift-${gift.acceptedAt}`,
      scope: 'personal',
      kind: 'gift',
      isRead: true,
      publishedAt: gift.acceptedAt || gift.createdAt || new Date().toISOString()
    });
  }

  // 過去のリクエスト採用履歴を仮想プレゼントとして復元
  const adopted = extraWords.filter((w) => w.playerId === player?.id);
  for (const w of adopted) {
    const title = `「${w.kana}」が 採用されたよ！`;
    if (!existingGiftTitles.has(title)) {
      personal.push({
        id: `adopted-${w.id || w.kana}`,
        scope: 'personal',
        kind: 'gift',
        isRead: true,
        title,
        message: 'お題のリクエスト ありがとう！ プレゼントを おくるね。',
        points: 1000,
        specialTickets: 2,
        publishedAt: w.adoptedAt || w.createdAt || new Date(0).toISOString(),
      });
    }
  }

  const byNewest = (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt);
  personal.sort(byNewest);
  broadcast.sort(byNewest);

  return {
    personal,
    broadcast,
    unreadPersonal: personal.filter((a) => !a.isRead),
    unreadBroadcast: broadcast.filter((a) => !a.isRead),
  };
}

export function getUnreadPopupQueue(announcements, player) {
  const { unreadPersonal, unreadBroadcast } = partitionAnnouncementsForPlayer(announcements, player);
  return [...unreadPersonal, ...unreadBroadcast].sort(
    (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt),
  );
}

export function announcementHasGift(announcement) {
  if (!announcement || announcement.kind !== 'gift') return false;
  return (
    (announcement.points || 0) > 0 ||
    (announcement.specialTickets || 0) > 0 ||
    (announcement.bgmTickets || 0) > 0 ||
    (announcement.seTickets || 0) > 0 ||
    (announcement.legendTickets || 0) > 0
  );
}

export function buildGiftUpdatesFromAnnouncement(player, announcement) {
  if (!announcementHasGift(announcement)) return {};
  return {
    points: (player?.points || 0) + (announcement.points || 0),
    specialTickets: (player?.specialTickets || 0) + (announcement.specialTickets || 0),
    bgmTickets: (player?.bgmTickets || 0) + (announcement.bgmTickets || 0),
    seTickets: (player?.seTickets || 0) + (announcement.seTickets || 0),
    legendTickets: (player?.legendTickets || 0) + (announcement.legendTickets || 0),
  };
}

export function getAnnouncementKindLabel(kind) {
  return kind === 'gift' ? '🎁 プレゼント' : '📢 お知らせ';
}
