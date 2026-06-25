import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { resolveAnnouncementBannerUrl } from '../constants/announcementBanners';
import {
  formatAnnouncementTime,
  getAnnouncementKindLabel,
  partitionAnnouncementsForPlayer,
} from '../utils/announcements';
import AnnouncementModal, { ReadStatusBadge } from './AnnouncementModal';

function TabButton({ active, label, unread, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex-1 py-3 rounded-xl text-sm font-black border-3 transition-all ${
        active
          ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white border-white shadow-md'
          : 'bg-white text-indigo-700 border-indigo-100'
      }`}
    >
      {label}
      {unread && (
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
      )}
    </button>
  );
}

function AnnouncementListItem({ item, onOpen }) {
  const bannerUrl = resolveAnnouncementBannerUrl(item);

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={`w-full text-left rounded-2xl border-4 p-4 transition-all hover:scale-[1.01] active:scale-[0.99] ${
        item.isRead
          ? 'bg-gray-50 border-gray-200 opacity-90'
          : 'bg-gradient-to-r from-amber-50 via-sky-50 to-indigo-50 border-sky-300 shadow-md ring-2 ring-sky-100'
      }`}
    >
      <div className="flex gap-4 items-start">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt=""
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-contain border-3 border-white shrink-0 shadow-sm bg-white"
          />
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-pink-200 to-sky-200 flex items-center justify-center text-3xl shrink-0 border-3 border-white shadow-sm">
            {item.kind === 'gift' ? '🎁' : '📢'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <ReadStatusBadge isRead={item.isRead} />
            <span className="text-[10px] font-black text-indigo-600">
              {getAnnouncementKindLabel(item.kind)}
            </span>
            <span className="text-[10px] font-bold text-gray-400">
              {formatAnnouncementTime(item.publishedAt)}
            </span>
          </div>
          <p className="text-base sm:text-lg font-black text-gray-800 line-clamp-2">{item.title}</p>
          {item.message && (
            <p className="text-xs sm:text-sm font-bold text-gray-500 line-clamp-2 mt-1">{item.message}</p>
          )}
        </div>
      </div>
    </button>
  );
}

/** お知らせウィンドウ（一覧） */
export default function AnnouncementPanel({
  player,
  announcements,
  onClose,
  onReadAnnouncement,
  playDecideSound,
  playCancelSound,
}) {
  const [tab, setTab] = useState('personal');
  const [detail, setDetail] = useState(null);

  const partitioned = useMemo(
    () => partitionAnnouncementsForPlayer(announcements, player),
    [announcements, player],
  );

  const list = tab === 'personal' ? partitioned.personal : partitioned.broadcast;
  const unreadPersonal = partitioned.unreadPersonal.length > 0;
  const unreadBroadcast = partitioned.unreadBroadcast.length > 0;
  const unreadCount =
    partitioned.unreadPersonal.length + partitioned.unreadBroadcast.length;

  const handleOpenItem = (item) => {
    playDecideSound?.();
    setDetail(item);
  };

  const handleCloseDetail = async () => {
    if (detail && !detail.isRead) {
      await onReadAnnouncement?.(detail);
    }
    setDetail(null);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-3 sm:p-6 animate-fade-in"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-xl sm:max-w-2xl max-h-[92vh] animate-pop-out"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-yellow-300 via-sky-300 to-pink-300 blur-sm opacity-80" />
          <div className="relative bg-white border-8 border-yellow-300 rounded-[1.75rem] shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b-4 border-yellow-100 bg-gradient-to-r from-sky-50 to-pink-50 shrink-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-indigo-800">📬 お知らせ</h2>
                <p className="text-xs font-bold text-gray-500 mt-0.5">
                  あなた宛 / みんな宛
                  {unreadCount > 0 && (
                    <span className="ml-2 text-red-500 font-black">未読 {unreadCount}件</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  playCancelSound?.();
                  onClose?.();
                }}
                className="p-2.5 rounded-full hover:bg-white/80 border-2 border-transparent hover:border-gray-200"
                aria-label="とじる"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="flex gap-2 p-4 border-b border-gray-100 shrink-0">
              <TabButton
                active={tab === 'personal'}
                label="あなた宛"
                unread={unreadPersonal}
                onClick={() => {
                  playDecideSound?.();
                  setTab('personal');
                }}
              />
              <TabButton
                active={tab === 'broadcast'}
                label="みんな宛"
                unread={unreadBroadcast}
                onClick={() => {
                  playDecideSound?.();
                  setTab('broadcast');
                }}
              />
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
              {list.length === 0 ? (
                <p className="text-sm font-bold text-gray-400 text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  お知らせは まだ ありません
                </p>
              ) : (
                list.map((item) => (
                  <AnnouncementListItem key={item.id} item={item} onOpen={handleOpenItem} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {detail && (
        <AnnouncementModal
          announcement={detail}
          isRead={detail.isRead}
          mode="panel"
          playDecideSound={playDecideSound}
          onClose={handleCloseDetail}
        />
      )}
    </>
  );
}
