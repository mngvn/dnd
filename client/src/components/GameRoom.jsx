import React, { useState } from 'react';
import SceneDisplay from './SceneDisplay';
import ChatLog from './ChatLog';
import DiceRoller from './DiceRoller';
import CharacterSheet from './CharacterSheet';
import PartyPanel from './PartyPanel';

// The main play screen. Left: party + dice. Center: scene + action/chat.
// Right: the player's character sheet.
export default function GameRoom({
  room,
  scene,
  playerId,
  dmTyping,
  lastRoll,
  onAction,
  onRoll,
  onChat,
}) {
  const [input, setInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const me = room.players.find((p) => p.id === playerId);

  const submitAction = () => {
    const text = input.trim();
    if (!text || dmTyping) return;
    onAction(text);
    setInput('');
  };

  const submitChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    onChat(text);
    setChatInput('');
  };

  return (
    <div className="game-room">
      <aside className="left-rail">
        <div className="room-code-pill">
          Room <strong>{room.code}</strong>
        </div>
        <PartyPanel players={room.players} playerId={playerId} />
        <DiceRoller
          lastRoll={lastRoll}
          onRoll={(notation) => onRoll(notation)}
        />
      </aside>

      <main className="center-stage">
        <SceneDisplay
          scene={scene}
          dmTyping={dmTyping}
          onSuggested={(a) => setInput(a)}
        />

        <ChatLog entries={room.chatLog} />

        <div className="action-bar">
          <input
            className="text-input action-input"
            placeholder="What do you do? (your action for the DM)"
            value={input}
            maxLength={500}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitAction()}
          />
          <button className="btn primary" disabled={dmTyping} onClick={submitAction}>
            Act
          </button>
        </div>

        <div className="chat-bar">
          <input
            className="text-input"
            placeholder="Say something to the table (out-of-character chat)"
            value={chatInput}
            maxLength={500}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitChat()}
          />
          <button className="btn ghost" onClick={submitChat}>
            Chat
          </button>
        </div>
      </main>

      <aside className="right-rail">
        <CharacterSheet
          character={me?.character}
          onRollAbility={(ab) => onRoll('d20', `${ab} check`, ab)}
        />
      </aside>
    </div>
  );
}
