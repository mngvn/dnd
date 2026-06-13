import Anthropic from '@anthropic-ai/sdk';
import { Room } from './rooms';
import { Scene } from './types';

// The AI Dungeon Master. Uses Claude when ANTHROPIC_API_KEY is set, and falls
// back to a deterministic mock narrator otherwise so the MVP is fully playable
// with no credentials.

const MODEL = 'claude-opus-4-8';

const hasKey = !!process.env.ANTHROPIC_API_KEY;
const client = hasKey ? new Anthropic() : null;

export function dmMode(): 'claude' | 'mock' {
  return client ? 'claude' : 'mock';
}

// JSON schema that constrains the DM's reply to a clean, UI-ready shape.
const SCENE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'A short evocative title for the current scene.' },
    description: {
      type: 'string',
      description: 'Vivid second-person narration responding to the party, 2-5 sentences.',
    },
    suggestedActions: {
      type: 'array',
      items: { type: 'string' },
      description: 'Three concise actions the party might take next.',
    },
  },
  required: ['title', 'description', 'suggestedActions'],
  additionalProperties: false,
} as const;

function partySummary(room: Room): string {
  const members = [...room.players.values()]
    .filter((p) => p.character)
    .map(
      (p) =>
        `${p.name} the ${p.character!.className} (HP ${p.character!.hp}/${p.character!.maxHp})`,
    );
  return members.length ? members.join(', ') : 'a band of unknown adventurers';
}

const SYSTEM_PROMPT = `You are the Dungeon Master for an online tabletop role-playing game played by friends.
You narrate an evolving fantasy adventure and react to the players' actions.

Guidelines:
- Write in vivid, concise second person ("you" = the party). Keep narration to 2-5 sentences.
- React directly to what the players just did. Move the story forward; never stall.
- When an action's outcome is uncertain, describe the stakes and invite a dice roll, but do not invent roll results yourself unless told the result.
- Keep a consistent world, tone, and cast of characters.
- Offer exactly three distinct, actionable suggestions for what the party could do next.
- Never break character or mention that you are an AI.`;

// Generate the opening scene of an adventure.
export async function openingScene(room: Room): Promise<Scene> {
  const party = partySummary(room);
  const prompt = `Begin a brand new adventure for the party: ${party}.
Set an intriguing opening scene that gives them a clear hook and a sense of place. Address the party directly.`;
  return narrate(room, prompt, true);
}

// Respond to a player's action (or any event passed as `prompt`).
export async function respond(room: Room, prompt: string): Promise<Scene> {
  return narrate(room, prompt, false);
}

async function narrate(room: Room, userPrompt: string, isOpening: boolean): Promise<Scene> {
  if (!client) return mockScene(userPrompt, isOpening);

  // Maintain rolling conversation history per room.
  room.history.push({ role: 'user', content: userPrompt });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system: SYSTEM_PROMPT,
      output_config: { format: { type: 'json_schema', schema: SCENE_SCHEMA } },
      messages: room.history,
    });

    if (response.stop_reason === 'refusal') {
      return mockScene(userPrompt, isOpening);
    }

    const textBlock = response.content.find((b) => b.type === 'text');
    const raw = textBlock && 'text' in textBlock ? textBlock.text : '';
    const parsed = JSON.parse(raw) as Scene;
    room.history.push({ role: 'assistant', content: raw });
    // Keep history bounded so context (and cost) stays in check.
    if (room.history.length > 40) room.history.splice(0, room.history.length - 40);
    return {
      title: parsed.title || 'The Adventure Continues',
      description: parsed.description || '...',
      suggestedActions: (parsed.suggestedActions || []).slice(0, 3),
    };
  } catch (err) {
    console.error('[orchestrator] Claude call failed, using mock:', err);
    return mockScene(userPrompt, isOpening);
  }
}

// ---- Mock narrator (no API key required) ----

const OPENINGS = [
  'A cold wind threads through the pines as your party crests the ridge. Below, the village of Hollowmere huddles in mist, its single bell tolling though no hand pulls the rope. Smoke rises from a tavern, but the streets are empty.',
  'Torchlight gutters against ancient stone. You stand at the mouth of the Sunken Vault, its iron doors cracked just wide enough to slip through. Somewhere deep within, something drags a heavy chain across the floor.',
  'The caravan master pays you in silver and warnings: "Stay on the road." Now the road forks, unmarked, beneath a sky the color of a bruise. To the left, birdsong. To the right, a silence that feels watched.',
];

const REACTIONS = [
  'The shadows shift in response, and the air grows taut with possibility.',
  'Your choice ripples outward — somewhere, unseen, something takes notice.',
  'For a heartbeat the world holds its breath, then answers in kind.',
  'The path ahead reshapes itself around your decision.',
];

const SUGGESTIONS = [
  'Investigate the source of the noise',
  'Search the area for anything useful',
  'Ready your weapons and advance cautiously',
  'Try to talk your way through',
  'Look for another way around',
  'Make camp and rest before continuing',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function mockScene(userPrompt: string, isOpening: boolean): Scene {
  if (isOpening) {
    return {
      title: 'A New Adventure',
      description: pick(OPENINGS),
      suggestedActions: [SUGGESTIONS[0], SUGGESTIONS[1], SUGGESTIONS[2]],
    };
  }
  const shuffled = [...SUGGESTIONS].sort(() => Math.random() - 0.5).slice(0, 3);
  return {
    title: 'The Story Unfolds',
    description: `You act: "${userPrompt}". ${pick(REACTIONS)}`,
    suggestedActions: shuffled,
  };
}
