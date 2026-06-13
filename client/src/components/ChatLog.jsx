import React, { useEffect, useRef } from 'react';

// Scrolling log of narration, player actions, dice rolls, and table chat.
export default function ChatLog({ entries }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div className="chat-log">
      {entries.map((e) => (
        <div key={e.id} className={`log-entry log-${e.kind}`}>
          {e.kind === 'dm' ? (
            <>
              <div className="log-author dm-author">🎙️ {e.author}</div>
              <div className="log-text">{e.text}</div>
            </>
          ) : e.kind === 'system' ? (
            <div className="log-system">{e.text}</div>
          ) : e.kind === 'roll' ? (
            <div className="log-roll">
              🎲 <strong>{e.author}</strong> {e.text}
            </div>
          ) : e.kind === 'action' ? (
            <div className="log-action">
              <strong>{e.author}</strong> {e.text}
            </div>
          ) : (
            <div className="log-chat">
              <strong>{e.author}:</strong> {e.text}
            </div>
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
