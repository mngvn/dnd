import React from 'react';

const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

function mod(score) {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
}

// The local player's character sheet: vitals, ability scores, abilities, and
// inventory. Ability scores double as one-click rolls (d20 + modifier).
export default function CharacterSheet({ character, onRollAbility }) {
  if (!character) return null;
  const hpPct = Math.round((character.hp / character.maxHp) * 100);

  return (
    <div className="character-sheet">
      <div className="sheet-header">
        <h3>{character.className}</h3>
        <span className="sheet-level">Lv {character.level}</span>
      </div>

      <div className="vitals">
        <div className="hp-bar">
          <div className="hp-fill" style={{ width: `${hpPct}%` }} />
          <span className="hp-label">
            {character.hp} / {character.maxHp} HP
          </span>
        </div>
        <div className="ac-pill">🛡️ AC {character.armorClass}</div>
      </div>

      <div className="ability-scores">
        {ABILITIES.map((ab) => (
          <button
            key={ab}
            className="ability-score"
            title={`Roll d20 ${mod(character.stats[ab])} (${ab} check)`}
            onClick={() => onRollAbility(ab)}
          >
            <span className="ab-name">{ab}</span>
            <span className="ab-value">{character.stats[ab]}</span>
            <span className="ab-mod">{mod(character.stats[ab])}</span>
          </button>
        ))}
      </div>

      <div className="sheet-section">
        <h4>Abilities</h4>
        <ul className="ability-list">
          {character.abilities.map((a) => (
            <li key={a.id} title={a.description}>
              <strong>{a.name}</strong>
              <span>{a.description}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="sheet-section">
        <h4>Inventory</h4>
        <ul className="inventory-list">
          {character.inventory.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
