import { TITLES } from '../constants';
import { HIRAGANA_ROWS } from '../data/hiraganaRows';
import { computeAchievements } from './gacha';

export const HIRAGANA_STAGE_POINTS = 500;
export const HIRAGANA_ORDER_TEST_POINTS = 1000;
export const HIRAGANA_SHUFFLE_TEST_POINTS = 2000;

const ALL_ROW_TICKETS = {
  specialTickets: 1,
  bgmTickets: 1,
  seTickets: 1,
  legendTickets: 1,
};

export function buildStageClearReward({ row, isFirstClear, allRowsJustCompleted, allRowsRewardClaimed }) {
  const newTitleIds = [];
  const nextClearedCount = isFirstClear ? undefined : null;

  if (isFirstClear) {
    if (row.id === 'a') newTitleIds.push('hiragana_starter');
  }

  const reward = {
    kind: 'stage',
    title: 'ステージクリア！',
    subtitle: `${row.label} を マスターしたよ！`,
    points: HIRAGANA_STAGE_POINTS,
    tickets: {},
    newTitleIds,
    row,
    allRowsJustCompleted,
    isFirstClear,
  };

  if (allRowsJustCompleted) {
    newTitleIds.push('hiragana_master');
    if (!allRowsRewardClaimed) {
      reward.tickets = { ...ALL_ROW_TICKETS };
    }
  }

  return reward;
}

export function buildOrderTestCompleteReward() {
  return {
    kind: 'order',
    title: 'じゅんばんテスト クリア！',
    subtitle: 'じゅんばんテスト クリア！',
    points: HIRAGANA_ORDER_TEST_POINTS,
    tickets: {},
    newTitleIds: [],
  };
}

export function buildShuffleCompleteReward() {
  return {
    kind: 'shuffle',
    title: 'シャッフルテスト クリア！',
    subtitle: 'シャッフルテスト クリア！',
    points: HIRAGANA_SHUFFLE_TEST_POINTS,
    tickets: {},
    newTitleIds: ['shuffle_star'],
  };
}

export function getUnlockedTitleObjects(titleIds) {
  const map = new Map(TITLES.map((title) => [title.id, title]));
  return titleIds.map((id) => map.get(id)).filter(Boolean);
}

export function applyHiraganaRewardToPlayer(player, reward, hiraganaProgressPatch = {}) {
  const tickets = reward.tickets || {};
  const base = {
    ...player,
    points: (player?.points || 0) + (reward.points || 0),
    specialTickets: (player?.specialTickets || 0) + (tickets.specialTickets || 0),
    bgmTickets: (player?.bgmTickets || 0) + (tickets.bgmTickets || 0),
    seTickets: (player?.seTickets || 0) + (tickets.seTickets || 0),
    legendTickets: (player?.legendTickets || 0) + (tickets.legendTickets || 0),
    hiraganaProgress: {
      ...(player?.hiraganaProgress || {}),
      ...hiraganaProgressPatch,
    },
  };

  const manualTitles = new Set(player?.achievements || ['rookie']);
  (reward.newTitleIds || []).forEach((id) => manualTitles.add(id));

  const cleared = base.hiraganaProgress?.clearedRowIds || [];
  if (cleared.length >= 5) manualTitles.add('hiragana_challenger');

  const computed = computeAchievements(base, player?.collection || {});
  base.achievements = [...new Set([...computed, ...manualTitles])];
  return base;
}

export function isAllRowsCleared(clearedRowIds) {
  return clearedRowIds.length >= HIRAGANA_ROWS.length;
}
