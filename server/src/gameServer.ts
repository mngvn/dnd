import { WebSocket, WebSocketServer } from 'ws';
import { ClientMessage, Player, ServerMessage } from './types';
import {
  Room,
  addChat,
  buildCharacter,
  createRoom,
  getRoom,
  roomState,
} from './rooms';
import { roll } from './dice';
import { abilityModifier } from './rulesEngine';
import { openingScene, respond, dmMode } from './orchestrator';

// Each socket is tagged with the player + room it belongs to.
interface Conn extends WebSocket {
  playerId?: string;
  roomCode?: string;
}

let playerCounter = 0;
function newPlayerId(): string {
  return `p_${Date.now()}_${playerCounter++}`;
}

function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(room: Room, msg: ServerMessage) {
  for (const conn of connections) {
    if (conn.roomCode === room.code) send(conn, msg);
  }
}

function broadcastRoom(room: Room) {
  broadcast(room, { type: 'room_state', payload: roomState(room) });
}

const connections = new Set<Conn>();

export function attachGameServer(wss: WebSocketServer) {
  wss.on('connection', (ws: Conn) => {
    connections.add(ws);

    ws.on('message', (raw) => {
      let msg: ClientMessage;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return send(ws, { type: 'error', payload: { message: 'Malformed message.' } });
      }
      handle(ws, msg).catch((err) => {
        console.error('[gameServer] handler error:', err);
        send(ws, { type: 'error', payload: { message: 'Something went wrong.' } });
      });
    });

    ws.on('close', () => {
      connections.delete(ws);
      if (ws.roomCode) {
        const room = getRoom(ws.roomCode);
        const player = room?.players.get(ws.playerId!);
        if (room && player) {
          player.connected = false;
          broadcastRoom(room);
        }
      }
    });
  });
}

async function handle(ws: Conn, msg: ClientMessage) {
  switch (msg.type) {
    case 'create_room':
      return onCreateRoom(ws, msg.payload?.name);
    case 'join_room':
      return onJoinRoom(ws, msg.payload?.roomCode, msg.payload?.name);
    case 'select_class':
      return onSelectClass(ws, msg.payload?.classId);
    case 'start_game':
      return onStartGame(ws);
    case 'action':
      return onAction(ws, msg.payload?.text);
    case 'roll':
      return onRoll(ws, msg.payload?.notation, msg.payload?.reason, msg.payload?.ability);
    case 'chat':
      return onChat(ws, msg.payload?.text);
    default:
      send(ws, { type: 'error', payload: { message: 'Unknown message type.' } });
  }
}

function currentRoom(ws: Conn): Room | undefined {
  return ws.roomCode ? getRoom(ws.roomCode) : undefined;
}

function onCreateRoom(ws: Conn, name?: string) {
  const player: Player = {
    id: newPlayerId(),
    name: (name || 'Adventurer').slice(0, 24),
    isHost: true,
    connected: true,
    character: null,
  };
  const room = createRoom(player);
  ws.playerId = player.id;
  ws.roomCode = room.code;
  send(ws, { type: 'joined', payload: { playerId: player.id, roomCode: room.code, dmMode: dmMode() } });
  broadcastRoom(room);
}

function onJoinRoom(ws: Conn, code?: string, name?: string) {
  if (!code) return send(ws, { type: 'error', payload: { message: 'Room code required.' } });
  const room = getRoom(code);
  if (!room) return send(ws, { type: 'error', payload: { message: 'No room with that code.' } });
  if (room.phase === 'playing') {
    return send(ws, { type: 'error', payload: { message: 'That game is already underway.' } });
  }
  const player: Player = {
    id: newPlayerId(),
    name: (name || 'Adventurer').slice(0, 24),
    isHost: false,
    connected: true,
    character: null,
  };
  room.players.set(player.id, player);
  ws.playerId = player.id;
  ws.roomCode = room.code;
  send(ws, { type: 'joined', payload: { playerId: player.id, roomCode: room.code, dmMode: dmMode() } });
  addChat(room, { kind: 'system', author: 'System', text: `${player.name} joined the party.` });
  broadcastRoom(room);
}

function onSelectClass(ws: Conn, classId?: string) {
  const room = currentRoom(ws);
  if (!room) return;
  const player = room.players.get(ws.playerId!);
  if (!player) return;
  const character = buildCharacter(classId || '');
  if (!character) return send(ws, { type: 'error', payload: { message: 'Unknown class.' } });
  player.character = character;
  // First class selection moves the lobby into character-select.
  if (room.phase === 'lobby') room.phase = 'character_select';
  broadcastRoom(room);
}

async function onStartGame(ws: Conn) {
  const room = currentRoom(ws);
  if (!room) return;
  if (ws.playerId !== room.hostId) {
    return send(ws, { type: 'error', payload: { message: 'Only the host can start the game.' } });
  }
  const ready = [...room.players.values()].every((p) => p.character);
  if (!ready) {
    return send(ws, { type: 'error', payload: { message: 'Everyone must pick a class first.' } });
  }
  room.phase = 'playing';
  broadcastRoom(room);

  broadcast(room, { type: 'dm_typing', payload: { isTyping: true } });
  const scene = await openingScene(room);
  room.scene = scene;
  addChat(room, { kind: 'dm', author: 'Dungeon Master', text: scene.description });
  broadcast(room, { type: 'dm_typing', payload: { isTyping: false } });
  broadcast(room, { type: 'scene', payload: scene });
  broadcastRoom(room);
}

async function onAction(ws: Conn, text?: string) {
  const room = currentRoom(ws);
  if (!room || room.phase !== 'playing' || !text) return;
  const player = room.players.get(ws.playerId!);
  if (!player) return;

  const trimmed = text.slice(0, 500);
  addChat(room, { kind: 'action', author: player.name, text: trimmed });
  broadcastRoom(room);

  // Compose a prompt describing the actor + party state for the DM.
  const prompt = `${player.name} the ${player.character?.className} attempts: ${trimmed}`;
  broadcast(room, { type: 'dm_typing', payload: { isTyping: true } });
  const scene = await respond(room, prompt);
  room.scene = scene;
  addChat(room, { kind: 'dm', author: 'Dungeon Master', text: scene.description });
  broadcast(room, { type: 'dm_typing', payload: { isTyping: false } });
  broadcast(room, { type: 'scene', payload: scene });
  broadcastRoom(room);
}

function onRoll(ws: Conn, notation?: string, reason?: string, ability?: string) {
  const room = currentRoom(ws);
  if (!room) return;
  const player = room.players.get(ws.playerId!);
  if (!player) return;

  // Optional ability modifier from the roller's character.
  let bonus = 0;
  if (ability && player.character && ability in player.character.stats) {
    bonus = abilityModifier((player.character.stats as any)[ability]);
  }

  const result = roll(notation || 'd20', player.name, reason, bonus);
  if (!result) {
    return send(ws, { type: 'error', payload: { message: `Invalid dice notation: ${notation}` } });
  }
  const breakdown = `${result.rolls.join(' + ')}${result.modifier ? ` ${result.modifier >= 0 ? '+' : ''}${result.modifier}` : ''}`;
  addChat(room, {
    kind: 'roll',
    author: player.name,
    text: `rolled ${result.notation}${reason ? ` (${reason})` : ''}: [${breakdown}] = ${result.total}`,
  });
  broadcast(room, { type: 'dice_result', payload: result });
  broadcastRoom(room);
}

function onChat(ws: Conn, text?: string) {
  const room = currentRoom(ws);
  if (!room || !text) return;
  const player = room.players.get(ws.playerId!);
  if (!player) return;
  addChat(room, { kind: 'chat', author: player.name, text: text.slice(0, 500) });
  broadcastRoom(room);
}
