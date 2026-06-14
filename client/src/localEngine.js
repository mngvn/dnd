// A fully in-browser version of the game logic, used for the static
// GitHub Pages demo where there is no server. Mirrors the server's dice,
// rules, and mock Dungeon Master so a single player can experience the
// whole flow offline.

// ---- Dice ----
const NOTATION = /^(\d*)d(\d+)([+-]\d+)?$/i;

export function abilityModifier(score) {
  return Math.floor((score - 10) / 2);
}

let counter = 0;

export function roll(notation, player, reason, bonus = 0) {
  const m = (notation || '').trim().toLowerCase().match(NOTATION);
  if (!m) return null;
  const count = m[1] ? parseInt(m[1], 10) : 1;
  const sides = parseInt(m[2], 10);
  const baseMod = m[3] ? parseInt(m[3], 10) : 0;
  if (count < 1 || count > 100 || sides < 2 || sides > 1000) return null;
  const rolls = [];
  for (let i = 0; i < count; i++) rolls.push(Math.floor(Math.random() * sides) + 1);
  const modifier = baseMod + bonus;
  const total = rolls.reduce((a, b) => a + b, 0) + modifier;
  return {
    id: `roll_${Date.now()}_${counter++}`,
    player,
    notation,
    rolls,
    modifier,
    total,
    reason,
    timestamp: Date.now(),
  };
}

// ---- Mock Dungeon Master ----
const OPENINGS = [
  'A cold wind threads through the pines as your party crests the ridge. Below, the village of Hollowmere huddles in mist, its single bell tolling though no hand pulls the rope. Smoke rises from a tavern, but the streets are empty.',
  'Torchlight gutters against ancient stone. You stand at the mouth of the Sunken Vault, its iron doors cracked just wide enough to slip through. Somewhere deep within, something drags a heavy chain across the floor.',
  'The caravan master pays you in silver and warnings: "Stay on the road." Now the road forks, unmarked, beneath a sky the color of a bruise. To the left, birdsong. To the right, a silence that feels watched.',
];

const REACTIONS = [
  'The shadows shift in response, and the air grows taut with possibility.',
  'Your choice ripples outward — somewhere, unseen, something takes notice.',
  'For a heartbeat the world holds its breath, then answers in kind.',
  'The path ahead reshapes itself around your decision.',
];

const SUGGESTIONS = [
  'Investigate the source of the noise',
  'Search the area for anything useful',
  'Ready your weapons and advance cautiously',
  'Try to talk your way through',
  'Look for another way around',
  'Make camp and rest before continuing',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function openingScene() {
  return {
    title: 'A New Adventure',
    description: pick(OPENINGS),
    suggestedActions: [SUGGESTIONS[0], SUGGESTIONS[1], SUGGESTIONS[2]],
  };
}

export function reactScene(actionText) {
  const shuffled = [...SUGGESTIONS].sort(() => Math.random() - 0.5).slice(0, 3);
  return {
    title: 'The Story Unfolds',
    description: `You act: "${actionText}". ${pick(REACTIONS)}`,
    suggestedActions: shuffled,
  };
}

let entryCounter = 0;
export function makeEntry(kind, author, text) {
  return {
    id: `e_${Date.now()}_${entryCounter++}`,
    kind,
    author,
    text,
    timestamp: Date.now(),
  };
}

export function makeCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 4; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}
