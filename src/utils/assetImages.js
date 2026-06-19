const WEBP_BY_PNG = {
  '/bg.png': '/bg.webp',
  '/space_bg.png': '/space_bg.webp',
  '/forest_bg.png': '/forest_bg.webp',
  '/candy_bg.png': '/candy_bg.webp',
  '/underwater_bg.png': '/underwater_bg.webp',
  '/castle_bg.png': '/castle_bg.webp',
  '/dino_bg.png': '/dino_bg.webp',
  '/title_bg.png': '/title_bg.webp',
  '/mall_home_bg.png': '/mall_home_bg.webp',
  '/logo.png': '/logo.webp',
  '/shop_bg.png': '/shop_bg.webp',
  '/shopping_mall_empty_bg.png': '/shopping_mall_empty_bg.webp',
  '/gacha_background.png': '/gacha_background.webp',
  '/gacha_legend.png': '/gacha_legend.webp',
  '/gacha_music.png': '/gacha_music.webp',
  '/gacha_normal.png': '/gacha_normal.webp',
  '/gacha_se.png': '/gacha_se.webp',
};

export function optimizedAssetUrl(url) {
  if (!url) return url;
  return WEBP_BY_PNG[url] || url.replace(/\.png$/i, '.webp');
}

export function preloadImage(url) {
  if (!url || typeof window === 'undefined') return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

export function preloadImages(urls) {
  const unique = [...new Set(urls.filter(Boolean))];
  return Promise.all(unique.map((url) => preloadImage(url)));
}

export const CRITICAL_IMAGE_URLS = [
  optimizedAssetUrl('/title_bg.png'),
  optimizedAssetUrl('/logo.png'),
  optimizedAssetUrl('/mall_home_bg.png'),
  optimizedAssetUrl('/bg.png'),
  optimizedAssetUrl('/space_bg.png'),
];
