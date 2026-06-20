/** お知らせバナー用（public フォルダの画像） */
export const ANNOUNCEMENT_BANNERS = [
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

export function getAnnouncementBannerUrl(bannerIdOrUrl) {
  if (!bannerIdOrUrl) return null;
  if (bannerIdOrUrl.startsWith('/')) return bannerIdOrUrl;
  return ANNOUNCEMENT_BANNERS.find((b) => b.id === bannerIdOrUrl)?.url || null;
}
