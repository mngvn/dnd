import { useCallback, useEffect, useRef, useState } from 'react';

// Resolve the server WebSocket URL. Defaults to the same host on port 8080,
// overridable via VITE_WS_URL for deployment.
const WS_URL =
  import.meta.env.VITE_WS_URL ||
  `ws://${window.location.hostname}:8080`;

// React hook that owns the WebSocket connection and the game state derived
// from server messages.
export function useGameSocket() {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [playerId, setPlayerId] = useState(null);
  const [dmMode, setDmMode] = useState('mock');
  const [room, setRoom] = useState(null);
  const [scene, setScene] = useState(null);
  const [dmTyping, setDmTyping] = useState(false);
  const [lastRoll, setLastRoll] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      switch (msg.type) {
        case 'joined':
          setPlayerId(msg.payload.playerId);
          setDmMode(msg.payload.dmMode);
          break;
        case 'room_state':
          setRoom(msg.payload);
          setScene(msg.payload.scene);
          break;
        case 'scene':
          setScene(msg.payload);
          break;
        case 'dm_typing':
          setDmTyping(msg.payload.isTyping);
          break;
        case 'dice_result':
          setLastRoll(msg.payload);
          break;
        case 'error':
          setError(msg.payload.message);
          break;
        default:
          break;
      }
    };

    return () => ws.close();
  }, []);

  const send = useCallback((type, payload) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    connected,
    playerId,
    dmMode,
    room,
    scene,
    dmTyping,
    lastRoll,
    error,
    clearError,
    // Actions
    createRoom: (name) => send('create_room', { name }),
    joinRoom: (roomCode, name) => send('join_room', { roomCode, name }),
    selectClass: (classId) => send('select_class', { classId }),
    startGame: () => send('start_game'),
    sendAction: (text) => send('action', { text }),
    rollDice: (notation, reason, ability) => send('roll', { notation, reason, ability }),
    sendChat: (text) => send('chat', { text }),
  };
}
