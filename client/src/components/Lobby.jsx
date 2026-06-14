import React, { useState } from 'react';

// Landing screen: enter a name, then create a new room or join one by code.
export default function Lobby({ connected, dmMode, onCreate, onJoin }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState('menu'); // 'menu' | 'join'

  const trimmedName = name.trim();

  return (
    <div className="lobby">
      <div className="lobby-card">
        <h1 className="title">⚔️ AI Dungeon</h1>
        <p className="subtitle">
          Gather your friends. An AI Dungeon Master spins the tale; you decide
          how it unfolds.
        </p>

        <label className="field-label">Your name</label>
        <input
          className="text-input"
          placeholder="e.g. Thorgar"
          value={name}
          maxLength={24}
          onChange={(e) => setName(e.target.value)}
        />

        {mode === 'menu' ? (
          <div className="lobby-actions">
            <button
              className="btn primary"
              disabled={!connected || !trimmedName}
              onClick={() => onCreate(trimmedName)}
            >
              Create a new game
            </button>
            <button
              className="btn"
              disabled={!connected || !trimmedName}
              onClick={() => setMode('join')}
            >
              Join with a code
            </button>
          </div>
        ) : (
          <div className="lobby-actions">
            <input
              className="text-input code-input"
              placeholder="ROOM CODE"
              value={code}
              maxLength={4}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <button
              className="btn primary"
              disabled={!connected || !trimmedName || code.length < 4}
              onClick={() => onJoin(code, trimmedName)}
            >
              Join game
            </button>
            <button className="btn ghost" onClick={() => setMode('menu')}>
              ← Back
            </button>
          </div>
        )}

        <div className="lobby-footer">
          <span className={`status-dot ${connected ? 'on' : 'off'}`} />
          {connected ? 'Connected' : 'Connecting to server…'}
          {connected && (
            <span className="dm-badge">
              DM:{' '}
              {dmMode === 'claude'
                ? 'Claude'
                : dmMode === 'demo'
                ? 'Demo narrator'
                : 'Mock narrator'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
