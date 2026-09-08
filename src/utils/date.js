/**
 * タイピングショーのシーズンIDを計算する
 * シーズン1: 旧ランキング（すべてのアカウントの過去のデータ）
 * シーズン2〜8: 2026年7月28日（火）09:00 JST 〜 2026年9月14日（月）08:59:59 JST（火曜更新）
 * シーズン9以降: 2026年9月14日（月）09:00 JST 以降、毎週月曜日 09:00 JST 更新
 */

const TUESDAY_EPOCH = Date.UTC(2026, 6, 28, 0, 0, 0); // 2026-07-28 00:00:00 UTC (09:00 JST)
const MONDAY_EPOCH = Date.UTC(2026, 8, 14, 0, 0, 0);  // 2026-09-14 00:00:00 UTC (09:00 JST)
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function getCurrentSeasonId(date = new Date()) {
  const now = date.getTime();
  
  if (now < TUESDAY_EPOCH) return 1;
  
  if (now >= MONDAY_EPOCH) {
    return Math.floor((now - MONDAY_EPOCH) / ONE_WEEK_MS) + 9;
  }
  
  return Math.floor((now - TUESDAY_EPOCH) / ONE_WEEK_MS) + 2;
}

/**
 * 指定したシーズンの開始日時を取得する
 */
export function getSeasonStartDate(seasonId) {
  if (seasonId === 1) {
    return new Date(0); // 過去すべて
  }
  if (seasonId >= 9) {
    const startMs = MONDAY_EPOCH + (seasonId - 9) * ONE_WEEK_MS;
    return new Date(startMs);
  }
  const startMs = TUESDAY_EPOCH + (seasonId - 2) * ONE_WEEK_MS;
  return new Date(startMs);
}

/**
 * 指定したシーズンの終了日時を取得する
 */
export function getSeasonEndDate(seasonId) {
  if (seasonId === 1) {
    return new Date(TUESDAY_EPOCH - 1);
  }
  if (seasonId === 8) {
    return new Date(MONDAY_EPOCH - 1);
  }
  if (seasonId >= 9) {
    const endMs = MONDAY_EPOCH + (seasonId - 8) * ONE_WEEK_MS - 1;
    return new Date(endMs);
  }
  const endMs = TUESDAY_EPOCH + (seasonId - 1) * ONE_WEEK_MS - 1;
  return new Date(endMs);
}

