// Shared type definitions for the AI D&D server.

export type Ability = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';

export interface AbilityScores {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
}

export interface ClassAbility {
  id: string;
  name: string;
  description: string;
  /** Ability score the action is typically checked against. */
  check?: Ability;
}

export interface CharacterClass {
  id: string;
  name: string;
  blurb: string;
  hitPoints: number;
  armorClass: number;
  baseStats: AbilityScores;
  abilities: ClassAbility[];
  startingInventory: string[];
}

export interface Character {
  classId: string;
  className: string;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  armorClass: number;
  stats: AbilityScores;
  abilities: ClassAbility[];
  inventory: string[];
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  connected: boolean;
  character: Character | null;
}

export type RoomPhase = 'lobby' | 'character_select' | 'playing';

export interface ChatEntry {
  id: string;
  kind: 'chat' | 'action' | 'dm' | 'system' | 'roll';
  author: string;
  text: string;
  timestamp: number;
}

export interface Scene {
  title: string;
  description: string;
  suggestedActions: string[];
}

export interface DiceResult {
  id: string;
  player: string;
  notation: string;
  rolls: number[];
  modifier: number;
  total: number;
  reason?: string;
  timestamp: number;
}

// ---- WebSocket message protocol ----

export interface ClientMessage {
  type:
    | 'create_room'
    | 'join_room'
    | 'rejoin'
    | 'select_class'
    | 'start_game'
    | 'action'
    | 'roll'
    | 'chat';
  payload?: any;
}

export interface ServerMessage {
  type:
    | 'joined'
    | 'room_state'
    | 'scene'
    | 'chat'
    | 'dice_result'
    | 'dm_typing'
    | 'error';
  payload?: any;
}
