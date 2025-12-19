import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { mockLLMResponse } from './orchestrator';
import { processAction } from './rulesEngine';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_,res)=>res.json({status:'ok'}));

const wss = new WebSocketServer({ port: 8081 });

wss.on('connection', ws => {
  ws.on('message', async (raw) => {
    const msg = JSON.parse(raw.toString());
    const rules = processAction(msg.action, msg.character);
    const ai = await mockLLMResponse(msg.action);
    ws.send(JSON.stringify({ rules, ai }));
  });
});

app.listen(8080, ()=>console.log("Server running"));