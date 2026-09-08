/**
 * タイピングショーのシーズンIDを計算する
 * シーズン1: 旧ランキング（すべてのアカウントの過去のデータ）
 * シーズン2: 2026年7月28日（火）09:00 JST = 2026-07-28T00:00:00Z 以降
 * 以降1週間（7日間）ごとにシーズンが変わる
 */
export function getCurrentSeasonId(date = new Date()) {
  // 月は0始まり (6 = 7月)
  const epoch = Date.UTC(2026, 6, 28, 0, 0, 0); 
  const now = date.getTime();
  
  // 基準日より前の場合は強制的にシーズン1とする
  if (now < epoch) return 1;
  
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  return Math.floor((now - epoch) / oneWeekMs) + 2;
}

/**
 * 指定したシーズンの開始日時を取得する
 */
export function getSeasonStartDate(seasonId) {
  if (seasonId === 1) {
    return new Date(0); // 過去すべて
  }
  const epoch = Date.UTC(2026, 6, 28, 0, 0, 0);
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const startMs = epoch + (seasonId - 2) * oneWeekMs;
  return new Date(startMs);
}

/**
 * 指定したシーズンの終了日時を取得する
 */
export function getSeasonEndDate(seasonId) {
  if (seasonId === 1) {
    const epoch = Date.UTC(2026, 6, 28, 0, 0, 0);
    return new Date(epoch - 1);
  }
  const epoch = Date.UTC(2026, 6, 28, 0, 0, 0);
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  // 次のシーズンの開始日時の1ミリ秒前
  const endMs = epoch + (seasonId - 1) * oneWeekMs - 1;
  return new Date(endMs);
}
