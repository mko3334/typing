import { WRONG_PHRASES, SUB_EVENT_SPAWN_POSITIONS, TYPING_SUB_EVENTS } from '../data/subEvents';
import { generateAllRomaji } from '../constants';
import { applyCorrectionToRally } from './wordCorrections';

const TICKET_TYPES = ['special', 'bgm', 'se', 'legend'];
const TICKET_DROP_RATE = 0.12;

function shuffle(array) {
  const next = [...array];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function parsePercent(value) {
  return Number.parseFloat(String(value).replace('%', ''));
}

function pickSpreadPositions(count) {
  const pool = shuffle(SUB_EVENT_SPAWN_POSITIONS);
  const picked = [];

  for (const pos of pool) {
    if (picked.length >= count) break;
    const tooClose = picked.some((existing) => {
      const topDiff = Math.abs(parsePercent(existing.top) - parsePercent(pos.top));
      const leftDiff = Math.abs(parsePercent(existing.left) - parsePercent(pos.left));
      return topDiff < 10 && leftDiff < 12;
    });
    if (!tooClose) picked.push(pos);
  }

  while (picked.length < count && picked.length < pool.length) {
    const candidate = pool[picked.length];
    if (!picked.includes(candidate)) picked.push(candidate);
    else break;
  }

  return picked;
}

export function buildChoices(correctKana) {
  const wrongPool = WRONG_PHRASES.filter((phrase) => phrase !== correctKana);
  const wrongChoices = shuffle(wrongPool).slice(0, 2);
  return shuffle([correctKana, ...wrongChoices]);
}

export function getChoiceDisplay(choice, rally) {
  if (choice === rally?.kana) return rally.kanaDisplay || rally.kana;
  return choice;
}

export function getValidRomajiList(rally, eventId) {
  const corrected = applyCorrectionToRally(rally, eventId);
  const manual = Array.isArray(corrected?.romaji) ? corrected.romaji : [];
  const auto = corrected?.kana ? generateAllRomaji(corrected.kana) : [];
  return [...new Set([...manual, ...auto])];
}

export const PLAZA_SUB_EVENT_MAX = 3;
export const PLAZA_SUB_EVENT_MIN = 1;

export function getActivePlazaSubEvents(player) {
  const solved = new Set(player?.solvedSubEventIds || []);
  return (player?.plazaSubEvents || [])
    .filter((entry) => !solved.has(entry.eventId))
    .slice(0, PLAZA_SUB_EVENT_MAX);
}

export function spawnRandomSubEvents(solvedIds = [], existingActive = [], spawnCount = null) {
  const solved = new Set(solvedIds);
  const activeIds = new Set(existingActive.map((entry) => entry.eventId));
  const available = TYPING_SUB_EVENTS.filter(
    (event) => !solved.has(event.id) && !activeIds.has(event.id),
  );

  if (available.length === 0) return [];

  const openSlots = Math.max(0, PLAZA_SUB_EVENT_MAX - existingActive.length);
  const slots =
    spawnCount !== null
      ? Math.min(available.length, openSlots, spawnCount)
      : Math.min(available.length, openSlots);
  if (slots <= 0) return [];

  const picked = shuffle(available).slice(0, slots);
  const positions = pickSpreadPositions(slots);

  return picked.map((event, index) => ({
    eventId: event.id,
    top: positions[index].top,
    left: positions[index].left,
    delay: `${(index * 0.3).toFixed(1)}s`,
  }));
}

/** タイピングモードクリア時: 広場のサブクエストは同時に最大3件まで */
export function spawnSubEventsAfterTypingClear(solvedIds = [], existingActive = []) {
  const openSlots = Math.max(0, PLAZA_SUB_EVENT_MAX - existingActive.length);
  if (openSlots <= 0) return [];

  const desiredTotal =
    PLAZA_SUB_EVENT_MIN + Math.floor(Math.random() * (PLAZA_SUB_EVENT_MAX - PLAZA_SUB_EVENT_MIN + 1));
  const spawnCount = Math.min(openSlots, Math.max(0, desiredTotal - existingActive.length));
  if (spawnCount <= 0) return [];

  return spawnRandomSubEvents(solvedIds, existingActive, spawnCount);
}

export function appendSubEventsAfterTypingClear(player) {
  const solvedIds = player?.solvedSubEventIds || [];
  const active = getActivePlazaSubEvents(player);
  const spawned = spawnSubEventsAfterTypingClear(solvedIds, active);
  if (spawned.length === 0) return active;
  return [...active, ...spawned].slice(0, PLAZA_SUB_EVENT_MAX);
}

export function calcSubEventReward() {
  const points = 500 + Math.floor(Math.random() * 501);
  const ticketRoll = Math.random();

  if (ticketRoll >= TICKET_DROP_RATE) {
    return { points, ticket: null };
  }

  const type = TICKET_TYPES[Math.floor(Math.random() * TICKET_TYPES.length)];
  return { points, ticket: { type, count: 1 } };
}

export function getSubEventById(eventId) {
  return TYPING_SUB_EVENTS.find((event) => event.id === eventId) || null;
}

export function ticketUpdatesFromReward(ticket) {
  if (!ticket) return {};
  if (ticket.type === 'special') return { specialTickets: ticket.count };
  if (ticket.type === 'bgm') return { bgmTickets: ticket.count };
  if (ticket.type === 'se') return { seTickets: ticket.count };
  if (ticket.type === 'legend') return { legendTickets: ticket.count };
  return {};
}
