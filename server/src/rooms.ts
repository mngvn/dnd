import {
  ChatEntry,
  Character,
  Player,
  RoomPhase,
  Scene,
} from './types';
import { getClass } from './classes';

// In-memory room store. For an MVP this lives in process memory; the launch
// TODO covers moving this to Redis/Postgres for persistence and horizontal
// scaling.

export interface Room {
  code: string;
  hostId: string;
  phase: RoomPhase;
  players: Map<string, Player>;
  scene: Scene | null;
  chatLog: ChatEntry[];
  // Conversation history fed to the AI DM (role/content pairs).
  history: { role: 'user' | 'assistant'; content: string }[];
  createdAt: number;
}

const rooms = new Map<string, Room>();

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 4; i++) {
      code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
  } while (rooms.has(code));
  return code;
}

export function createRoom(host: Player): Room {
  const code = generateCode();
  const room: Room = {
    code,
    hostId: host.id,
    phase: 'lobby',
    players: new Map([[host.id, host]]),
    scene: null,
    chatLog: [],
    history: [],
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function deleteRoom(code: string): void {
  rooms.delete(code);
}

// Build a character from a chosen class id.
export function buildCharacter(classId: string): Character | null {
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

let entryCounter = 0;

export function addChat(room: Room, entry: Omit<ChatEntry, 'id' | 'timestamp'>): ChatEntry {
  const full: ChatEntry = {
    ...entry,
    id: `e_${Date.now()}_${entryCounter++}`,
    timestamp: Date.now(),
  };
  room.chatLog.push(full);
  // Cap the in-memory log so long sessions don't grow unbounded.
  if (room.chatLog.length > 500) room.chatLog.shift();
  return full;
}

// Serializable view of a room sent to clients (Map -> array).
export function roomState(room: Room) {
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    scene: room.scene,
    players: [...room.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      connected: p.connected,
      character: p.character,
    })),
    chatLog: room.chatLog,
  };
}
