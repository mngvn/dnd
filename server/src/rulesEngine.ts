import { Ability, Character } from './types';
import { roll } from './dice';

// Standard D&D ability modifier: (score - 10) / 2, rounded down.
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export interface CheckResult {
  ability: Ability;
  dc: number;
  d20: number;
  modifier: number;
  total: number;
  success: boolean;
  critical: 'success' | 'failure' | null;
}

// Resolve an ability check: d20 + ability modifier vs a difficulty class.
export function abilityCheck(
  character: Character,
  ability: Ability,
  dc: number,
): CheckResult {
  const modifier = abilityModifier(character.stats[ability]);
  const result = roll('d20', 'system', undefined, modifier)!;
  const d20 = result.rolls[0];
  const total = result.total;
  let critical: 'success' | 'failure' | null = null;
  if (d20 === 20) critical = 'success';
  else if (d20 === 1) critical = 'failure';
  const success =
    critical === 'success' ? true : critical === 'failure' ? false : total >= dc;
  return { ability, dc, d20, modifier, total, success, critical };
}

// Difficulty presets the AI DM / host can reference.
export const DIFFICULTY = {
  trivial: 5,
  easy: 10,
  medium: 15,
  hard: 20,
  formidable: 25,
} as const;

export function applyDamage(character: Character, amount: number): Character {
  character.hp = Math.max(0, character.hp - amount);
  return character;
}

export function applyHealing(character: Character, amount: number): Character {
  character.hp = Math.min(character.maxHp, character.hp + amount);
  return character;
}
