import React from 'react';
import CharacterFigure, { CLASS_VIS } from './CharacterFigure';

// A visual depiction of the current scene: enemies on the far side, the party
// on the near side, on a themed backdrop. Enemies come from scene.enemies
// (the demo's mock DM supplies them); the party comes from room.players.
export default function SceneStage({ room, scene }) {
  const party = (room?.players || []).filter((p) => p.character);
  const enemies = scene?.enemies || [];

  return (
    <div className={`scene-stage ${enemies.length ? 'combat' : 'calm'}`}>
      <div className="stage-sky" />
      <div className="stage-ground" />
      <div className="stage-title">{scene?.title || 'The Adventure'}</div>

      <div className="stage-row enemies-row">
        {enemies.map((e) => (
          <CharacterFigure
            key={e.uid}
            kind="enemy"
            name={e.name}
            icon={e.icon}
            hp={e.hp}
            maxHp={e.maxHp}
            delay={Math.random() * 600}
          />
        ))}
        {enemies.length === 0 && <div className="stage-hint">No threats in sight…</div>}
      </div>

      {enemies.length > 0 && <div className="stage-vs">VS</div>}

      <div className="stage-row party-row">
        {party.map((p, i) => {
          const vis = CLASS_VIS[p.character.classId] || { color: '#9aa7b4', icon: '⚔️' };
          return (
            <CharacterFigure
              key={p.id}
              kind="party"
              name={p.name}
              sub={p.character.className}
              icon={vis.icon}
              color={vis.color}
              hp={p.character.hp}
              maxHp={p.character.maxHp}
              delay={i * 150}
            />
          );
        })}
      </div>
    </div>
  );
}
