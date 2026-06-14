import React, { useState } from 'react';
import Die3D from './Die3D';

const DICE = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];

const DIE_COLOR = {
  d4: '#e0556b',
  d6: '#4ad295',
  d8: '#46b4e0',
  d10: '#e0a14a',
  d12: '#b06fe0',
  d20: '#7b5cff',
  d100: '#d8c06a',
};

// Pull the die shape (e.g. "d20") out of a notation like "2d6+3".
function dieType(notation) {
  const m = (notation || '').toLowerCase().match(/d(\d+)/);
  if (!m) return 'd20';
  const t = `d${m[1]}`;
  return DIE_COLOR[t] ? t : 'd20';
}

// Dice tray with a real 3D die that tumbles on each roll. Rolls are resolved by
// the parent (server or local engine); the result is revealed once the tumble
// settles.
export default function DiceRoller({ onRoll, lastRoll }) {
  const [custom, setCustom] = useState('');
  const [type, setType] = useState('d20');
  const [rollKey, setRollKey] = useState(0);
  const [revealed, setRevealed] = useState(true);

  function doRoll(notation) {
    setType(dieType(notation));
    setRevealed(false);
    setRollKey((k) => k + 1);
    onRoll(notation);
  }

  return (
    <div className="dice-roller">
      <h3>Dice</h3>

      <div className="die-stage">
        <Die3D
          type={type}
          color={DIE_COLOR[type]}
          rollKey={rollKey}
          onSettle={() => setRevealed(true)}
        />
        {!revealed ? (
          <div className="die-rolling">rolling…</div>
        ) : lastRoll ? (
          <div className="die-result" key={lastRoll.id}>
            {lastRoll.total}
          </div>
        ) : (
          <div className="die-rolling">tap a die ↓</div>
        )}
      </div>

      <div className="dice-grid">
        {DICE.map((d) => (
          <button key={d} className="die-btn" onClick={() => doRoll(d)}>
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
              doRoll(custom.trim());
              setCustom('');
            }
          }}
        />
        <button
          className="btn"
          disabled={!custom.trim()}
          onClick={() => {
            doRoll(custom.trim());
            setCustom('');
          }}
        >
          Roll
        </button>
      </div>

      {revealed && lastRoll && (
        <div className="last-roll-detail">
          {lastRoll.player} · {lastRoll.notation} · [{lastRoll.rolls.join(', ')}]
          {lastRoll.modifier
            ? ` ${lastRoll.modifier >= 0 ? '+' : ''}${lastRoll.modifier}`
            : ''}
        </div>
      )}
    </div>
  );
}
