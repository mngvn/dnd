# ⚔️ AI Dungeon

Play Dungeons & Dragons online with friends — like **skribbl.io**, but the
Dungeon Master is an AI. Create a room, share the 4‑letter code, everyone picks
a class, and an AI DM spins a story that reacts to your actions. Roll dice,
track your inventory, and watch the scene evolve in real time.

This repo contains a **working MVP** (playable today, no API key required) and a
**launch TODO** for taking it to a production, public-facing app.

---

## ✨ What's in the MVP

- **Lobby with room codes** — create a game, share a 4‑char code, friends join.
- **6 character classes** — Fighter, Wizard, Rogue, Cleric, Ranger, Bard, each
  with stats, signature abilities, hit points, armor class, and starting gear.
- **AI Dungeon Master** — narrates an opening scene and responds to every player
  action. Uses **Claude** (`claude-opus-4-8`) when `ANTHROPIC_API_KEY` is set,
  and a built-in **mock narrator** otherwise so the game runs with zero setup.
- **Real-time multiplayer** over WebSockets — shared scene, chat log, party
  vitals, and dice results sync to everyone instantly.
- **Server-authoritative dice** — quick polyhedral buttons (d4–d100) plus custom
  notation (`2d6+3`). Ability scores double as one-click `d20 + modifier` checks.
- **Rules engine** — D&D-style ability modifiers, ability checks vs a difficulty
  class, critical hits/misses, damage/healing helpers.
- **Live UI** — scene display with suggested actions, scrolling chat log,
  character sheet, party panel, and a dice tray.

---

## 🏗️ Architecture

```
┌─────────────┐   WebSocket (game state, actions, dice, chat)   ┌──────────────┐
│   Client    │ ───────────────────────────────────────────────▶│    Server    │
│  React+Vite │ ◀─────────────────────────────────────────────── │ Express + ws │
└─────────────┘   room_state · scene · dm_typing · dice_result    └──────┬───────┘
                                                                          │
                                                    ┌─────────────────────┴───────┐
                                                    │  Orchestrator (AI DM)        │
                                                    │  Claude `claude-opus-4-8`    │
                                                    │  └ structured JSON scenes    │
                                                    │  └ mock fallback (no key)    │
                                                    └──────────────────────────────┘
```

- **`server/`** — Node + TypeScript. Express serves a small HTTP API
  (`/health`, `/api/classes`) and a WebSocket server (same port) drives the game
  loop. Rooms, players, and conversation history live **in memory** for the MVP.
- **`client/`** — React + Vite single-page app. A `useGameSocket` hook owns the
  WebSocket connection and derives all UI state from server messages.

### Key server modules

| File | Responsibility |
|------|----------------|
| `src/index.ts` | HTTP + WebSocket bootstrap |
| `src/gameServer.ts` | WebSocket protocol & game loop (broadcasts, phases) |
| `src/rooms.ts` | In-memory room/lobby store, character creation |
| `src/classes.ts` | The 6 playable class definitions |
| `src/dice.ts` | Dice notation parsing + server-authoritative rolls |
| `src/rulesEngine.ts` | Ability modifiers, checks, damage/healing |
| `src/orchestrator.ts` | AI DM (Claude + mock fallback), structured scenes |

---

## 🚀 Quick start

You need **Node 18+**. Two terminals:

**1. Server**
```bash
cd server
npm install
npm run dev          # http://localhost:8080  (mock DM mode by default)
```

To enable the real AI DM, set a key first:
```bash
cp .env.example .env
# put your key in .env:  ANTHROPIC_API_KEY=sk-ant-...
npm run dev          # now "Dungeon Master mode: claude"
```

**2. Client**
```bash
cd client
npm install
npm run dev          # http://localhost:5173
```

Open `http://localhost:5173`, enter a name, **Create a new game**, and share the
room code. Open a second browser/incognito window, **Join with a code**, pick
classes, and the host hits **Begin the adventure**.

> The client connects to the server at `ws://<hostname>:8080` by default.
> Override with `VITE_WS_URL` / `VITE_API_BASE` env vars for other hosts.

---

## 🎮 How it works

- **Phases:** `lobby` → `character_select` → `playing`, all server-authoritative.
- **WebSocket protocol** (client → server): `create_room`, `join_room`,
  `select_class`, `start_game`, `action`, `roll`, `chat`. Server → client:
  `joined`, `room_state`, `scene`, `dm_typing`, `dice_result`, `error`.
- **AI DM:** each room keeps a rolling conversation history. The orchestrator
  asks Claude for a structured JSON scene (`title`, `description`,
  `suggestedActions`) via the Messages API with adaptive thinking, and falls
  back to the mock narrator on any error or refusal.
- **Dice & checks:** all rolls happen on the server (anti-cheat). An ability
  check is `d20 + (score − 10) / 2` vs a difficulty class, with natural 20/1
  treated as crit success/failure.

---

## 🗺️ Launch TODO — from MVP to a live app

The MVP runs locally and is fully playable. To make it a robust, public,
skribbl.io-style product, here's what's left, roughly in priority order.

### 1. Persistence & state (highest priority)
Right now everything is in-memory and lost on restart. Add a database.

- [ ] **Postgres** for users, characters, campaigns, and story events.
- [ ] **Redis** for live room state + pub/sub so multiple server instances can
      share rooms (enables horizontal scaling).
- [ ] Persist conversation history so a campaign can be resumed later.
- [ ] **Reconnect/rejoin** — let a dropped player rejoin their seat by token
      (the protocol already tracks `connected`; wire up a `rejoin` message +
      session token).

<details><summary>Proposed schema (sketch)</summary>

```
users(id, email, display_name, password_hash/oauth_provider, created_at)
characters(id, user_id, name, race, class, level, xp, stats jsonb, skills jsonb,
           spells jsonb, inventory jsonb, position jsonb, created_at)
campaigns(id, name, dm_mode['AI'|'human'|'hybrid'], world_state_id, created_by, created_at)
campaign_members(id, campaign_id, user_id, role['player'|'owner'|'observer'])
world_states(id, campaign_id, canonical_state jsonb, summary_text, last_updated)
encounters(id, campaign_id, location jsonb, npc_list jsonb, encounter_log jsonb)
story_events(id, campaign_id, timestamp, author['AI'|'user'], content, context_snapshot jsonb)
embeddings(id, campaign_id, type['npc'|'location'|'event'|'quest'|'lore'], text, vector, created_at)
combat_logs(id, campaign_id, snapshot jsonb, result jsonb)
```
</details>

### 2. Accounts & auth
- [ ] Sign-up / login (email + OAuth: Google/Discord).
- [ ] Guest play (no account) with optional upgrade.
- [ ] Save characters and campaigns to an account.

### 3. AI Dungeon Master depth
- [ ] **Stream** the DM narration token-by-token to all clients (broadcast SSE-
      style deltas) instead of waiting for the full response.
- [ ] **Long-term memory** — summarize/compact old turns and store key facts
      (NPCs, locations, quests) in a vector DB so the world stays consistent
      across long sessions. (`embeddings` table above.)
- [ ] **DM-driven mechanics** — let the DM *request* specific checks/saves
      (e.g. "make a DEX save, DC 15") and feed roll results back into the prompt
      so outcomes are mechanically grounded.
- [ ] **Combat loop** — initiative order, turn tracking, monster stat blocks,
      HP/damage applied automatically.
- [ ] Prompt caching for the system prompt + world state to cut latency/cost.
- [ ] Per-campaign tone/setting presets and content-safety controls.

### 4. Gameplay features
- [ ] Leveling & XP, spell slots, conditions (poisoned, prone, etc.).
- [ ] Map/grid or scene imagery (AI-generated scene art).
- [ ] Private DM whispers and per-player secret rolls.
- [ ] Voice/text chat, emotes, dice-roll animations.
- [ ] Save/replay a campaign log; export a "story so far" recap.

### 5. Real-time & scale
- [ ] Move room state to Redis; make the WS layer stateless behind a load
      balancer with sticky sessions or a shared pub/sub.
- [ ] Heartbeats/ping-pong + reconnection backoff on the client.
- [ ] Rate limiting and input validation on every WS message.
- [ ] Per-room action queue so simultaneous actions are resolved fairly
      (e.g. turn order, or "DM resolves once per round").

### 6. Production hardening
- [ ] Auth on the WebSocket (signed token), not just trust-on-connect.
- [ ] Validate/sanitize all user input (currently length-capped only).
- [ ] Structured logging, error tracking (Sentry), and metrics.
- [ ] Abuse/cost controls for the AI (per-user token budgets, moderation).
- [ ] Tests: unit (dice/rules/orchestrator), integration (WS flows), e2e.

### 7. Deployment
- [ ] Dockerize server + client; CI/CD pipeline.
- [ ] Host server (Fly.io/Render/Railway) + managed Postgres + Redis.
- [ ] Serve the built client from a CDN; point `VITE_WS_URL` at the prod server.
- [ ] TLS everywhere (`wss://`), domain, health checks, autoscaling.

### 8. Polish & growth
- [ ] Mobile-responsive layout pass (the grid collapses, but needs refinement).
- [ ] Onboarding/tutorial, shareable invite links, spectator mode.
- [ ] Accessibility (keyboard nav, screen-reader labels, color contrast).
- [ ] Landing page, analytics, and a campaign browser/lobby list.

---

## 📁 Project layout

```
dnd/
├── README.md
├── server/                 # Node + TypeScript game server
│   ├── src/
│   │   ├── index.ts         # HTTP + WebSocket bootstrap
│   │   ├── gameServer.ts    # WebSocket protocol & game loop
│   │   ├── rooms.ts         # in-memory rooms + character creation
│   │   ├── classes.ts       # playable class definitions
│   │   ├── dice.ts          # dice parsing + rolls
│   │   ├── rulesEngine.ts   # ability checks, modifiers, damage
│   │   ├── orchestrator.ts  # AI DM (Claude + mock fallback)
│   │   └── types.ts         # shared types & WS protocol
│   └── .env.example
└── client/                 # React + Vite single-page app
    └── src/
        ├── App.jsx            # phase routing
        ├── useGameSocket.js   # WebSocket hook + game state
        └── components/        # Lobby, CharacterSelect, GameRoom, panels…
```

---

## Notes

- The MVP keeps game data in memory; restarting the server clears all rooms.
  See the TODO above for the persistence plan.
- The AI DM defaults to **mock mode** so you can demo the whole flow offline.
  Add `ANTHROPIC_API_KEY` to get real Claude-driven storytelling.
