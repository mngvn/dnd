import React, { useEffect, useState } from 'react';

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  `http://${window.location.hostname}:8080`;

// Character creation: browse the class roster, pick one, and (if host) start
// the game once every player is ready.
export default function CharacterSelect({ room, playerId, onSelect, onStart }) {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/classes`)
      .then((r) => r.json())
      .then(setClasses)
      .catch(() => setClasses([]));
  }, []);

  const me = room.players.find((p) => p.id === playerId);
  const isHost = me?.isHost;
  const everyoneReady = room.players.every((p) => p.character);
  const myClassId = me?.character?.classId;

  return (
    <div className="char-select">
      <div className="char-header">
        <h2>Choose your hero</h2>
        <div className="room-code-pill">
          Room <strong>{room.code}</strong>
        </div>
      </div>

      <div className="class-grid">
        {classes.map((cls) => (
          <button
            key={cls.id}
            className={`class-card ${myClassId === cls.id ? 'selected' : ''}`}
            onClick={() => onSelect(cls.id)}
          >
            <div className="class-name">{cls.name}</div>
            <div className="class-blurb">{cls.blurb}</div>
            <div className="class-stats">
              <span>❤️ {cls.hitPoints} HP</span>
              <span>🛡️ AC {cls.armorClass}</span>
            </div>
            <div className="class-abilities">
              {cls.abilities.map((a) => (
                <span key={a.id} className="ability-chip" title={a.description}>
                  {a.name}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="party-tray">
        <h3>Party ({room.players.length})</h3>
        <ul className="party-list">
          {room.players.map((p) => (
            <li key={p.id} className={p.character ? 'ready' : ''}>
              <span className="party-name">
                {p.name}
                {p.isHost && <span className="host-tag">HOST</span>}
              </span>
              <span className="party-class">
                {p.character ? p.character.className : 'choosing…'}
              </span>
            </li>
          ))}
        </ul>

        {isHost ? (
          <button
            className="btn primary start-btn"
            disabled={!everyoneReady}
            onClick={onStart}
          >
            {everyoneReady ? 'Begin the adventure' : 'Waiting for everyone to choose…'}
          </button>
        ) : (
          <p className="waiting-note">Waiting for the host to begin…</p>
        )}
      </div>
    </div>
  );
}
