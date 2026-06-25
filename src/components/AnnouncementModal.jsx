import React from 'react';
import { resolveAnnouncementBannerUrl } from '../constants/announcementBanners';
import {
  announcementHasGift,
  formatAnnouncementTime,
  getAnnouncementKindLabel,
} from '../utils/announcements';

function ReadStatusBadge({ isRead, size = 'md' }) {
  const large = size === 'lg';
  return (
    <span
      className={`inline-flex items-center gap-1 font-black rounded-full border-2 ${
        isRead
          ? 'bg-gray-100 text-gray-500 border-gray-200'
          : 'bg-red-500 text-white border-red-300 shadow-md animate-pulse'
      } ${large ? 'text-xs px-2.5 py-0.5' : 'text-[10px] px-2 py-0.5'}`}
    >
      {!isRead && <span className={`rounded-full bg-white ${large ? 'w-1.5 h-1.5' : 'w-1.5 h-1.5'}`} />}
      {isRead ? '既読' : '未読'}
    </span>
  );
}

function GiftLine({ icon, label }) {
  return (
    <div className="flex items-center gap-2 font-black text-gray-700 bg-white/90 p-2.5 rounded-xl border border-orange-100 text-sm">
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

/** お知らせウィンドウ（詳細・受け取りポップアップ） */
export default function AnnouncementModal({
  announcement,
  onClose,
  playDecideSound,
  mode = 'popup',
  isRead = false,
}) {
  if (!announcement) return null;

  const bannerUrl = resolveAnnouncementBannerUrl(announcement);
  const hasGift = announcementHasGift(announcement);
  const timeLabel = formatAnnouncementTime(announcement.publishedAt);
  const readState = announcement.isRead ?? isRead;

  const handleClose = () => {
    playDecideSound?.();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-md sm:max-w-lg animate-pop-out">
        <div className="absolute -inset-1 rounded-[1.5rem] bg-gradient-to-r from-sky-400 via-pink-400 to-amber-300 blur-sm opacity-80" />
        <div
          className={`relative bg-white border-4 rounded-[1.35rem] shadow-2xl overflow-hidden flex flex-col max-h-[min(88vh,640px)] ${
            readState ? 'border-gray-200' : 'border-yellow-300'
          }`}
        >
          {bannerUrl && (
            <div className="shrink-0 w-full bg-gradient-to-r from-sky-100 via-white to-pink-100 border-b-2 border-white/80">
              <img
                src={bannerUrl}
                alt=""
                className="block w-full h-auto object-contain"
              />
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <ReadStatusBadge isRead={readState} size="lg" />
                <span className="text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {getAnnouncementKindLabel(announcement.kind)}
                </span>
              </div>
              {timeLabel && (
                <span className="text-[10px] sm:text-xs font-bold text-gray-400 shrink-0">{timeLabel}</span>
              )}
            </div>

            <div>
              <p className="text-[10px] font-black text-indigo-500 mb-0.5">お知らせ</p>
              <h3 className="text-lg sm:text-xl font-black text-gray-800 leading-snug break-words">
                {announcement.title}
              </h3>
            </div>

            {announcement.message && (
              <div
                className={`rounded-xl p-3 sm:p-4 border-2 ${
                  readState ? 'bg-gray-50 border-gray-100' : 'bg-sky-50 border-sky-200'
                }`}
              >
                <p className="text-sm sm:text-base font-bold text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                  {announcement.message}
                </p>
              </div>
            )}

            {hasGift && (
              <div className="space-y-1.5">
                <p className="text-xs font-black text-amber-600">🎁 もらえる プレゼント</p>
                {(announcement.points || 0) > 0 && (
                  <GiftLine icon="🪙" label={`ポイント × ${announcement.points}`} />
                )}
                {(announcement.specialTickets || 0) > 0 && (
                  <GiftLine icon="🎨" label={`はいけいチケット × ${announcement.specialTickets}`} />
                )}
                {(announcement.legendTickets || 0) > 0 && (
                  <GiftLine icon="🌟" label={`超激レア以上チケット × ${announcement.legendTickets}`} />
                )}
                {(announcement.bgmTickets || 0) > 0 && (
                  <GiftLine icon="🎵" label={`おんがくチケット × ${announcement.bgmTickets}`} />
                )}
                {(announcement.seTickets || 0) > 0 && (
                  <GiftLine icon="🔊" label={`こうかおんチケット × ${announcement.seTickets}`} />
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 p-4 pt-0 sm:p-5 sm:pt-0 border-t border-gray-100 bg-white/95">
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-500 hover:from-sky-500 hover:via-indigo-600 hover:to-violet-600 text-white font-black text-base sm:text-lg rounded-xl shadow-md border-2 border-white active:scale-95 transition-transform"
            >
              {hasGift ? '🎁 うけとる！' : mode === 'popup' ? 'OK！' : 'とじる'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { ReadStatusBadge };
