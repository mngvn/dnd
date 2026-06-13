import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { CLASSES } from './classes';
import { attachGameServer } from './gameServer';
import { dmMode } from './orchestrator';

const PORT = Number(process.env.PORT) || 8080;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', dm: dmMode() }));

// Expose the class roster so the client can render character select without
// hard-coding game data.
app.get('/api/classes', (_req, res) => res.json(CLASSES));

const server = http.createServer(app);

// Run the WebSocket server on the same HTTP server / port.
const wss = new WebSocketServer({ server });
attachGameServer(wss);

server.listen(PORT, () => {
  console.log(`AI D&D server listening on http://localhost:${PORT}`);
  console.log(
    `Dungeon Master mode: ${dmMode()}${
      dmMode() === 'mock' ? ' (set ANTHROPIC_API_KEY for Claude)' : ''
    }`,
  );
});
