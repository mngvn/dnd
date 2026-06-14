import { useCallback, useState } from 'react';
import { buildCharacter } from './data/classes';
import {
  abilityModifier,
  makeCode,
  makeEntry,
  openingScene,
  reactScene,
  roll,
} from './localEngine';

// In-browser, single-player drop-in for useGameSocket. Returns the exact same
// shape so App/components don't change. Used for the static GitHub Pages demo.
//
// To make the party feel alive, two AI companions are seated alongside the
// human player. They don't act on their own — they're here so the party panel,
// scene narration, and "begin the adventure" flow read like the real game.

const ME = 'me';

function freshRoom(hostName) {
  return {
    code: makeCode(),
    hostId: ME,
    phase: 'character_select',
    scene: null,
    players: [
      { id: ME, name: hostName || 'Adventurer', isHost: true, connected: true, character: null },
      { id: 'cmp_mira', name: 'Mira', isHost: false, connected: true, character: buildCharacter('wizard') },
      { id: 'cmp_bram', name: 'Bram', isHost: false, connected: true, character: buildCharacter('cleric') },
    ],
    chatLog: [makeEntry('system', 'System', 'Mira and Bram join your party.')],
  };
}

export function useLocalGame() {
  const [room, setRoom] = useState(null);
  const [scene, setScene] = useState(null);
  const [dmTyping, setDmTyping] = useState(false);
  const [lastRoll, setLastRoll] = useState(null);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const startSession = useCallback((name) => setRoom(freshRoom(name)), []);

  const selectClass = useCallback((classId) => {
    setRoom((r) => {
      if (!r) return r;
      const players = r.players.map((p) =>
        p.id === ME ? { ...p, character: buildCharacter(classId) } : p,
      );
      return { ...r, players };
    });
  }, []);

  const pushEntry = useCallback((entry) => {
    setRoom((r) => (r ? { ...r, chatLog: [...r.chatLog, entry] } : r));
  }, []);

  const startGame = useCallback(() => {
    setRoom((r) => (r ? { ...r, phase: 'playing' } : r));
    setDmTyping(true);
    setTimeout(() => {
      const sc = openingScene();
      setScene(sc);
      setDmTyping(false);
      setRoom((r) => (r ? { ...r, scene: sc, chatLog: [...r.chatLog, makeEntry('dm', 'Dungeon Master', sc.description)] } : r));
    }, 700);
  }, []);

  const sendAction = useCallback(
    (text) => {
      const trimmed = (text || '').slice(0, 500);
      if (!trimmed) return;
      const me = room?.players.find((p) => p.id === ME);
      pushEntry(makeEntry('action', me?.name || 'You', trimmed));
      setDmTyping(true);
      const prevEnemies = scene?.enemies || [];
      setTimeout(() => {
        const sc = reactScene(trimmed, prevEnemies);
        setScene(sc);
        setDmTyping(false);
        setRoom((r) => (r ? { ...r, scene: sc, chatLog: [...r.chatLog, makeEntry('dm', 'Dungeon Master', sc.description)] } : r));
      }, 800);
    },
    [room, scene, pushEntry],
  );

  const rollDice = useCallback(
    (notation, reason, ability) => {
      const me = room?.players.find((p) => p.id === ME);
      let bonus = 0;
      if (ability && me?.character && ability in me.character.stats) {
        bonus = abilityModifier(me.character.stats[ability]);
      }
      const result = roll(notation || 'd20', me?.name || 'You', reason, bonus);
      if (!result) {
        setError(`Invalid dice notation: ${notation}`);
        return;
      }
      setLastRoll(result);
      const breakdown = `${result.rolls.join(' + ')}${
        result.modifier ? ` ${result.modifier >= 0 ? '+' : ''}${result.modifier}` : ''
      }`;
      pushEntry(
        makeEntry(
          'roll',
          me?.name || 'You',
          `rolled ${result.notation}${reason ? ` (${reason})` : ''}: [${breakdown}] = ${result.total}`,
        ),
      );
    },
    [room, pushEntry],
  );

  const sendChat = useCallback(
    (text) => {
      const me = room?.players.find((p) => p.id === ME);
      pushEntry(makeEntry('chat', me?.name || 'You', (text || '').slice(0, 500)));
    },
    [room, pushEntry],
  );

  return {
    connected: true,
    playerId: ME,
    dmMode: 'demo',
    room,
    scene,
    dmTyping,
    lastRoll,
    error,
    clearError,
    // Both entry points start a local session.
    createRoom: startSession,
    joinRoom: (_code, name) => startSession(name),
    selectClass,
    startGame,
    sendAction,
    rollDice,
    sendChat,
  };
}
