import React from 'react';

// The current scene set by the Dungeon Master, plus quick-action suggestions.
export default function SceneDisplay({ scene, dmTyping, onSuggested }) {
  return (
    <div className="scene-display">
      <div className="scene-banner">
        <span className="scene-eyebrow">The Dungeon Master sets the scene</span>
        <h2 className="scene-title">{scene ? scene.title : 'Loading…'}</h2>
      </div>
      <p className="scene-text">
        {scene ? scene.description : 'The mists are still gathering…'}
      </p>

      {dmTyping && (
        <div className="dm-typing">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          The Dungeon Master is narrating…
        </div>
      )}

      {scene?.suggestedActions?.length > 0 && (
        <div className="suggested-actions">
          {scene.suggestedActions.map((a, i) => (
            <button key={i} className="suggested-chip" onClick={() => onSuggested(a)}>
              {a}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
