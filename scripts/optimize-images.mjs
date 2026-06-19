import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
const targets = [
  'title_bg.png',
  'mall_home_bg.png',
  'logo.png',
  'bg.png',
  'space_bg.png',
  'forest_bg.png',
  'candy_bg.png',
  'underwater_bg.png',
  'castle_bg.png',
  'dino_bg.png',
  'shop_bg.png',
  'shopping_mall_empty_bg.png',
  'gacha_background.png',
  'gacha_legend.png',
  'gacha_music.png',
  'gacha_normal.png',
  'gacha_se.png',
];

for (const file of targets) {
  const input = path.join(publicDir, file);
  if (!fs.existsSync(input)) {
    console.warn('skip (missing):', file);
    continue;
  }

  const output = path.join(publicDir, file.replace(/\.png$/i, '.webp'));
  await sharp(input)
    .webp({ quality: 78, effort: 4 })
    .toFile(output);

  const before = fs.statSync(input).size;
  const after = fs.statSync(output).size;
  console.log(`${file} -> ${path.basename(output)} (${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB)`);
}
