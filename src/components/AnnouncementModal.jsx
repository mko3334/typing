import React from 'react';
import { getAnnouncementBannerUrl } from '../constants/announcementBanners';
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
      } ${large ? 'text-sm px-3 py-1' : 'text-[10px] px-2 py-0.5'}`}
    >
      {!isRead && <span className={`rounded-full bg-white ${large ? 'w-2 h-2' : 'w-1.5 h-1.5'}`} />}
      {isRead ? '既読' : '未読'}
    </span>
  );
}

function GiftLine({ icon, label }) {
  return (
    <div className="flex items-center gap-2 font-black text-gray-700 bg-white/90 p-3 rounded-xl border border-orange-100 text-base">
      <span className="text-xl">{icon}</span>
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

  const bannerUrl = getAnnouncementBannerUrl(announcement.bannerUrl);
  const hasGift = announcementHasGift(announcement);
  const timeLabel = formatAnnouncementTime(announcement.publishedAt);
  const readState = announcement.isRead ?? isRead;

  const handleClose = () => {
    playDecideSound?.();
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-xl sm:max-w-2xl animate-pop-out">
        <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-sky-400 via-pink-400 to-amber-300 blur-sm opacity-90" />
        <div
          className={`relative bg-white border-8 rounded-[1.75rem] shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto ${
            readState ? 'border-gray-200' : 'border-yellow-300'
          }`}
        >
          {bannerUrl && (
            <div className="w-full h-44 sm:h-56 bg-gradient-to-br from-sky-100 to-pink-100 overflow-hidden">
              <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-5 sm:p-8 space-y-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <ReadStatusBadge isRead={readState} size="lg" />
                <span className="text-xs sm:text-sm font-black px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  {getAnnouncementKindLabel(announcement.kind)}
                </span>
              </div>
              {timeLabel && (
                <span className="text-xs sm:text-sm font-bold text-gray-400 shrink-0">{timeLabel}</span>
              )}
            </div>

            <div>
              <p className="text-[10px] sm:text-xs font-black text-indigo-500 mb-1 tracking-wide">お知らせ</p>
              <h3 className="text-2xl sm:text-3xl font-black text-gray-800 leading-snug break-words">
                {announcement.title}
              </h3>
            </div>

            {announcement.message && (
              <div
                className={`rounded-2xl p-5 sm:p-6 border-2 ${
                  readState
                    ? 'bg-gray-50 border-gray-100'
                    : 'bg-sky-50 border-sky-200 shadow-inner'
                }`}
              >
                <p className="text-base sm:text-lg font-bold text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                  {announcement.message}
                </p>
              </div>
            )}

            {hasGift && (
              <div className="space-y-2">
                <p className="text-sm font-black text-amber-600">🎁 もらえる プレゼント</p>
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

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-4 sm:py-5 bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-500 hover:from-sky-500 hover:via-indigo-600 hover:to-violet-600 text-white font-black text-lg sm:text-xl rounded-2xl shadow-lg border-4 border-white active:scale-95 transition-transform"
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
