import { TITLES } from '../constants';
import { HIRAGANA_ROWS } from '../data/hiraganaRows';
import { computeAchievements } from './gacha';

export const HIRAGANA_PRACTICE_POINTS = 100;

const ALL_ROW_TICKETS = {
  specialTickets: 1,
  bgmTickets: 1,
  seTickets: 1,
  legendTickets: 1,
};

function filterNewTitleIds(titleIds, existingAchievements = []) {
  const owned = new Set(existingAchievements);
  return (titleIds || []).filter((id) => !owned.has(id));
}

export function buildPracticeClearReward({
  row,
  isFirstClear,
  allRowsJustCompleted,
  allRowsRewardClaimed,
  practiceFrameTicketGranted = false,
  existingAchievements = [],
}) {
  const newTitleIds = [];

  if (isFirstClear && row.id === 'a') {
    newTitleIds.push('hiragana_starter');
  }

  const reward = {
    kind: 'practice',
    title: 'れんしゅうクリア！',
    subtitle: `${row.label} を クリアしたよ！`,
    points: HIRAGANA_PRACTICE_POINTS,
    tickets: {},
    newTitleIds: [],
    row,
    allRowsJustCompleted,
    isFirstClear,
  };

  if (allRowsJustCompleted) {
    newTitleIds.push('hiragana_master');
    if (!allRowsRewardClaimed) {
      reward.tickets = { ...ALL_ROW_TICKETS };
    }
    if (!practiceFrameTicketGranted) {
      reward.tickets = {
        ...reward.tickets,
        frameTickets: 1,
      };
    }
  }

  reward.newTitleIds = filterNewTitleIds(newTitleIds, existingAchievements);
  return reward;
}

export function buildTestCompleteReward({
  totalPoints,
  rowResults,
  maxCombo,
  isFirstShuffleClear = false,
  isAllRowsTest = false,
  testFrameTicketGranted = false,
  existingAchievements = [],
}) {
  const perfectRows = rowResults.filter((row) => row.misses === 0).length;
  const newTitleIds = [];
  if (isFirstShuffleClear) {
    newTitleIds.push('shuffle_star');
  }

  const tickets = {};
  if (isAllRowsTest && !testFrameTicketGranted) {
    tickets.frameTickets = 1;
  }

  return {
    kind: 'test',
    title: 'テストおわり！',
    subtitle:
      perfectRows > 0
        ? `${perfectRows}行 パーフェクト！ コンボ最高 ${maxCombo}`
        : `コンボ最高 ${maxCombo} — つぎは パーフェクトを めざそう！`,
    points: totalPoints,
    tickets,
    newTitleIds: filterNewTitleIds(newTitleIds, existingAchievements),
    rowResults,
    maxCombo,
    perfectRows,
  };
}

/** @deprecated use buildPracticeClearReward */
export function buildStageClearReward(opts) {
  return buildPracticeClearReward(opts);
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
    frameTickets: (player?.frameTickets || 0) + (tickets.frameTickets || 0),
    hiraganaProgress: {
      ...(player?.hiraganaProgress || {}),
      ...hiraganaProgressPatch,
      practiceFrameGachaClaimed:
        hiraganaProgressPatch.practiceFrameGachaClaimed === true ||
        (player?.hiraganaProgress?.practiceFrameGachaClaimed === true) ||
        ((tickets.frameTickets || 0) > 0 && reward.kind === 'practice'),
      testFrameGachaClaimed:
        hiraganaProgressPatch.testFrameGachaClaimed === true ||
        (player?.hiraganaProgress?.testFrameGachaClaimed === true) ||
        ((tickets.frameTickets || 0) > 0 && reward.kind === 'test'),
    },
  };

  const manualTitles = new Set(player?.achievements || ['rookie']);
  filterNewTitleIds(reward.newTitleIds, player?.achievements).forEach((id) => manualTitles.add(id));

  const cleared = base.hiraganaProgress?.clearedRowIds || [];
  if (cleared.length >= HIRAGANA_ROWS.length) manualTitles.add('hiragana_challenger');

  const computed = computeAchievements(base, player?.collection || {});
  base.achievements = [...new Set([...computed, ...manualTitles])];
  return base;
}

export function isAllRowsCleared(clearedRowIds) {
  return clearedRowIds.length >= HIRAGANA_ROWS.length;
}
