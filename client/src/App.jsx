import React, { useEffect } from 'react';
import { useGameSocket } from './useGameSocket';
import { useLocalGame } from './useLocalGame';
import Lobby from './components/Lobby';
import CharacterSelect from './components/CharacterSelect';
import GameRoom from './components/GameRoom';

// In demo builds (e.g. GitHub Pages, which can't host the WebSocket server)
// the whole game runs in the browser as a single-player preview.
const DEMO = import.meta.env.VITE_DEMO_MODE === '1';
const useGame = DEMO ? useLocalGame : useGameSocket;

// Root component. Routes between the three phases (lobby → character select →
// playing) based on server-authoritative room state.
export default function App() {
  const game = useGame();

  // Auto-dismiss transient errors.
  useEffect(() => {
    if (!game.error) return;
    const t = setTimeout(game.clearError, 4000);
    return () => clearTimeout(t);
  }, [game.error, game.clearError]);

  let screen;
  if (!game.room) {
    screen = (
      <Lobby
        connected={game.connected}
        dmMode={game.dmMode}
        onCreate={game.createRoom}
        onJoin={game.joinRoom}
      />
    );
  } else if (game.room.phase === 'playing') {
    screen = (
      <GameRoom
        room={game.room}
        scene={game.scene}
        playerId={game.playerId}
        dmTyping={game.dmTyping}
        lastRoll={game.lastRoll}
        onAction={game.sendAction}
        onRoll={game.rollDice}
        onChat={game.sendChat}
      />
    );
  } else {
    screen = (
      <CharacterSelect
        room={game.room}
        playerId={game.playerId}
        onSelect={game.selectClass}
        onStart={game.startGame}
      />
    );
  }

  return (
    <div className="app">
      {DEMO && (
        <div className="demo-banner">
          Single-player demo — the full version adds live multiplayer and a Claude AI Dungeon Master.
        </div>
      )}
      {screen}
      {game.error && <div className="toast">{game.error}</div>}
    </div>
  );
}
