// Client-side copy of the playable classes (mirrors server/src/classes.ts).
// Bundling this lets the character-select screen and the offline demo work
// without a running server.
export const CLASSES = [
  {
    id: 'fighter',
    name: 'Fighter',
    blurb: 'A hardened warrior. Strong, durable, and deadly in melee.',
    hitPoints: 12,
    armorClass: 16,
    baseStats: { STR: 16, DEX: 13, CON: 15, INT: 9, WIS: 11, CHA: 10 },
    abilities: [
      { id: 'power_attack', name: 'Power Attack', description: 'A heavy melee strike that trades accuracy for damage.', check: 'STR' },
      { id: 'second_wind', name: 'Second Wind', description: 'Catch your breath to recover some hit points.', check: 'CON' },
    ],
    startingInventory: ['Longsword', 'Shield', 'Chain Mail', 'Healing Potion', '15 gold'],
  },
  {
    id: 'wizard',
    name: 'Wizard',
    blurb: 'A scholar of the arcane. Fragile, but commands devastating magic.',
    hitPoints: 7,
    armorClass: 12,
    baseStats: { STR: 8, DEX: 14, CON: 12, INT: 17, WIS: 13, CHA: 11 },
    abilities: [
      { id: 'firebolt', name: 'Fire Bolt', description: 'Hurl a mote of fire at a target.', check: 'INT' },
      { id: 'arcane_recall', name: 'Arcane Recall', description: 'Recall obscure lore about the world.', check: 'INT' },
    ],
    startingInventory: ['Quarterstaff', 'Spellbook', 'Component Pouch', 'Scroll of Shield', '10 gold'],
  },
  {
    id: 'rogue',
    name: 'Rogue',
    blurb: 'A nimble trickster. Excels at stealth, traps, and precise strikes.',
    hitPoints: 9,
    armorClass: 14,
    baseStats: { STR: 11, DEX: 17, CON: 12, INT: 13, WIS: 12, CHA: 14 },
    abilities: [
      { id: 'sneak_attack', name: 'Sneak Attack', description: 'Strike a distracted foe for extra damage.', check: 'DEX' },
      { id: 'pick_lock', name: 'Pick Lock', description: 'Disable locks and traps with deft fingers.', check: 'DEX' },
    ],
    startingInventory: ['Daggers (2)', "Thieves' Tools", 'Leather Armor', 'Smoke Bomb', '20 gold'],
  },
  {
    id: 'cleric',
    name: 'Cleric',
    blurb: 'A holy champion. Heals allies and smites the wicked.',
    hitPoints: 10,
    armorClass: 15,
    baseStats: { STR: 14, DEX: 10, CON: 14, INT: 11, WIS: 16, CHA: 12 },
    abilities: [
      { id: 'heal', name: 'Cure Wounds', description: 'Channel divine energy to heal an ally.', check: 'WIS' },
      { id: 'turn_undead', name: 'Turn Undead', description: 'Repel undead with holy radiance.', check: 'WIS' },
    ],
    startingInventory: ['Mace', 'Holy Symbol', 'Scale Mail', 'Healing Potion (2)', '12 gold'],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    blurb: 'A wilderness hunter. A keen tracker and unerring archer.',
    hitPoints: 10,
    armorClass: 14,
    baseStats: { STR: 13, DEX: 16, CON: 13, INT: 11, WIS: 14, CHA: 10 },
    abilities: [
      { id: 'aimed_shot', name: 'Aimed Shot', description: 'Line up a careful arrow for a precise hit.', check: 'DEX' },
      { id: 'track', name: 'Track', description: 'Read the land for tracks and signs.', check: 'WIS' },
    ],
    startingInventory: ['Longbow', 'Arrows (20)', 'Short Sword', 'Leather Armor', "Explorer's Pack"],
  },
  {
    id: 'bard',
    name: 'Bard',
    blurb: 'A silver-tongued performer. Inspires allies and charms foes.',
    hitPoints: 9,
    armorClass: 13,
    baseStats: { STR: 10, DEX: 14, CON: 12, INT: 12, WIS: 11, CHA: 17 },
    abilities: [
      { id: 'inspire', name: 'Bardic Inspiration', description: 'Bolster an ally with a rousing performance.', check: 'CHA' },
      { id: 'persuade', name: 'Silver Tongue', description: 'Sway hearts and minds with words.', check: 'CHA' },
    ],
    startingInventory: ['Rapier', 'Lute', 'Leather Armor', 'Disguise Kit', '15 gold'],
  },
];

export function getClass(id) {
  return CLASSES.find((c) => c.id === id);
}

export function buildCharacter(classId) {
  const cls = getClass(classId);
  if (!cls) return null;
  return {
    classId: cls.id,
    className: cls.name,
    level: 1,
    xp: 0,
    hp: cls.hitPoints,
    maxHp: cls.hitPoints,
    armorClass: cls.armorClass,
    stats: { ...cls.baseStats },
    abilities: cls.abilities,
    inventory: [...cls.startingInventory],
  };
}
