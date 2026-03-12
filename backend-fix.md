# Backend Fix — Agent Routing + Typing Indicators
> Paste into VS Code Copilot (Agent mode) in your **backend** project and say: "Apply these fixes."

---

## Fix 1 — `src/utils/mention.utils.ts` — full replacement

```typescript
const MENTION_MAP: Record<string, string> = {
  '@marcus':   'cto-marcus',
  '@cto':      'cto-marcus',
  '@priya':    'cfo-priya',
  '@cfo':      'cfo-priya',
  '@james':    'coo-james',
  '@coo':      'coo-james',
  '@alex':     'legal-counsel',
  '@legal':    'legal-counsel',
  '@market':   'competitor-monitor',
  '@intel':    'competitor-monitor',
  '@chaos':    'wildcard-chaos',
  '@wildcard': 'wildcard-chaos',
  '@all':      '__all__',
  '@board':    '__board__',
};

export const BOARD_AGENTS = ['cto-marcus', 'cfo-priya', 'coo-james'];
export const ALL_AGENTS   = [
  'cto-marcus', 'cfo-priya', 'coo-james',
  'legal-counsel', 'competitor-monitor', 'wildcard-chaos'
];

const TOPIC_ROUTING: Array<{ keywords: string[]; agentId: string }> = [
  { keywords: ['cost', 'budget', 'runway', 'burn', 'money', 'cash', 'finance', 'arr', 'revenue', 'profit', 'fund', 'raise', 'series'], agentId: 'cfo-priya' },
  { keywords: ['technical', 'build', 'engineer', 'architect', 'code', 'infra', 'stack', 'deploy', 'api', 'system', 'database', 'performance', 'scale', 'tech'], agentId: 'cto-marcus' },
  { keywords: ['customer', 'sales', 'pipeline', 'hire', 'hiring', 'team', 'onboard', 'pilot', 'convert', 'churn', 'client', 'deal', 'close'], agentId: 'coo-james' },
  { keywords: ['legal', 'compliance', 'contract', 'gdpr', 'regulation', 'liability', 'ip', 'patent', 'law', 'privacy', 'risk'], agentId: 'legal-counsel' },
  { keywords: ['competitor', 'market', 'palantir', 'databricks', 'tableau', 'snowflake', 'industry', 'trend', 'analyst'], agentId: 'competitor-monitor' },
  { keywords: ['uncertainty', 'threat', 'what if', 'scenario', 'black swan', 'danger', 'concern'], agentId: 'wildcard-chaos' },
];

const GENERAL_BUSINESS_KEYWORDS = [
  'scaling', 'scale', 'growth', 'strategy', 'plan', 'roadmap', 'quarter',
  'q1', 'q2', 'q3', 'q4', 'milestone', 'target', 'goal', 'objective',
  'company', 'startup', 'business', 'product', 'launch', 'expand',
  'prioritize', 'focus', 'decision', 'talk', 'discuss', 'thoughts',
  'opinion', 'think', 'suggest', 'idea', 'proposal', 'meeting',
  'update', 'status', 'progress', 'review', 'assess', 'evaluate',
];

export function parseMentions(content: string): string[] | null {
  const lower = content.toLowerCase();
  const mentioned: string[] = [];

  for (const [alias, agentId] of Object.entries(MENTION_MAP)) {
    if (lower.includes(alias)) {
      if (agentId === '__all__')   return [...ALL_AGENTS];
      if (agentId === '__board__') return [...BOARD_AGENTS];
      if (!mentioned.includes(agentId)) mentioned.push(agentId);
    }
  }

  return mentioned.length > 0 ? mentioned : null;
}

export function resolveRespondingAgents(
  content: string,
  channelAgentIds: string[]
): string[] {
  const lower = content.toLowerCase().trim();
  const wordCount = lower.split(/\s+/).length;

  // 1. Explicit @mention
  const mentioned = parseMentions(lower);
  if (mentioned) return mentioned.filter(id => channelAgentIds.includes(id));

  // 2. Specific topic keywords → route to 1-2 most relevant agents
  const topicMatches: string[] = [];
  for (const { keywords, agentId } of TOPIC_ROUTING) {
    if (channelAgentIds.includes(agentId) && keywords.some(kw => lower.includes(kw))) {
      topicMatches.push(agentId);
    }
  }
  if (topicMatches.length === 1) return topicMatches;
  if (topicMatches.length >= 2)  return topicMatches.slice(0, 2);

  // 3. General business keywords → full board responds
  const isGeneralBusiness = GENERAL_BUSINESS_KEYWORDS.some(kw => lower.includes(kw));
  if (isGeneralBusiness) return BOARD_AGENTS.filter(id => channelAgentIds.includes(id));

  // 4. Any question → 1 board agent
  if (lower.includes('?')) {
    const boardInChannel = BOARD_AGENTS.filter(id => channelAgentIds.includes(id));
    return boardInChannel.length > 0 ? [boardInChannel[0]] : [];
  }

  // 5. Short message (≤4 words) → 1 board agent responds
  if (wordCount <= 4) {
    const boardInChannel = BOARD_AGENTS.filter(id => channelAgentIds.includes(id));
    if (boardInChannel.length > 0) {
      return [boardInChannel[content.length % boardInChannel.length]];
    }
  }

  // 6. Longer unrecognized / non-English → 1 board agent acknowledges
  if (wordCount > 4) {
    const boardInChannel = BOARD_AGENTS.filter(id => channelAgentIds.includes(id));
    return boardInChannel.length > 0 ? [boardInChannel[0]] : [];
  }

  return [];
}
```

---

## Fix 2 — `src/utils/prompt.utils.ts` — full replacement

```typescript
import { COMPANY_PROFILE } from '../mastra/company/company.config.js';
import type { CompanyState } from '../modals/company-state.modal.js';

const AGENT_VOICE: Record<string, string> = {
  'cto-marcus':        `You are Marcus Wei (CTO). Open with a technical analogy or restaurant-style rating. Be dry and funny. Keep it under 3 sentences.`,
  'cfo-priya':         `You are Priya Patel (CFO). ALWAYS open with a specific number or ratio from the company state. Be conservative and precise. Keep it under 3 sentences.`,
  'coo-james':         `You are James Park (COO). Lead with commercial reality. Ask "who owns this?" if ownership is unclear. Keep it under 3 sentences.`,
  'legal-counsel':     `You are Alex Rivera (General Counsel). State the specific legal risk. Give a risk level: low/medium/high/blocker. Suggest one mitigation. Keep it under 3 sentences.`,
  'competitor-monitor':`You are Market Intel. Frame everything as "the market is doing X" or "competitors are betting on Y". Name a specific competitor. Keep it under 3 sentences.`,
  'wildcard-chaos':    `You are the Uncertainty Agent. Open with "Nobody's saying this, but..." Surface one tail risk or contrarian opportunity. Keep it under 3 sentences.`,
};

export function buildAgentPrompt(
  agentId: string,
  scenario: { title: string; description: string },
  companyState: CompanyState,
  context?: string,
  threadHistory?: Array<{ agentName: string; content: string }>
): string {
  const voiceAnchor = AGENT_VOICE[agentId] || 'Respond as a senior executive. Be specific and direct.';

  const threadSection =
    threadHistory && threadHistory.length > 0
      ? `\n## What Your Colleagues Said\n${threadHistory
          .map((m, i) => `${i + 1}. ${m.agentName}: ${m.content}`)
          .join('\n\n')}\n\nDo NOT repeat what they said. Add your own distinct perspective.`
      : '';

  const contextSection = context
    ? `\n## Recent Channel Messages\n${context}`
    : '';

  // Detect non-English (>30% non-ASCII)
  const desc = scenario.description;
  const nonAsciiRatio = (desc.match(/[^\x00-\x7F]/g) || []).length / Math.max(desc.length, 1);
  const languageNote = nonAsciiRatio > 0.3
    ? '\nNote: The message may be in a non-English language. Acknowledge warmly, ask them to use English for board discussions, and pivot to something relevant about the company.'
    : '';

  return `You are a senior executive at Narrow Strait, a data analytics startup.
This is an internal board meeting. ALWAYS respond in character. Never refuse.

## YOUR ROLE
${voiceAnchor}

## Company (${COMPANY_PROFILE.stage})
${COMPANY_PROFILE.whatWeDo}
Competitors: ${COMPANY_PROFILE.competitors.join(', ')}
Edge: ${COMPANY_PROFILE.differentiator}

## Current State (Month ${companyState.month}, ${companyState.year})
ARR: $${(companyState.arr / 1_000_000).toFixed(1)}M | Burn: $${companyState.burnRate.toLocaleString()}/mo
Runway: ${companyState.runway} months | Headcount: ${companyState.headcount}
Open Issues: ${companyState.openIssues.length > 0 ? companyState.openIssues.join('; ') : 'None'}

## Meeting Agenda: ${scenario.title}
${scenario.description}
${contextSection}${threadSection}${languageNote}

Respond NOW as your character above. 2-3 sentences maximum. Be specific and opinionated.`;
}
```

---

## Fix 3 — `src/socket/socket.handler.ts` — full replacement of send_message handler

Replace only the `send_message` socket event handler inside `registerSocketHandlers`.
Keep everything else (imports, join_channel, disconnect) unchanged.

Add these imports at the top of the file:
```typescript
import { resolveRespondingAgents } from '../utils/mention.utils.js';
import { agentService } from '../services/agent.service.js';
import { channelService } from '../services/channel.service.js';
import { getIO } from './io.js';
```

Replace the `send_message` handler:
```typescript
socket.on('send_message', async (...args: unknown[]) => {
  if (isSocketRateLimited(socket.id)) {
    socket.emit('error', { message: 'Sending too fast, slow down' });
    return;
  }

  try {
    const payload = normalizeSendMessagePayload(socket, args);

    const message = await messageService.createMessage({
      channelId: payload.channelId ?? '',
      content: payload.content ?? '',
      contentType: payload.contentType ?? 'text',
      voiceUrl: payload.voiceUrl,
      authorId: 'user',
      authorName: 'You',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear()
    });

    // Echo to room (use io.to so sender also gets it)
    io.to(message.channelId).emit('message_posted', message);

    // ── Agent auto-response ────────────────────────────────────────
    const channelId = message.channelId;
    const content   = (payload.content ?? '').trim();

    const channel = await channelService.getChannel(channelId);
    if (channel) {
      const channelAgentIds = channel.members
        .map((m: any) => m.id)
        .filter((id: string) => id !== 'user' && id !== 'ceo-sarah');

      const respondingAgents = resolveRespondingAgents(content, channelAgentIds);

      if (respondingAgents.length > 0) {
        // Emit typing IMMEDIATELY before Ollama starts
        for (const agentId of respondingAgents) {
          const { getAgentConfig } = await import('../mastra/index.js');
          const cfg = getAgentConfig(agentId);
          if (cfg) {
            io.to(channelId).emit('agent_typing', {
              agentId,
              agentName: cfg.name,
              isTyping: true
            });
          }
        }

        const now = new Date();

        // Fire and forget — responses stream in via socket inside triggerDiscussion
        agentService
          .triggerDiscussion(
            channelId,
            { title: 'Response', description: content },
            respondingAgents,
            now.getMonth() + 1,
            now.getFullYear()
          )
          .catch(err => console.error('Auto-respond error:', err.message))
          .finally(() => {
            // Safety: clear all typing indicators when fully done
            for (const agentId of respondingAgents) {
              io.to(channelId).emit('agent_typing', { agentId, isTyping: false });
            }
          });
      }
    }
    // ─────────────────────────────────────────────────────────────

  } catch (error) {
    console.error('send_message error:', error);
    const detail =
      error instanceof ZodError
        ? error.issues.map(issue => issue.message).join(', ')
        : (error as Error).message;

    socket.emit('error', {
      message: error instanceof ZodError ? 'Invalid message payload' : 'Failed to save message',
      detail
    });
  }
});
```

---

## Fix 4 — `src/services/agent.service.ts` — update triggerDiscussion loop

Replace the `for` loop inside `triggerDiscussion` with this version that:
- Clears each agent's typing indicator as soon as THEIR message posts (not all at end)
- Does NOT re-emit `agent_typing: true` (already done in socket handler)
- Uses `buildAgentPrompt(agentId, ...)` with agent-specific identity

```typescript
for (const agentId of targetAgentIds) {
  const config = getAgentConfig(agentId);
  if (!config) continue;

  try {
    // Per-agent identity prompt — fixes identical response problem
    const prompt = buildAgentPrompt(agentId, scenario, companyState, context);
    const response = await getAgentResponse(agentId, prompt);

    // Clear THIS agent's typing as soon as their message is ready
    try {
      getIO().to(channelId).emit('agent_typing', {
        agentId,
        agentName: config.name,
        isTyping: false
      });
    } catch (_) {}

    if (!response || response.trim() === '') continue;

    const message = await messageService.createMessage({
      channelId,
      content: response,
      authorId: agentId,
      authorName: config.name,
      authorRole: config.role,
      authorAvatar: config.icon,
      authorColor: config.color,
      isAgentMessage: true,
      month,
      year
    });

    try {
      getIO().to(channelId).emit('message_posted',
        (message as any).toObject ? (message as any).toObject() : message
      );
    } catch (_) {}

    createdMessages.push(message);
    await new Promise(resolve => setTimeout(resolve, 300));

  } catch (err) {
    // Always clear typing on error
    try {
      getIO().to(channelId).emit('agent_typing', { agentId, isTyping: false });
    } catch (_) {}
    console.error(`Agent ${agentId} failed:`, (err as Error).message);
  }
}
```

Also update the `buildAgentPrompt` call in `triggerConversationalDiscussion`:
```typescript
// BEFORE:
const basePrompt = buildAgentPrompt('', scenario, companyState, '');

// AFTER:
const fullPrompt = buildAgentPrompt(
  agentId,
  scenario,
  companyState,
  '',
  threadHistory.map(t => ({ agentName: t.agentName, content: t.content }))
);
const content = await getAgentResponse(agentId, fullPrompt);
```

---

## Files changed (backend only)
- `src/utils/mention.utils.ts` — expanded routing (6-tier fallback logic)
- `src/utils/prompt.utils.ts` — per-agent voice anchors + non-English detection
- `src/socket/socket.handler.ts` — `io.to()` instead of `socket.to()`, typing emitted before Ollama
- `src/services/agent.service.ts` — per-agent prompts, clear typing per-agent as message posts
