import { WRONG_PHRASES, SUB_EVENT_SPAWN_POSITIONS, TYPING_SUB_EVENTS } from '../data/subEvents';
import { generateAllRomaji } from '../constants';

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

export function buildChoices(correctKana) {
  const wrongPool = WRONG_PHRASES.filter((phrase) => phrase !== correctKana);
  const wrongChoices = shuffle(wrongPool).slice(0, 2);
  return shuffle([correctKana, ...wrongChoices]);
}

export function getChoiceDisplay(choice, rally) {
  if (choice === rally?.kana) return rally.kanaDisplay || rally.kana;
  return choice;
}

export function getValidRomajiList(rally) {
  const manual = Array.isArray(rally?.romaji) ? rally.romaji : [];
  const auto = rally?.kana ? generateAllRomaji(rally.kana) : [];
  return [...new Set([...manual, ...auto])];
}

export function spawnRandomSubEvents(solvedIds = [], existingActive = []) {
  const solved = new Set(solvedIds);
  const activeIds = new Set(existingActive.map((entry) => entry.eventId));
  const available = TYPING_SUB_EVENTS.filter(
    (event) => !solved.has(event.id) && !activeIds.has(event.id),
  );

  if (available.length === 0) return [];

  const spawnCount = Math.min(available.length, 1 + Math.floor(Math.random() * 3));
  const picked = shuffle(available).slice(0, spawnCount);
  const positions = shuffle(SUB_EVENT_SPAWN_POSITIONS).slice(0, spawnCount);

  return picked.map((event, index) => ({
    eventId: event.id,
    top: positions[index].top,
    left: positions[index].left,
    delay: `${(index * 0.3).toFixed(1)}s`,
  }));
}

export function calcSubEventReward() {
  const points = 1000 + Math.floor(Math.random() * 2001);
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
