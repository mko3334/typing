import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Key } from 'lucide-react';
import localforage from 'localforage';
import {
  addAdoptedWord,
  cancelGiftFromCloudPlayer,
  getTypingReports,
  getWordRequests,
  saveCloudPlayer,
  saveWordCorrection,
  sendGiftToCloudPlayer,
  setPlayerArchived,
  updateTypingReport,
  updateWordRequest,
  exportAllFirestoreData,
  importAllFirestoreData,
} from '../firebase';
import { ADMIN_PASSWORD, suggestDifficultyKey } from '../utils/admin';
import AdminAnnouncementsSection from './AdminAnnouncementsSection';
import { formatDurationMs, getAveragePlayMs } from '../utils/playTime';
import {
  buildMainWordKey,
  buildSubEventWordKey,
  parseRomajiInput,
  refreshWordCorrections,
} from '../utils/wordCorrections';

function parseGiftAmount(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return 0;
  const n = parseInt(trimmed, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function handleGiftNumberChange(setter) {
  return (e) => {
    const v = e.target.value;
    if (v === '') {
      setter('');
      return;
    }
    if (/^\d+$/.test(v)) {
      setter(v);
    }
  };
}

function AdminGiftModal({ player, onClose, onSent, playDecideSound }) {
  const [giftPoints, setGiftPoints] = useState('');
  const [giftSpecialTickets, setGiftSpecialTickets] = useState('');
  const [giftLegendTickets, setGiftLegendTickets] = useState('');
  const [giftBgmTickets, setGiftBgmTickets] = useState('');
  const [giftSeTickets, setGiftSeTickets] = useState('');
  const [giftMessage, setGiftMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!player) return;
    playDecideSound?.();
    setSending(true);
    try {
      const giftData = {
        points: parseGiftAmount(giftPoints),
        specialTickets: parseGiftAmount(giftSpecialTickets),
        bgmTickets: parseGiftAmount(giftBgmTickets),
        seTickets: parseGiftAmount(giftSeTickets),
        legendTickets: parseGiftAmount(giftLegendTickets),
        message: giftMessage.trim(),
      };
      const hasContent =
        giftData.points > 0 ||
        giftData.specialTickets > 0 ||
        giftData.bgmTickets > 0 ||
        giftData.seTickets > 0 ||
        giftData.legendTickets > 0 ||
        giftData.message;
      if (!hasContent) {
        alert('ポイント・チケット・メッセージのどれかを入力してね！');
        return;
      }
      const success = await sendGiftToCloudPlayer(player.id, giftData);
      if (success) {
        alert(`🎁 ${player.name} さんにプレゼントをおくりました！`);
        onSent?.();
        onClose();
      } else {
        alert('プレゼントの送信に失敗しました。');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card bg-white/95 w-full max-w-md p-6 shadow-2xl rounded-3xl border-4 border-pink-400 text-center animate-pop-out max-h-[90vh] overflow-y-auto">
        <span className="text-5xl block mb-2 animate-bounce">🎁</span>
        <h3 className="text-lg sm:text-xl font-black text-gray-800 mb-1">「{player.name}」さんへプレゼント</h3>
        <p className="text-xs text-gray-500 font-bold mb-4">ポイントやチケット、メッセージをおくることができます</p>

        <div className="space-y-3.5 text-left">
          <div>
            <label className="text-xs font-black text-pink-600 block mb-1">🪙 ポイント</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={giftPoints}
              onChange={handleGiftNumberChange(setGiftPoints)}
              placeholder="数を入力"
              className="w-full p-2.5 rounded-xl border-2 border-pink-100 focus:border-pink-500 focus:outline-none bg-white text-sm font-bold text-gray-700"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-black text-pink-600 block mb-0.5">🎨 はいけい</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={giftSpecialTickets}
                onChange={handleGiftNumberChange(setGiftSpecialTickets)}
                placeholder="数を入力"
                className="w-full p-2 rounded-lg border border-pink-100 focus:border-pink-500 focus:outline-none bg-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-pink-600 block mb-0.5">🌟 超激レア以上</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={giftLegendTickets}
                onChange={handleGiftNumberChange(setGiftLegendTickets)}
                placeholder="数を入力"
                className="w-full p-2 rounded-lg border border-pink-100 focus:border-pink-500 focus:outline-none bg-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-pink-600 block mb-0.5">🎵 おんがく</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={giftBgmTickets}
                onChange={handleGiftNumberChange(setGiftBgmTickets)}
                placeholder="数を入力"
                className="w-full p-2 rounded-lg border border-pink-100 focus:border-pink-500 focus:outline-none bg-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-pink-600 block mb-0.5">🔊 こうかおん</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={giftSeTickets}
                onChange={handleGiftNumberChange(setGiftSeTickets)}
                placeholder="数を入力"
                className="w-full p-2 rounded-lg border border-pink-100 focus:border-pink-500 focus:outline-none bg-white text-xs font-bold"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-black text-pink-600 block mb-1">💬 メッセージ</label>
            <textarea
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              placeholder="がんばってね！ など"
              rows={3}
              maxLength={150}
              className="w-full p-2.5 rounded-xl border-2 border-pink-100 focus:border-pink-500 focus:outline-none bg-white text-xs font-bold text-gray-700 resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-black text-sm rounded-2xl transition-all"
          >
            やめる
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 disabled:opacity-60 text-white font-black text-sm rounded-2xl shadow-lg transition-all"
          >
            {sending ? '送信中...' : '🎁 おくる！'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminAdoptModal({ request, difficulty, onDifficultyChange, onConfirm, onCancel, playDecideSound }) {
  const [kana, setKana] = useState('');
  const [romajiText, setRomajiText] = useState('');
  const [emoji, setEmoji] = useState('✨');

  useEffect(() => {
    if (!request) return;
    setKana(request.kana || '');
    setRomajiText(
      Array.isArray(request.romaji) ? request.romaji.join(' / ') : request.romaji || '',
    );
    setEmoji(request.emoji || '✨');
  }, [request]);

  if (!request) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card bg-white/95 w-full max-w-md p-6 shadow-2xl rounded-3xl border-4 border-green-400 text-center animate-pop-out max-h-[90vh] overflow-y-auto">
        <span className="text-5xl block mb-3 animate-bounce">🎉</span>
        <h3 className="text-lg font-black text-gray-800 mb-2">リクエストを 採用する</h3>
        <div className="bg-green-50 border border-green-100 p-4 rounded-2xl mb-4 text-left space-y-3">
          <div>
            <label className="text-[10px] text-green-600 font-black block mb-1">かな（微調整OK）</label>
            <input
              value={kana}
              onChange={(e) => setKana(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-green-100 focus:border-green-400 focus:outline-none bg-white text-sm font-black text-gray-800"
            />
          </div>
          <div>
            <label className="text-[10px] text-green-600 font-black block mb-1">
              ローマ字（ / で区切り）
            </label>
            <input
              value={romajiText}
              onChange={(e) => setRomajiText(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-green-100 focus:border-green-400 focus:outline-none bg-white text-xs font-mono text-gray-700"
            />
          </div>
          <div>
            <label className="text-[10px] text-green-600 font-black block mb-1">絵文字</label>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={8}
              className="w-full p-2.5 rounded-xl border-2 border-green-100 focus:border-green-400 focus:outline-none bg-white text-2xl text-center"
            />
          </div>
          <div>
            <span className="text-[10px] text-green-600 font-black block">リクエストした人</span>
            <span className="text-sm font-bold text-gray-700">{request.playerName || 'ゲスト'}</span>
          </div>
        </div>
        <div className="text-left mb-4">
          <label className="text-xs font-black text-green-700 block mb-1">難易度</label>
          <select
            value={difficulty}
            onChange={(e) => onDifficultyChange(e.target.value)}
            className="w-full p-2.5 rounded-xl border-2 border-green-100 focus:border-green-400 focus:outline-none bg-white text-sm font-bold"
          >
            <option value="easy">イージー</option>
            <option value="normal">ノーマル</option>
            <option value="hard">ハード</option>
            <option value="very_hard">ベリーハード</option>
          </select>
        </div>
        {request.playerId && (
          <p className="text-xs font-bold text-orange-600 mb-4 bg-orange-50 p-2 rounded-xl">
            採用すると「{request.playerName}」さんに 1000ポイント のプレゼント通知が とどきます
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-black text-sm rounded-2xl"
          >
            やめる
          </button>
          <button
            type="button"
            onClick={() => {
              playDecideSound?.();
              onConfirm({
                kana: kana.trim(),
                romaji: parseRomajiInput(romajiText),
                emoji: emoji.trim() || '✨',
                difficulty,
              });
            }}
            className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-black text-sm rounded-2xl shadow-lg"
          >
            ✅ 採用する
          </button>
        </div>
      </div>
    </div>
  );
}

const REPORT_REASON_LABELS = {
  wrong_romaji: 'ローマ字がおかしい',
  cannot_type: '入力不可',
  not_suitable: '学習に不適',
  other: 'その他',
};

const WORD_REQUEST_STATUS_LABELS = {
  open: '未対応',
  adopted: '採用済',
  rejected: '却下',
};

function isWordRequestOpen(request) {
  return !request?.status || request.status === 'open';
}

function isTypingReportOpen(report) {
  return !report?.status || report.status === 'open';
}

function AdminTypingReportModal({ report, onClose, onSave, onResolveOnly, saving, playDecideSound }) {
  const [kana, setKana] = useState('');
  const [romajiText, setRomajiText] = useState('');
  const [emoji, setEmoji] = useState('');
  const [kanaDisplay, setKanaDisplay] = useState('');
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    if (!report) return;
    setKana(report.correctedKana || report.kana || '');
    const romajiSource = report.correctedRomaji || report.romaji || [];
    setRomajiText(Array.isArray(romajiSource) ? romajiSource.join(' / ') : romajiSource);
    setEmoji(report.correctedEmoji || report.emoji || '');
    setKanaDisplay(report.correctedKanaDisplay || report.kanaDisplay || report.kana || '');
    setAdminNote(report.adminNote || '');
  }, [report]);

  if (!report) return null;

  const buildFields = () => ({
    kana: kana.trim(),
    romaji: parseRomajiInput(romajiText),
    emoji: emoji.trim(),
    kanaDisplay: kanaDisplay.trim() || kana.trim(),
    adminNote: adminNote.trim(),
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card bg-white/95 w-full max-w-lg p-6 shadow-2xl rounded-3xl border-4 border-amber-400 max-h-[90vh] overflow-y-auto">
        <span className="text-5xl block mb-2 text-center">🚨</span>
        <h3 className="text-lg font-black text-gray-800 mb-1 text-center">タイピング問題の 確認・修正</h3>
        <p className="text-xs font-bold text-gray-500 mb-4 text-center">
          {report.playerName || 'ゲスト'} さん /
          {report.context === 'sub_event' ? ` サブイベント「${report.eventTitle || report.eventId}」` : ' 通常タイピング'}
          {report.wordIndex != null ? ` / 第${report.wordIndex + 1}問` : ''}
          {report.rallyIndex != null ? ` / ラリー${report.rallyIndex + 1}` : ''}
        </p>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-3 text-left mb-4">
          <div>
            <span className="text-[10px] font-black text-amber-700 block">報告理由</span>
            <span className="text-sm font-bold text-gray-700">
              {REPORT_REASON_LABELS[report.reason] || report.reason || '不明'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-black text-amber-700 block">報告時の かな</span>
            <span className="text-sm font-black text-gray-800">{report.kana}</span>
          </div>
          {report.displayRomaji && (
            <div>
              <span className="text-[10px] font-black text-amber-700 block">表示されていた ローマ字</span>
              <span className="text-xs font-mono text-gray-600">{report.displayRomaji}</span>
            </div>
          )}
        </div>

        <div className="space-y-3 text-left mb-4">
          <div>
            <label className="text-xs font-black text-amber-700 block mb-1">修正後の かな</label>
            <input
              value={kana}
              onChange={(e) => setKana(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-amber-100 focus:border-amber-400 focus:outline-none bg-white text-sm font-black"
            />
          </div>
          <div>
            <label className="text-xs font-black text-amber-700 block mb-1">表示用 かな（サブイベント用）</label>
            <input
              value={kanaDisplay}
              onChange={(e) => setKanaDisplay(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-amber-100 focus:border-amber-400 focus:outline-none bg-white text-sm font-bold"
            />
          </div>
          <div>
            <label className="text-xs font-black text-amber-700 block mb-1">ローマ字（ / で区切り）</label>
            <input
              value={romajiText}
              onChange={(e) => setRomajiText(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-amber-100 focus:border-amber-400 focus:outline-none bg-white text-xs font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-black text-amber-700 block mb-1">絵文字</label>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={8}
              className="w-full p-2.5 rounded-xl border-2 border-amber-100 focus:border-amber-400 focus:outline-none bg-white text-2xl text-center"
            />
          </div>
          <div>
            <label className="text-xs font-black text-amber-700 block mb-1">管理者メモ</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
              className="w-full p-2.5 rounded-xl border-2 border-amber-100 focus:border-amber-400 focus:outline-none bg-white text-xs font-bold resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              playDecideSound?.();
              onSave?.(buildFields());
            }}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-black text-sm rounded-2xl shadow-lg"
          >
            {saving ? '保存中...' : '💾 修正を保存して 解決'}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => onResolveOnly?.()}
              className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-60 text-gray-700 font-black text-xs rounded-2xl"
            >
              修正なしで 解決
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-600 font-black text-xs rounded-2xl"
            >
              とじる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerDetailModal({ player, onClose, onArchive, onGift }) {
  if (!player) return null;
  const avgMs = getAveragePlayMs(player.totalPlayMs, player.sessionCount);
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-4 border-sky-300">
        <h3 className="text-lg font-black text-sky-700 mb-4 text-center">📊 {player.name}</h3>
        <div className="space-y-3 text-sm font-bold text-gray-700">
          <div className="flex justify-between bg-sky-50 p-3 rounded-xl">
            <span>合計プレイ時間</span>
            <span className="text-sky-600">{formatDurationMs(player.totalPlayMs)}</span>
          </div>
          <div className="flex justify-between bg-sky-50 p-3 rounded-xl">
            <span>平均プレイ時間</span>
            <span className="text-sky-600">{avgMs ? formatDurationMs(avgMs) : '記録なし'}</span>
          </div>
          <div className="flex justify-between bg-sky-50 p-3 rounded-xl">
            <span>あそんだ回数</span>
            <span className="text-sky-600">{player.sessionCount || 0} 回</span>
          </div>
          <div className="flex justify-between bg-sky-50 p-3 rounded-xl">
            <span>ポイント</span>
            <span className="text-yellow-600">🪙 {player.points || 0}</span>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={() => onGift?.(player)}
            className="flex-1 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-black text-xs rounded-2xl"
          >
            🎁 プレゼント
          </button>
          <button
            type="button"
            onClick={() => onArchive?.(player)}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-2xl"
          >
            📁 アーカイブ
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-2 py-3 bg-sky-500 hover:bg-sky-600 text-white font-black rounded-2xl"
        >
          とじる
        </button>
      </div>
    </div>
  );
}

export default function AdminPanel({ players, onReloadPlayers, onBack, playDecideSound }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [wordRequests, setWordRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [giftTarget, setGiftTarget] = useState(null);
  const [detailPlayer, setDetailPlayer] = useState(null);
  const [adoptingRequest, setAdoptingRequest] = useState(null);
  const [adoptDifficulty, setAdoptDifficulty] = useState('easy');
  const [adopting, setAdopting] = useState(false);
  const [typingReports, setTypingReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [savingReport, setSavingReport] = useState(false);
  const [adminTab, setAdminTab] = useState('requests');
  const [requestFilter, setRequestFilter] = useState('open');
  const [reportFilter, setReportFilter] = useState('open');
  const [reportsLoadError, setReportsLoadError] = useState(false);
  const [reportsCloudWarning, setReportsCloudWarning] = useState(false);

  const activePlayers = useMemo(() => players.filter((p) => !p.isArchived), [players]);
  const archivedPlayers = useMemo(() => players.filter((p) => p.isArchived), [players]);

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const list = await getWordRequests();
      setWordRequests(list);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  const loadTypingReports = useCallback(async () => {
    setLoadingReports(true);
    setReportsLoadError(false);
    setReportsCloudWarning(false);
    try {
      const { reports, cloudError, hasCloudAccess } = await getTypingReports();
      setTypingReports(reports);
      if (cloudError) {
        if (reports.length > 0) {
          setReportsCloudWarning(true);
        } else {
          setReportsLoadError(true);
        }
      } else if (!hasCloudAccess) {
        setReportsCloudWarning(true);
      }
    } catch (error) {
      console.error('loadTypingReports:', error);
      setReportsLoadError(true);
      setTypingReports([]);
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      loadRequests();
      loadTypingReports();
      refreshWordCorrections();
    }
  }, [authenticated, loadRequests, loadTypingReports]);

  const pendingGiftEntries = useMemo(() => {
    const entries = [];
    players.forEach((p) => {
      (p.pendingGifts || []).forEach((gift) => {
        entries.push({ player: p, gift });
      });
    });
    entries.sort((a, b) => new Date(b.gift.createdAt || 0) - new Date(a.gift.createdAt || 0));
    return entries;
  }, [players]);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordInput('');
      playDecideSound?.();
    } else {
      alert('パスワードがちがうよ！');
      setPasswordInput('');
    }
  };

  const handleRejectRequest = async (request) => {
    if (!confirm(`「${request.kana}」のリクエストを 却下しますか？\n（履歴には 残ります）`)) return;
    const success = await updateWordRequest(request.id, {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
    });
    if (success) {
      loadRequests();
    } else {
      alert('更新に失敗しました。');
    }
  };

  const handleAdopt = async (fields) => {
    if (!adoptingRequest || adopting || !fields?.kana || !fields.romaji?.length) {
      if (!fields?.romaji?.length) alert('ローマ字を 入力してね！');
      return;
    }
    setAdopting(true);
    try {
      const adoptedData = {
        kana: fields.kana,
        romaji: fields.romaji,
        emoji: fields.emoji || '✨',
        difficulty: fields.difficulty || adoptDifficulty,
        playerName: adoptingRequest.playerName || 'ゲスト',
        playerId: adoptingRequest.playerId || null,
      };
      const successAdopt = await addAdoptedWord(adoptedData);
      if (!successAdopt) {
        alert('採用に失敗しました。接続を確認してください。');
        return;
      }
      await updateWordRequest(adoptingRequest.id, {
        status: 'adopted',
        adoptedAt: new Date().toISOString(),
        adoptedDifficulty: fields.difficulty || adoptDifficulty,
      });
      if (adoptingRequest.playerId) {
        await sendGiftToCloudPlayer(adoptingRequest.playerId, {
          points: 1000,
          message: `🎉「${fields.kana}」のリクエストが採用されたよ！\n1000ポイント プレゼント！`,
        });
      }
      await loadRequests();
      onReloadPlayers?.();
      alert(`「${fields.kana}」を採用しました！`);
      setAdoptingRequest(null);
    } finally {
      setAdopting(false);
    }
  };

  const handleSaveTypingReport = async (fields) => {
    if (!editingReport || savingReport) return;
    if (!fields.kana || !fields.romaji?.length) {
      alert('かな と ローマ字を 入力してね！');
      return;
    }
    setSavingReport(true);
    try {
      const sourceKey =
        editingReport.context === 'sub_event'
          ? buildSubEventWordKey(editingReport.eventId, editingReport.kana)
          : buildMainWordKey(editingReport.kana);

      await saveWordCorrection({
        sourceKey,
        sourceType: editingReport.context || 'main',
        originalKana: editingReport.kana,
        kana: fields.kana,
        romaji: fields.romaji,
        emoji: fields.emoji,
        kanaDisplay: fields.kanaDisplay,
      });

      await updateTypingReport(editingReport.id, {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        correctedKana: fields.kana,
        correctedRomaji: fields.romaji,
        correctedEmoji: fields.emoji,
        correctedKanaDisplay: fields.kanaDisplay,
        adminNote: fields.adminNote,
      });

      await loadTypingReports();
      await refreshWordCorrections();
      setEditingReport(null);
      alert('修正を保存して 解決しました！');
    } finally {
      setSavingReport(false);
    }
  };

  const handleResolveTypingReportOnly = async () => {
    if (!editingReport || savingReport) return;
    setSavingReport(true);
    try {
      await updateTypingReport(editingReport.id, {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
      });
      await loadTypingReports();
      setEditingReport(null);
    } finally {
      setSavingReport(false);
    }
  };

  const handleArchiveTypingReport = async (report) => {
    if (!confirm('この報告を アーカイブしますか？\n（履歴には 残ります）')) return;
    const success = await updateTypingReport(report.id, {
      status: 'archived',
      archivedAt: new Date().toISOString(),
    });
    if (success) {
      loadTypingReports();
    } else {
      alert('更新に失敗しました。');
    }
  };

  const openWordRequests = useMemo(
    () => wordRequests.filter((request) => isWordRequestOpen(request)),
    [wordRequests],
  );

  const filteredWordRequests = useMemo(() => {
    if (requestFilter === 'all') return wordRequests;
    return openWordRequests;
  }, [openWordRequests, requestFilter, wordRequests]);

  const openTypingReports = useMemo(
    () => typingReports.filter((report) => isTypingReportOpen(report)),
    [typingReports],
  );

  const filteredTypingReports = useMemo(() => {
    if (reportFilter === 'all') return typingReports;
    return openTypingReports;
  }, [openTypingReports, reportFilter, typingReports]);

  const formatReportRomaji = (report) => {
    const romaji = report.correctedRomaji || report.romaji;
    if (Array.isArray(romaji)) return romaji.join(' / ');
    return romaji || '-';
  };

  const handleCancelGift = async (playerId, giftId) => {
    if (!confirm('このプレゼントを取り消しますか？')) return;
    const success = await cancelGiftFromCloudPlayer(playerId, giftId);
    if (success) {
      onReloadPlayers?.();
    } else {
      alert('取り消しに失敗しました。');
    }
  };

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportPlayers = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const allData = await exportAllFirestoreData();
      const dataStr = JSON.stringify(allData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kids-typing-game-full-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('エクスポートに失敗しました。');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportPlayers = (event) => {
    const file = event.target.files[0];
    if (!file || isImporting) return;

    if (!confirm('インポートを実行しますか？（現在のFirebase上の同名データは上書きされます）')) {
      event.target.value = '';
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (!importedData || typeof importedData !== 'object') {
          throw new Error('JSON形式ではありません');
        }

        // 旧形式 (Array) の場合はアラート
        if (Array.isArray(importedData)) {
          alert('古い形式のバックアップファイルです。新機能の「全データ一括バックアップ」ファイルを選択してください。');
          return;
        }

        await importAllFirestoreData(importedData);
        
        alert('全データのインポートが完了しました！');
        onReloadPlayers?.();
      } catch (err) {
        alert('インポートに失敗しました。ファイル形式が正しいか確認してください。');
        console.error(err);
      } finally {
        event.target.value = '';
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const syncLocalArchiveFlag = async (playerId, isArchived) => {
    const local = await localforage.getItem('player_data_' + playerId);
    if (local) {
      await localforage.setItem('player_data_' + playerId, { ...local, isArchived });
    }
  };

  const handleArchive = async (player) => {
    if (!player?.id) return;
    if (
      !confirm(
        `プレイヤー「${player.name}」をアーカイブしますか？\n\n一覧から非表示になります（データは残ります）。`,
      )
    ) {
      return;
    }
    playDecideSound?.();
    const success = await setPlayerArchived(player.id, true);
    if (success) {
      await syncLocalArchiveFlag(player.id, true);
      setDetailPlayer(null);
      alert('アーカイブしました！');
      onReloadPlayers?.();
    } else {
      alert('アーカイブに失敗しました。接続を確認してね。');
    }
  };

  const handleUnarchive = async (player) => {
    if (!player?.id) return;
    if (!confirm(`プレイヤー「${player.name}」を復元しますか？`)) return;
    playDecideSound?.();
    const success = await setPlayerArchived(player.id, false);
    if (success) {
      await syncLocalArchiveFlag(player.id, false);
      alert('復元しました！');
      onReloadPlayers?.();
    } else {
      alert('復元に失敗しました。');
    }
  };

  if (!authenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-md rounded-3xl border-4 border-orange-300 shadow-xl max-w-md mx-auto my-8 text-center animate-pop-out">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-orange-200">
          <Key className="w-8 h-8 text-orange-500" />
        </div>
        <h3 className="text-xl font-black text-orange-600 mb-2">かんりしゃメニュー</h3>
        <p className="text-xs font-bold text-gray-500 mb-6">
          ここから先は、管理者用の画面です。
          <br />
          あいことばを入力してください。
        </p>
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3 w-full max-w-[240px] mx-auto">
          <input
            type="password"
            placeholder="○○○○"
            maxLength={4}
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="w-full text-center text-2xl tracking-[0.5em] font-black p-3 rounded-xl border-4 border-orange-200 focus:border-orange-500 focus:outline-none bg-white text-gray-700"
            autoFocus
          />
          <button
            type="submit"
            disabled={passwordInput.length < 4}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-black text-sm py-3 rounded-xl shadow-md active:scale-95 transition-all"
          >
            すすむ
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-sm py-2.5 rounded-xl transition-all"
          >
            もどる
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-1 mb-3 shrink-0 overflow-x-auto scrollbar-hide p-1 bg-gray-100/80 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              playDecideSound?.();
              setAdminTab('requests');
            }}
            className={`px-3 py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all whitespace-nowrap ${
              adminTab === 'requests'
                ? 'bg-orange-500 text-white shadow-md border-b-2 border-orange-700'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-orange-50'
            }`}
          >
            📮 リクエスト
            {openWordRequests.length > 0 && (
              <span className="ml-1 bg-white/25 px-1.5 py-0.5 rounded-full text-[10px]">
                {openWordRequests.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              playDecideSound?.();
              setAdminTab('saves');
            }}
            className={`px-3 py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all whitespace-nowrap ${
              adminTab === 'saves'
                ? 'bg-sky-500 text-white shadow-md border-b-2 border-sky-700'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-sky-50'
            }`}
          >
            👤 セーブ・アーカイブ
          </button>
          <button
            type="button"
            onClick={() => {
              playDecideSound?.();
              setAdminTab('reports');
              loadTypingReports();
            }}
            className={`px-3 py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all whitespace-nowrap ${
              adminTab === 'reports'
                ? 'bg-amber-500 text-white shadow-md border-b-2 border-amber-700'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-amber-50'
            }`}
          >
            🚨 問題報告
            {openTypingReports.length > 0 && (
              <span className="ml-1 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[10px]">
                {openTypingReports.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              playDecideSound?.();
              setAdminTab('announcements');
            }}
            className={`px-3 py-2 rounded-xl text-[11px] sm:text-xs font-black transition-all whitespace-nowrap ${
              adminTab === 'announcements'
                ? 'bg-violet-500 text-white shadow-md border-b-2 border-violet-700'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-violet-50'
            }`}
          >
            📢 お知らせ
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {adminTab === 'requests' && (
            <div className="min-h-0 flex flex-col h-full">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 shrink-0">
                <h4 className="text-sm font-black text-orange-600 flex items-center gap-1.5">
                  <span>📮</span> リクエストされた言葉（全 {wordRequests.length} 件）
                  {loadingRequests && <span className="text-[10px] text-gray-400">読込中...</span>}
                </h4>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setRequestFilter('open')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                      requestFilter === 'open'
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    未対応 ({openWordRequests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${
                      requestFilter === 'all'
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-gray-600 border border-gray-200'
                    }`}
                  >
                    履歴すべて
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto border-2 border-orange-100 rounded-2xl bg-white/70 backdrop-blur-md shadow-inner p-1 min-h-[40vh]">
                {filteredWordRequests.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-sm font-bold text-gray-400 py-16 gap-2">
                    <span className="text-4xl">{requestFilter === 'open' ? '✅' : '📮'}</span>
                    {requestFilter === 'open'
                      ? '未対応の リクエストは ありません。'
                      : 'リクエストされた 単語は まだありません。'}
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-orange-50/50 border-b border-orange-100 sticky top-0 z-10">
                        <th className="p-2 font-black text-orange-700">日時</th>
                        <th className="p-2 font-black text-orange-700">かな</th>
                        <th className="p-2 font-black text-orange-700">ローマ字</th>
                        <th className="p-2 font-black text-orange-700">なまえ</th>
                        <th className="p-2 font-black text-orange-700">状態</th>
                        <th className="p-2 font-black text-orange-700 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-50 bg-white/40">
                      {filteredWordRequests.map((req) => {
                        const requestOpen = isWordRequestOpen(req);
                        const statusKey = req.status || 'open';
                        return (
                          <tr key={req.id} className="hover:bg-orange-50/30 transition-colors">
                            <td className="p-2 text-gray-500 font-bold whitespace-nowrap">
                              {req.createdAt ? new Date(req.createdAt).toLocaleString('ja-JP') : '-'}
                            </td>
                            <td className="p-2 font-black text-gray-800">{req.kana}</td>
                            <td className="p-2 font-mono text-gray-600">
                              {Array.isArray(req.romaji) ? req.romaji.join(' / ') : req.romaji}
                            </td>
                            <td className="p-2 font-bold text-gray-600">{req.playerName || 'ゲスト'}</td>
                            <td className="p-2">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  statusKey === 'adopted'
                                    ? 'bg-green-100 text-green-700'
                                    : statusKey === 'rejected'
                                      ? 'bg-gray-100 text-gray-600'
                                      : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {WORD_REQUEST_STATUS_LABELS[statusKey] || statusKey}
                              </span>
                            </td>
                            <td className="p-2 text-center whitespace-nowrap">
                              {requestOpen ? (
                                <div className="flex gap-1 justify-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      playDecideSound?.();
                                      setAdoptingRequest(req);
                                      setAdoptDifficulty(suggestDifficultyKey(req.kana));
                                    }}
                                    className="px-2 py-1 bg-green-50 hover:bg-green-100 text-green-600 border border-green-200 rounded-lg font-black text-[10px] shadow-sm active:scale-95 transition-all"
                                  >
                                    ✅ 採用
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectRequest(req)}
                                    className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-black text-[10px] shadow-sm active:scale-95 transition-all"
                                  >
                                    却下
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {adminTab === 'saves' && (
            <div className="flex flex-col lg:flex-row gap-4 min-h-0">
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex justify-between items-center mb-1.5 shrink-0">
                  <h4 className="text-sm font-black text-sky-600">
                    <span>👤</span> セーブデータ管理（{activePlayers.length}件）
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportPlayers}
                      disabled={isExporting}
                      className="px-2 py-1 bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white rounded-lg text-xs font-black transition-colors shadow-sm active:scale-95"
                    >
                      {isExporting ? '出力中...' : '全データ エクスポート'}
                    </button>
                    <label className={`px-2 py-1 bg-amber-500 hover:bg-amber-600 ${isImporting ? 'opacity-50' : ''} text-white rounded-lg text-xs font-black transition-colors shadow-sm active:scale-95 cursor-pointer`}>
                      {isImporting ? '取込中...' : '全データ インポート'}
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleImportPlayers}
                        disabled={isImporting}
                      />
                    </label>
                  </div>
                </div>
                <div className="flex-1 overflow-auto border-2 border-sky-100 rounded-2xl bg-white/70 backdrop-blur-md shadow-inner p-1 min-h-[32vh]">
                  {activePlayers.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs font-bold text-gray-400 py-8">
                      表示中のセーブデータはありません
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-sky-50/50 border-b border-sky-100 sticky top-0 z-10">
                          <th className="p-2 font-black text-sky-700">なまえ</th>
                          <th className="p-2 font-black text-sky-700">合計</th>
                          <th className="p-2 font-black text-sky-700">平均</th>
                          <th className="p-2 font-black text-sky-700 text-center">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sky-50 bg-white/40">
                        {activePlayers.map((p) => {
                          const avgMs = getAveragePlayMs(p.totalPlayMs, p.sessionCount);
                          return (
                            <tr key={p.id} className="hover:bg-sky-50/30 transition-colors">
                              <td className="p-2 font-black text-gray-800 whitespace-nowrap">{p.name}</td>
                              <td className="p-2 font-bold text-sky-600 whitespace-nowrap">
                                {p.sessionCount > 0 ? formatDurationMs(p.totalPlayMs) : '-'}
                              </td>
                              <td className="p-2 font-bold text-sky-600 whitespace-nowrap">
                                {avgMs ? formatDurationMs(avgMs) : '-'}
                              </td>
                              <td className="p-2 text-center whitespace-nowrap">
                                <div className="flex gap-0.5 justify-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      playDecideSound?.();
                                      setDetailPlayer(p);
                                    }}
                                    className="px-1.5 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-200 rounded-lg font-black text-[9px]"
                                    title="詳細"
                                  >
                                    📊
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      playDecideSound?.();
                                      setGiftTarget(p);
                                    }}
                                    className="px-1.5 py-0.5 bg-pink-50 hover:bg-pink-100 text-pink-600 border border-pink-200 rounded-lg font-black text-[9px]"
                                    title="プレゼント"
                                  >
                                    🎁
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleArchive(p)}
                                    className="px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-black text-[8px] sm:text-[9px] whitespace-nowrap"
                                    title="アーカイブ"
                                  >
                                    📁
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div className="flex-1 min-h-0 flex flex-col gap-4 lg:max-w-md">
                {archivedPlayers.length > 0 && (
                  <div className="shrink-0 flex flex-col">
                    <h4 className="text-xs font-black text-amber-700 mb-1 shrink-0">
                      <span>📁</span> アーカイブ済み（{archivedPlayers.length}件）
                    </h4>
                    <div className="max-h-[20vh] overflow-auto border-2 border-amber-100 rounded-xl bg-amber-50/50 p-1.5 space-y-1">
                      {archivedPlayers.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between gap-2 bg-white/80 rounded-lg px-2 py-1 border border-amber-100"
                        >
                          <span className="text-[10px] font-black text-gray-700 truncate">{p.name}</span>
                          <button
                            type="button"
                            onClick={() => handleUnarchive(p)}
                            className="shrink-0 px-2 py-0.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg font-black text-[8px]"
                          >
                            復元
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex-1 min-h-0 flex flex-col">
                  <h4 className="text-sm font-black text-pink-600 mb-1.5 shrink-0">
                    <span>🎁</span> 未受け取りプレゼント
                  </h4>
                  <div className="flex-1 overflow-auto border-2 border-pink-100 rounded-2xl bg-white/70 backdrop-blur-md shadow-inner p-2 min-h-[24vh] text-[10px]">
                    {pendingGiftEntries.length === 0 ? (
                      <div className="h-full flex items-center justify-center font-bold text-gray-400 py-6">
                        未受け取りのプレゼントはありません。
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pendingGiftEntries.map(({ player, gift }) => {
                          const contents = [];
                          if (gift.points) contents.push(`🪙${gift.points}`);
                          if (gift.specialTickets) contents.push(`🎨×${gift.specialTickets}`);
                          if (gift.legendTickets) contents.push(`🌟×${gift.legendTickets}`);
                          if (gift.bgmTickets) contents.push(`🎵×${gift.bgmTickets}`);
                          if (gift.seTickets) contents.push(`🔊×${gift.seTickets}`);
                          return (
                            <div
                              key={gift.id}
                              className="bg-white/90 p-2 rounded-xl border border-pink-100 shadow-sm flex flex-col gap-1"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <span className="font-black text-gray-800 text-xs">{player.name} さんあて</span>
                                  <span className="text-gray-400 ml-1 text-[9px] font-bold">
                                    {gift.createdAt
                                      ? new Date(gift.createdAt).toLocaleString('ja-JP', {
                                          month: 'numeric',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                      : ''}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCancelGift(player.id, gift.id)}
                                  className="px-1.5 py-0.5 bg-red-50 hover:bg-red-100 text-red-500 rounded border border-red-200 font-bold text-[9px] shrink-0"
                                >
                                  とりけし
                                </button>
                              </div>
                              {contents.length > 0 && (
                                <div className="font-bold text-indigo-600">{contents.join(' / ')}</div>
                              )}
                              {gift.message && (
                                <div className="bg-gray-50 text-gray-500 p-1.5 rounded-lg font-bold border border-gray-100">
                                  💬 {gift.message}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {adminTab === 'reports' && (
            <div className="min-h-0 flex flex-col h-full">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2 shrink-0">
                <h4 className="text-sm font-black text-amber-600 flex items-center gap-1.5">
                  <span>🚨</span> タイピング問題報告（未対応 {openTypingReports.length} 件 / 全{' '}
                  {typingReports.length} 件）
                  {loadingReports && <span className="text-[10px] text-gray-400">読込中...</span>}
                </h4>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setReportFilter('open')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                      reportFilter === 'open'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    未対応のみ
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                      reportFilter === 'all'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    すべて
                  </button>
                  <button
                    type="button"
                    onClick={() => loadTypingReports()}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-white text-amber-700 border border-amber-200 hover:bg-amber-50"
                  >
                    🔄 更新
                  </button>
                </div>
              </div>

              {reportsLoadError && (
                <div className="mb-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700">
                  クラウドから 問題報告を 読み込めませんでした。
                  <br />
                  このブラウザに 保存された 報告があれば 下に 表示されます。
                  <br />
                  全端末で 共有するには Firestore ルールを デプロイしてください：
                  <code className="block mt-1 bg-white/80 px-2 py-1 rounded font-mono text-[10px]">
                    firebase deploy --only firestore:rules
                  </code>
                </div>
              )}

              {reportsCloudWarning && !reportsLoadError && (
                <div className="mb-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
                  クラウド読込に 失敗したため、この端末に 保存された 報告も あわせて 表示しています。
                  他の端末と 共有するには{' '}
                  <code className="font-mono text-[10px]">firebase deploy --only firestore:rules</code>{' '}
                  を 実行してください。
                </div>
              )}

              <div className="flex-1 overflow-auto border-2 border-amber-100 rounded-2xl bg-white/70 backdrop-blur-md shadow-inner p-1 min-h-[45vh]">
                {filteredTypingReports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-sm font-bold text-gray-400 py-16 gap-2">
                    <span className="text-4xl">{reportFilter === 'open' ? '✅' : '📋'}</span>
                    {reportFilter === 'open'
                      ? '未対応の 問題報告は ありません。'
                      : '問題報告は まだありません。'}
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-amber-50/50 border-b border-amber-100 sticky top-0 z-10">
                        <th className="p-2 font-black text-amber-700">日時</th>
                        <th className="p-2 font-black text-amber-700">キーワード</th>
                        <th className="p-2 font-black text-amber-700">ローマ字</th>
                        <th className="p-2 font-black text-amber-700">場所</th>
                        <th className="p-2 font-black text-amber-700">理由</th>
                        <th className="p-2 font-black text-amber-700">報告者</th>
                        <th className="p-2 font-black text-amber-700">状態</th>
                        <th className="p-2 font-black text-amber-700 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-50 bg-white/40">
                      {filteredTypingReports.map((report) => (
                        <tr key={report.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="p-2 text-gray-500 font-bold whitespace-nowrap align-top">
                            {report.createdAt ? new Date(report.createdAt).toLocaleString('ja-JP') : '-'}
                          </td>
                          <td className="p-2 align-top">
                            <div className="font-black text-gray-800">
                              {report.emoji ? `${report.emoji} ` : ''}
                              {report.kanaDisplay || report.kana || '-'}
                            </div>
                            {report.kanaDisplay && report.kanaDisplay !== report.kana && (
                              <div className="text-[10px] text-gray-500 font-bold mt-0.5">
                                入力: {report.kana}
                              </div>
                            )}
                          </td>
                          <td className="p-2 font-mono text-gray-600 align-top max-w-[120px] break-all">
                            {formatReportRomaji(report)}
                          </td>
                          <td className="p-2 font-bold text-gray-600 whitespace-nowrap align-top">
                            {report.context === 'sub_event'
                              ? `サブ${report.rallyIndex != null ? ` R${report.rallyIndex + 1}` : ''}`
                              : `通常${report.wordIndex != null ? ` Q${report.wordIndex + 1}` : ''}`}
                          </td>
                          <td className="p-2 font-bold text-gray-600 align-top">
                            {REPORT_REASON_LABELS[report.reason] || report.reason || '-'}
                          </td>
                          <td className="p-2 font-bold text-gray-600 align-top whitespace-nowrap">
                            {report.playerName || 'ゲスト'}
                          </td>
                          <td className="p-2 align-top">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                                report.status === 'resolved'
                                  ? 'bg-green-100 text-green-700'
                                  : report.status === 'archived'
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {report.status === 'resolved'
                                ? '解決済'
                                : report.status === 'archived'
                                  ? 'アーカイブ'
                                  : '未対応'}
                            </span>
                          </td>
                          <td className="p-2 text-center whitespace-nowrap align-top">
                            <div className="flex gap-1 justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  playDecideSound?.();
                                  setEditingReport(report);
                                }}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-black text-[10px]"
                              >
                                📝 確認
                              </button>
                              {isTypingReportOpen(report) && (
                                <button
                                  type="button"
                                  onClick={() => handleArchiveTypingReport(report)}
                                  className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 rounded-lg font-black text-[10px]"
                                >
                                  📦
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {adminTab === 'announcements' && (
            <AdminAnnouncementsSection players={players} playDecideSound={playDecideSound} />
          )}
        </div>

        <button
          type="button"
          onClick={onBack}
          className="mt-3 shrink-0 w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-black text-sm py-2.5 rounded-xl transition-all"
        >
          もどる
        </button>
      </div>

      {giftTarget && (
        <AdminGiftModal
          player={giftTarget}
          onClose={() => setGiftTarget(null)}
          onSent={onReloadPlayers}
          playDecideSound={playDecideSound}
        />
      )}
      {detailPlayer && (
        <PlayerDetailModal
          player={detailPlayer}
          onClose={() => setDetailPlayer(null)}
          onArchive={(p) => {
            setDetailPlayer(null);
            handleArchive(p);
          }}
          onGift={(p) => {
            setDetailPlayer(null);
            setGiftTarget(p);
          }}
        />
      )}
      {adoptingRequest && (
        <AdminAdoptModal
          request={adoptingRequest}
          difficulty={adoptDifficulty}
          onDifficultyChange={setAdoptDifficulty}
          onConfirm={handleAdopt}
          onCancel={() => setAdoptingRequest(null)}
          playDecideSound={playDecideSound}
        />
      )}
      {editingReport && (
        <AdminTypingReportModal
          report={editingReport}
          onClose={() => setEditingReport(null)}
          onSave={handleSaveTypingReport}
          onResolveOnly={handleResolveTypingReportOnly}
          saving={savingReport}
          playDecideSound={playDecideSound}
        />
      )}
    </>
  );
}
