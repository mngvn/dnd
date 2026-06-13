import React, { useState } from 'react';

const DICE = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

// Dice tray: quick polyhedral buttons plus a custom-notation roll. Rolls are
// resolved server-side; the latest result is shown here and in the chat log.
export default function DiceRoller({ onRoll, lastRoll }) {
  const [custom, setCustom] = useState('');

  return (
    <div className="dice-roller">
      <h3>Dice</h3>
      <div className="dice-grid">
        {DICE.map((d) => (
          <button key={d} className="die-btn" onClick={() => onRoll(d)}>
            {d}
          </button>
        ))}
      </div>

      <div className="custom-roll">
        <input
          className="text-input"
          placeholder="e.g. 2d6+3"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && custom.trim()) {
              onRoll(custom.trim());
              setCustom('');
            }
          }}
        />
        <button
          className="btn"
          disabled={!custom.trim()}
          onClick={() => {
            onRoll(custom.trim());
            setCustom('');
          }}
        >
          Roll
        </button>
      </div>

      {lastRoll && (
        <div className="last-roll">
          <div className="last-roll-total">{lastRoll.total}</div>
          <div className="last-roll-detail">
            {lastRoll.player} · {lastRoll.notation} · [{lastRoll.rolls.join(', ')}]
            {lastRoll.modifier
              ? ` ${lastRoll.modifier >= 0 ? '+' : ''}${lastRoll.modifier}`
              : ''}
          </div>
        </div>
      )}
    </div>
  );
}
