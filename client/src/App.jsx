import React, { useEffect } from 'react';
import { useGameSocket } from './useGameSocket';
import Lobby from './components/Lobby';
import CharacterSelect from './components/CharacterSelect';
import GameRoom from './components/GameRoom';

// Root component. Routes between the three phases (lobby → character select →
// playing) based on server-authoritative room state.
export default function App() {
  const game = useGameSocket();

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
      {screen}
      {game.error && <div className="toast">{game.error}</div>}
    </div>
  );
}
