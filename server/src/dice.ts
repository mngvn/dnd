import { DiceResult } from './types';

// Parses dice notation like "2d6+3", "d20", "1d8-1".
const NOTATION = /^(\d*)d(\d+)([+-]\d+)?$/i;

export interface ParsedRoll {
  count: number;
  sides: number;
  modifier: number;
}

export function parseNotation(notation: string): ParsedRoll | null {
  const match = notation.trim().toLowerCase().match(NOTATION);
  if (!match) return null;
  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3], 10) : 0;
  if (count < 1 || count > 100 || sides < 2 || sides > 1000) return null;
  return { count, sides, modifier };
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

let counter = 0;

// Server-authoritative roll. Returns the individual dice and the total.
export function roll(
  notation: string,
  player: string,
  reason?: string,
  bonus = 0,
): DiceResult | null {
  const parsed = parseNotation(notation);
  if (!parsed) return null;
  const rolls: number[] = [];
  for (let i = 0; i < parsed.count; i++) rolls.push(rollDie(parsed.sides));
  const modifier = parsed.modifier + bonus;
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
