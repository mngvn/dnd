import React from 'react';

// Compact roster of the whole party with live HP, shown alongside the game.
export default function PartyPanel({ players, playerId }) {
  return (
    <div className="party-panel">
      <h3>Party</h3>
      <ul className="party-vitals">
        {players.map((p) => {
          const c = p.character;
          const pct = c ? Math.round((c.hp / c.maxHp) * 100) : 0;
          return (
            <li key={p.id} className={p.id === playerId ? 'is-me' : ''}>
              <div className="pv-top">
                <span className="pv-name">
                  {p.name}
                  {!p.connected && <span className="offline">offline</span>}
                </span>
                <span className="pv-class">{c ? c.className : ''}</span>
              </div>
              {c && (
                <div className="pv-hp">
                  <div className="pv-hp-fill" style={{ width: `${pct}%` }} />
                  <span>
                    {c.hp}/{c.maxHp}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
