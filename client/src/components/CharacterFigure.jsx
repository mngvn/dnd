import React from 'react';

// Visual identity per class: figure color + a held icon.
export const CLASS_VIS = {
  fighter: { color: '#9aa7b4', icon: '⚔️' },
  wizard: { color: '#6f7bdc', icon: '🔮' },
  rogue: { color: '#4a7a5a', icon: '🗡️' },
  cleric: { color: '#d8c06a', icon: '✨' },
  ranger: { color: '#5f9e6a', icon: '🏹' },
  bard: { color: '#c56fae', icon: '🎵' },
};

// A stylized SVG figure for a party member or enemy, with a name and HP bar.
// `kind` is 'party' or 'enemy'; enemies use a menacing palette.
export default function CharacterFigure({
  kind = 'party',
  name,
  sub,
  icon = '⚔️',
  color = '#9aa7b4',
  hp,
  maxHp,
  delay = 0,
}) {
  const isEnemy = kind === 'enemy';
  const robe = isEnemy ? '#7a2233' : color;
  const robeDark = shade(robe, -0.25);
  const hpPct = maxHp ? Math.max(0, Math.round((hp / maxHp) * 100)) : 100;

  return (
    <div className={`figure ${kind}`} style={{ animationDelay: `${delay}ms` }}>
      <div className="figure-icon" aria-hidden>
        {icon}
      </div>
      <svg viewBox="0 0 64 88" width="64" height="88" className="figure-svg">
        {/* shadow */}
        <ellipse cx="32" cy="84" rx="18" ry="4" fill="rgba(0,0,0,0.35)" />
        {/* cloak / body */}
        <path
          d="M32 28 C20 30 16 44 14 78 L50 78 C48 44 44 30 32 28 Z"
          fill={robe}
          stroke={robeDark}
          strokeWidth="2"
        />
        {/* shoulders */}
        <path d="M22 40 C24 34 40 34 42 40 L40 50 L24 50 Z" fill={robeDark} opacity="0.6" />
        {/* head */}
        <circle cx="32" cy="20" r="11" fill="#e8c39e" stroke={robeDark} strokeWidth="2" />
        {/* hood/hair */}
        <path d="M21 18 C22 8 42 8 43 18 C40 13 24 13 21 18 Z" fill={robeDark} />
        {/* eyes */}
        {isEnemy ? (
          <>
            <path d="M26 19 l4 2" stroke="#3a0d16" strokeWidth="2" strokeLinecap="round" />
            <path d="M38 21 l-4 2" stroke="#3a0d16" strokeWidth="2" strokeLinecap="round" />
            <circle cx="28" cy="22" r="1.6" fill="#c0182f" />
            <circle cx="36" cy="22" r="1.6" fill="#c0182f" />
          </>
        ) : (
          <>
            <circle cx="28" cy="21" r="1.6" fill="#2a2233" />
            <circle cx="36" cy="21" r="1.6" fill="#2a2233" />
          </>
        )}
      </svg>
      <div className="figure-name">{name}</div>
      {sub && <div className="figure-sub">{sub}</div>}
      {maxHp != null && (
        <div className={`figure-hp ${isEnemy ? 'enemy' : ''}`}>
          <div className="figure-hp-fill" style={{ width: `${hpPct}%` }} />
          <span>
            {hp}/{maxHp}
          </span>
        </div>
      )}
    </div>
  );
}

// Lighten/darken a hex color by `amt` in [-1, 1].
function shade(hex, amt) {
  const c = hex.replace('#', '');
  const num = parseInt(
    c.length === 3
      ? c
          .split('')
          .map((x) => x + x)
          .join('')
      : c,
    16,
  );
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + 255 * amt)));
  r = f(r);
  g = f(g);
  b = f(b);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
