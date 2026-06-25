/** お知らせバナー用（public フォルダの画像） */
export const ANNOUNCEMENT_BANNERS = [
  {
    id: 'hiragana_frame',
    url: '/announcement_hiragana_frame.webp',
    label: 'ひらがなチャレンジ（フレームガチャ）',
  },
  { id: 'mascot', url: '/hiragana_mascot.png', label: 'ひらがなマスコット' },
  { id: 'logo', url: '/logo.webp', label: 'ロゴ' },
  { id: 'title', url: '/title_bg.webp', label: 'タイトル背景' },
  { id: 'mall', url: '/mall_home_bg.webp', label: 'ひろば' },
  { id: 'shop', url: '/shop_bg.webp', label: 'ショップ' },
  { id: 'gacha', url: '/gacha_normal.webp', label: 'ガチャ' },
  { id: 'space', url: '/space_bg.webp', label: '宇宙' },
  { id: 'candy', url: '/candy_bg.webp', label: 'キャンディ' },
  { id: 'dino', url: '/dino_bg.webp', label: '恐竜' },
  { id: 'castle', url: '/castle_bg.webp', label: 'お城' },
];

const HIRAGANA_FRAME_BANNER_URL = '/announcement_hiragana_frame.webp';

const TITLE_BANNER_FALLBACKS = [
  { pattern: /ひらがなチャレンジ/, url: HIRAGANA_FRAME_BANNER_URL },
];

function normalizeBannerPath(value) {
  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const byId = ANNOUNCEMENT_BANNERS.find((b) => b.id === trimmed);
  if (byId) return byId.url;

  let path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  if (path.includes('announcement_hiragana_frame')) {
    return HIRAGANA_FRAME_BANNER_URL;
  }

  return path;
}

export function getAnnouncementBannerUrl(bannerIdOrUrl) {
  if (!bannerIdOrUrl || typeof bannerIdOrUrl !== 'string') return null;
  return normalizeBannerPath(bannerIdOrUrl);
}

/** bannerUrl 未設定の既存お知らせ向け（タイトルから推定） */
export function resolveAnnouncementBannerUrl(announcement) {
  const direct = getAnnouncementBannerUrl(announcement?.bannerUrl);
  if (direct) return direct;

  const title = announcement?.title || '';
  for (const rule of TITLE_BANNER_FALLBACKS) {
    if (rule.pattern.test(title)) return rule.url;
  }
  return null;
}
