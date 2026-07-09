import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ANNOUNCEMENT_BANNERS } from '../constants/announcementBanners';
import { HIRAGANA_CHALLENGE_ANNOUNCEMENT } from '../constants/hiraganaChallengeAnnouncement';
import { TYPING_SHOW_ANNOUNCEMENT } from '../constants/typingShowAnnouncement';
import { archiveAnnouncement, cancelAnnouncement, createAnnouncement, getAnnouncements } from '../firebase';
import { formatAnnouncementTime } from '../utils/announcements';

function parseGiftAmount(value) {
  const n = parseInt(String(value).trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const EMPTY_FORM = {
  scope: 'broadcast',
  targetPlayerId: '',
  kind: 'info',
  title: '',
  message: '',
  bannerUrl: ANNOUNCEMENT_BANNERS[0]?.url || '',
  bannerPosition: 50,
  sendMode: 'immediate',
  scheduledAt: '',
  points: '',
  specialTickets: '',
  bgmTickets: '',
  seTickets: '',
  legendTickets: '',
};

export default function AdminAnnouncementsSection({ players, playDecideSound }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const activePlayers = (players || []).filter((p) => !p.isArchived);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const items = await getAnnouncements();
      setList(items.filter((a) => a.status !== 'cancelled'));
    } finally {
      setLoading(false);
    }
  }, []);

  const activeAnnouncements = useMemo(
    () => list.filter((item) => item.status !== 'archived'),
    [list],
  );

  const archivedAnnouncements = useMemo(
    () => list.filter((item) => item.status === 'archived'),
    [list],
  );

  useEffect(() => {
    loadList();
  }, [loadList]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setStatus(null);

    if (!form.title.trim()) {
      setStatus({ type: 'error', text: 'タイトルを 入力してね' });
      return;
    }
    if (form.scope === 'personal' && !form.targetPlayerId) {
      setStatus({ type: 'error', text: '送信先の プレイヤーを 選んでね' });
      return;
    }
    if (form.sendMode === 'scheduled' && !form.scheduledAt) {
      setStatus({ type: 'error', text: '送信予約の 日時を 選んでね' });
      return;
    }

    const targetPlayer = activePlayers.find((p) => p.id === form.targetPlayerId);
    const payload = {
      scope: form.scope,
      targetPlayerId: form.scope === 'personal' ? form.targetPlayerId : null,
      targetPlayerName: form.scope === 'personal' ? targetPlayer?.name || '' : null,
      kind: form.kind,
      title: form.title.trim(),
      message: form.message.trim(),
      bannerUrl: form.bannerUrl || null,
      bannerPosition: form.bannerPosition ?? 50,
      sendMode: form.sendMode,
      scheduledAt:
        form.sendMode === 'scheduled' ? new Date(form.scheduledAt).toISOString() : null,
      points: form.kind === 'gift' ? parseGiftAmount(form.points) : 0,
      specialTickets: form.kind === 'gift' ? parseGiftAmount(form.specialTickets) : 0,
      bgmTickets: form.kind === 'gift' ? parseGiftAmount(form.bgmTickets) : 0,
      seTickets: form.kind === 'gift' ? parseGiftAmount(form.seTickets) : 0,
      legendTickets: form.kind === 'gift' ? parseGiftAmount(form.legendTickets) : 0,
    };

    if (form.kind === 'gift') {
      const hasGift =
        payload.points ||
        payload.specialTickets ||
        payload.bgmTickets ||
        payload.seTickets ||
        payload.legendTickets;
      if (!hasGift && !payload.message) {
        setStatus({ type: 'error', text: 'プレゼント内容か メッセージを 入れてね' });
        return;
      }
    }

    setSending(true);
    try {
      const result = await createAnnouncement(payload);
      if (result?.id) {
        playDecideSound?.();
        setStatus({
          type: 'success',
          text:
            form.sendMode === 'scheduled'
              ? '📅 送信予約しました！'
              : '📢 お知らせを 送信しました！',
        });
        setForm(EMPTY_FORM);
        await loadList();
      } else {
        setStatus({
          type: 'error',
          text: result?.error || '送信に 失敗しました',
        });
      }
    } catch (error) {
      console.error('handleSubmit announcement:', error);
      setStatus({ type: 'error', text: '送信に 失敗しました' });
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async (item) => {
    if (!confirm(`「${item.title}」を 取り消しますか？`)) return;
    const ok = await cancelAnnouncement(item.id);
    if (ok) loadList();
  };

  const handleArchive = async (item) => {
    if (
      !confirm(
        `「${item.title}」を アーカイブしますか？\n\nプレイヤーには 通知も 履歴も 表示されなくなります。`,
      )
    ) {
      return;
    }
    const ok = await archiveAnnouncement(item.id);
    if (ok) loadList();
  };

  const renderAnnouncementRow = (item, { showArchive = false, showCancel = false } = {}) => (
    <div
      key={item.id}
      className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold"
    >
      <div className="flex justify-between gap-2 items-start">
        <div className="min-w-0">
          <div className="flex gap-2 flex-wrap items-center mb-0.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
              {item.scope === 'personal' ? '個人' : '全体'}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${
                item.status === 'scheduled'
                  ? 'bg-sky-100 text-sky-700'
                  : item.status === 'archived'
                    ? 'bg-gray-200 text-gray-600'
                    : 'bg-amber-100 text-amber-700'
              }`}
            >
              {item.status === 'scheduled'
                ? '予約'
                : item.status === 'archived'
                  ? 'アーカイブ'
                  : '送信済'}
            </span>
            <span className="text-[10px] text-gray-400">
              {formatAnnouncementTime(item.publishedAt || item.scheduledAt || item.archivedAt)}
            </span>
          </div>
          <p className="text-sm font-black text-gray-800 truncate">{item.title}</p>
          {item.scope === 'personal' && (
            <p className="text-[10px] text-gray-500">→ {item.targetPlayerName || item.targetPlayerId}</p>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          {showCancel && item.status === 'scheduled' && (
            <button
              type="button"
              onClick={() => handleCancel(item)}
              className="text-[10px] text-red-500 hover:underline"
            >
              取消
            </button>
          )}
          {showArchive && item.status === 'published' && (
            <button
              type="button"
              onClick={() => handleArchive(item)}
              className="text-[10px] text-gray-600 hover:underline"
            >
              📦 アーカイブ
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-indigo-100 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-black text-indigo-800">📢 お知らせを 作成</h3>
          <div className="flex gap-2 items-center flex-wrap">
            <button
              type="button"
              onClick={() => {
                playDecideSound?.();
                setForm((prev) => ({
                  ...prev,
                  kind: HIRAGANA_CHALLENGE_ANNOUNCEMENT.kind,
                  title: HIRAGANA_CHALLENGE_ANNOUNCEMENT.title,
                  message: HIRAGANA_CHALLENGE_ANNOUNCEMENT.message,
                  bannerUrl: HIRAGANA_CHALLENGE_ANNOUNCEMENT.bannerUrl,
                  bannerPosition: 50,
                }));
                setStatus({ type: 'success', text: 'ひらがなチャレンジ告知の 文案を 入れたよ' });
              }}
              className="text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-full bg-pink-100 text-pink-700 border border-pink-200 hover:bg-pink-200 transition-colors"
            >
              🌸 ひらがなチャレンジ告知を 入力
            </button>
            <button
              type="button"
              onClick={() => {
                playDecideSound?.();
                setForm((prev) => ({
                  ...prev,
                  kind: TYPING_SHOW_ANNOUNCEMENT.kind,
                  title: TYPING_SHOW_ANNOUNCEMENT.title,
                  message: TYPING_SHOW_ANNOUNCEMENT.message,
                  bannerUrl: TYPING_SHOW_ANNOUNCEMENT.bannerUrl,
                  bannerPosition: 50,
                }));
                setStatus({ type: 'success', text: 'タイピングショー告知の 文案を 入れたよ' });
              }}
              className="text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 hover:bg-amber-200 transition-colors flex items-center gap-1"
            >
              <span>🎭</span> タイピングショー告知を 入力
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs font-bold text-gray-600">
            送信先
            <select
              value={form.scope}
              onChange={(e) => updateField('scope', e.target.value)}
              className="mt-1 w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-bold"
            >
              <option value="broadcast">みんな宛（全体告知）</option>
              <option value="personal">あなた宛（個人）</option>
            </select>
          </label>

          {form.scope === 'personal' && (
            <label className="text-xs font-bold text-gray-600">
              プレイヤー
              <select
                value={form.targetPlayerId}
                onChange={(e) => updateField('targetPlayerId', e.target.value)}
                className="mt-1 w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-bold"
              >
                <option value="">選んでください</option>
                {activePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="text-xs font-bold text-gray-600">
            種類
            <select
              value={form.kind}
              onChange={(e) => updateField('kind', e.target.value)}
              className="mt-1 w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-bold"
            >
              <option value="info">📢 全体告知・アップデート</option>
              <option value="gift">🎁 プレゼント配布</option>
            </select>
          </label>

          <label className="text-xs font-bold text-gray-600">
            送信タイミング
            <select
              value={form.sendMode}
              onChange={(e) => updateField('sendMode', e.target.value)}
              className="mt-1 w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-bold"
            >
              <option value="immediate">今すぐ送信</option>
              <option value="scheduled">送信予約</option>
            </select>
          </label>
        </div>

        {form.sendMode === 'scheduled' && (
          <label className="block text-xs font-bold text-gray-600">
            送信予定日時
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => updateField('scheduledAt', e.target.value)}
              className="mt-1 w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-bold"
            />
          </label>
        )}

        <label className="block text-xs font-bold text-gray-600">
          タイトル
          <input
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            className="mt-1 w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-bold"
            placeholder="例：アップデートのお知らせ"
          />
        </label>

        <label className="block text-xs font-bold text-gray-600">
          メッセージ
          <textarea
            value={form.message}
            onChange={(e) => updateField('message', e.target.value)}
            rows={4}
            className="mt-1 w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-bold resize-y"
            placeholder="お知らせの 内容を 書いてね"
          />
        </label>

        <div className="flex flex-col gap-2 border-2 border-gray-200 rounded-xl p-3 bg-gray-50">
          <span className="text-xs font-bold text-gray-600">バナーイラスト (任意)</span>
          <div className="flex flex-wrap gap-2">
            {ANNOUNCEMENT_BANNERS.map((banner) => (
              <button
                type="button"
                key={banner.id}
                onClick={() => updateField('bannerUrl', banner.url)}
                className={`relative w-24 h-12 rounded border-2 overflow-hidden transition-all ${
                  form.bannerUrl === banner.url
                    ? 'border-indigo-500 shadow-md ring-2 ring-indigo-200'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={banner.url} alt={banner.label} className="w-full h-full object-cover" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => updateField('bannerUrl', '/show_bg.png')}
              className={`relative w-24 h-12 rounded border-2 overflow-hidden transition-all ${
                form.bannerUrl === '/show_bg.png'
                  ? 'border-indigo-500 shadow-md ring-2 ring-indigo-200'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src="/show_bg.png" alt="タイピングショー" className="w-full h-full object-cover" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              placeholder="カスタム画像URLを入力..."
              value={form.bannerUrl}
              onChange={(e) => updateField('bannerUrl', e.target.value)}
              className="flex-1 border-2 border-gray-200 rounded-lg px-2 py-1 text-xs"
            />
            <button
              type="button"
              onClick={() => updateField('bannerUrl', '')}
              className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded font-bold"
            >
              クリア
            </button>
          </div>

          {form.bannerUrl && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-700">トリミング位置（上下）</span>
                <span className="text-xs font-black text-indigo-600">{form.bannerPosition ?? 50}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={form.bannerPosition ?? 50}
                onChange={(e) => updateField('bannerPosition', parseInt(e.target.value, 10))}
                className="w-full mb-3"
              />
              <div className="w-full aspect-[2/1] bg-gray-100 rounded overflow-hidden border border-gray-200">
                <img
                  src={form.bannerUrl}
                  alt="プレビュー"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: `50% ${form.bannerPosition ?? 50}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-2 text-center">
                スライダーで、お知らせ画面で見せたい部分を調整してください。
              </p>
            </div>
          )}
        </div>

        {form.kind === 'gift' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-amber-50 border-2 border-amber-100 rounded-2xl p-3">
            {[
              ['points', '🪙 ポイント'],
              ['specialTickets', '🎨 背景'],
              ['legendTickets', '🌟 超激レア'],
              ['bgmTickets', '🎵 音楽'],
              ['seTickets', '🔊 効果音'],
            ].map(([key, label]) => (
              <label key={key} className="text-[10px] font-bold text-gray-600">
                {label}
                <input
                  inputMode="numeric"
                  value={form[key]}
                  onChange={(e) => updateField(key, e.target.value.replace(/\D/g, ''))}
                  className="mt-0.5 w-full border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold"
                />
              </label>
            ))}
          </div>
        )}

        {status && (
          <div
            className={`rounded-xl px-3 py-2 text-xs font-black ${
              status.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
            role="status"
          >
            {status.text}
          </div>
        )}

        <button
          type="button"
          disabled={sending}
          onClick={handleSubmit}
          className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-black rounded-2xl shadow-lg disabled:opacity-50"
        >
          {sending ? '送信中…' : form.sendMode === 'scheduled' ? '📅 予約する' : '📢 送信する'}
        </button>
      </form>

      <div className="bg-white rounded-2xl border-2 border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-gray-800">送信済み / 予約中</h3>
          <button
            type="button"
            onClick={loadList}
            className="text-xs font-black text-sky-600 hover:underline"
          >
            更新
          </button>
        </div>
        {loading ? (
          <p className="text-xs text-gray-400 font-bold">読み込み中…</p>
        ) : activeAnnouncements.length === 0 ? (
          <p className="text-xs text-gray-400 font-bold">まだ お知らせは ありません</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {activeAnnouncements.map((item) =>
              renderAnnouncementRow(item, { showArchive: true, showCancel: true }),
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-100 p-4">
        <h3 className="text-sm font-black text-gray-800 mb-3">📦 アーカイブ（管理者用履歴）</h3>
        {loading ? (
          <p className="text-xs text-gray-400 font-bold">読み込み中…</p>
        ) : archivedAnnouncements.length === 0 ? (
          <p className="text-xs text-gray-400 font-bold">アーカイブされた お知らせは ありません</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {archivedAnnouncements.map((item) => renderAnnouncementRow(item))}
          </div>
        )}
        <p className="text-[10px] font-bold text-gray-500 mt-2">
          アーカイブしたお知らせは プレイヤーに 表示されません（未読・既読 どちらも）
        </p>
      </div>
    </div>
  );
}
