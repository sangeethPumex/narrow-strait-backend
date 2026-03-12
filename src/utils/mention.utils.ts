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

// Natural name detection — no @ required
// Order matters: longer/more specific patterns first
const NATURAL_NAME_MAP: Array<{ patterns: string[]; agentId: string }> = [
  {
    patterns: ['marcus wei', 'marcus', 'cto'],
    agentId: 'cto-marcus',
  },
  {
    patterns: ['priya patel', 'priya'],
    agentId: 'cfo-priya',
  },
  {
    patterns: ['james park', 'james'],
    agentId: 'coo-james',
  },
  {
    patterns: ['alex rivera', 'alex', 'counsel', 'lawyer'],
    agentId: 'legal-counsel',
  },
  {
    patterns: ['market intel', 'market intelligence', 'competitor'],
    agentId: 'competitor-monitor',
  },
  {
    patterns: ['uncertainty agent', 'wildcard', 'chaos'],
    agentId: 'wildcard-chaos',
  },
];

export const BOARD_AGENTS = ['cto-marcus', 'cfo-priya', 'coo-james'];
export const ALL_AGENTS   = [
  'cto-marcus', 'cfo-priya', 'coo-james',
  'legal-counsel', 'competitor-monitor', 'wildcard-chaos',
];

// Cross-functional: topic matches 2 specific agents
const CROSS_FUNCTIONAL: Array<{ keywords: string[]; agentIds: string[] }> = [
  {
    keywords: ['aws', 'gcp', 'azure', 'cloud', 'switch', 'migrate', 'migration',
               'infrastructure', 'hosting', 'server'],
    agentIds: ['cto-marcus', 'cfo-priya'],
  },
  {
    keywords: ['hire', 'hiring', 'headcount', 'recruit', 'salary', 'offer letter',
               'compensation', 'equity grant'],
    agentIds: ['coo-james', 'cfo-priya'],
  },
  {
    keywords: ['series a', 'fundraise', 'raise', 'investor', 'term sheet', 'valuation'],
    agentIds: ['cfo-priya', 'coo-james'],
  },
  {
    keywords: ['launch', 'release', 'ship', 'go live', 'deploy to prod'],
    agentIds: ['cto-marcus', 'coo-james'],
  },
  {
    keywords: ['wife', 'husband', 'friend', 'family', 'vp of', 'director of',
               'promote', 'promotion', 'fire', 'fired', 'let go', 'performance pip'],
    agentIds: ['coo-james'],
  },
  {
    keywords: ['gdpr', 'compliance', 'contract', 'nda', 'ip', 'patent',
               'regulation', 'liability', 'privacy', 'soc2'],
    agentIds: ['legal-counsel'],
  },
  {
    keywords: ['palantir', 'databricks', 'snowflake', 'tableau', 'competitor',
               'market share', 'win rate', 'deal lost'],
    agentIds: ['competitor-monitor'],
  },
];

// Single-domain strong signals -> 1 agent
const SINGLE_DOMAIN: Array<{ keywords: string[]; agentId: string }> = [
  {
    keywords: ['budget', 'runway', 'burn', 'arr', 'revenue', 'cash',
               'margin', 'unit economics', 'cac', 'ltv', 'cost'],
    agentId: 'cfo-priya',
  },
  {
    keywords: ['technical', 'build', 'engineer', 'architect', 'code', 'stack',
               'api', 'database', 'performance', 'latency', 'tech debt', 'bug'],
    agentId: 'cto-marcus',
  },
  {
    keywords: ['customer', 'clients', 'pilot', 'onboard', 'churn', 'client',
               'deal', 'close', 'sales', 'pipeline', 'conversion', 'paying',
               'accounts', 'who are our', 'current clients'],
    agentId: 'coo-james',
  },
];

// General board-level strategy -> all 3 board agents
const BOARD_STRATEGY_KEYWORDS = [
  'strategy', 'roadmap', 'quarter', 'q1', 'q2', 'q3', 'q4',
  'milestone', 'goal', 'objective', 'vision', 'pivot',
  'expand', 'new market', 'new vertical',
];

export function parseMentions(content: string): string[] | null {
  const lower = content.toLowerCase();
  const mentioned: string[] = [];

  // 1. Check @mention aliases
  for (const [alias, agentId] of Object.entries(MENTION_MAP)) {
    if (lower.includes(alias)) {
      if (agentId === '__all__')   return [...ALL_AGENTS];
      if (agentId === '__board__') return [...BOARD_AGENTS];
      if (!mentioned.includes(agentId)) mentioned.push(agentId);
    }
  }
  if (mentioned.length > 0) return mentioned;

  // 2. Check natural name references (no @ needed)
  for (const { patterns, agentId } of NATURAL_NAME_MAP) {
    for (const pattern of patterns) {
      // Match whole word or phrase — avoids partial matches
      const regex = new RegExp(`\\b${pattern}\\b`, 'i');
      if (regex.test(lower)) {
        if (!mentioned.includes(agentId)) mentioned.push(agentId);
        break; // found this agent, move to next
      }
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
  const inChannel = (id: string) => channelAgentIds.includes(id);

  // 1. Explicit @mention
  const mentioned = parseMentions(lower);
  if (mentioned) return mentioned.filter(inChannel);

  // 2. Cross-functional -> specific 1-2 agents
  for (const { keywords, agentIds } of CROSS_FUNCTIONAL) {
    if (keywords.some(kw => lower.includes(kw))) {
      const result = agentIds.filter(inChannel);
      if (result.length > 0) return result;
    }
  }

  // 3. Single-domain strong match -> 1 agent
  for (const { keywords, agentId } of SINGLE_DOMAIN) {
    if (inChannel(agentId) && keywords.some(kw => lower.includes(kw))) {
      return [agentId];
    }
  }

  // 4. Board strategy -> all 3 board agents
  if (BOARD_STRATEGY_KEYWORDS.some(kw => lower.includes(kw))) {
    return BOARD_AGENTS.filter(inChannel);
  }

  // 5. Question -> 1 board agent (CTO first, then CFO, then COO)
  if (lower.includes('?')) {
    const board = BOARD_AGENTS.filter(inChannel);
    // Rotate based on message length so it's not always Marcus
    return board.length > 0 ? [board[lower.length % board.length]] : [];
  }

  // 6. Short message <= 4 words -> 1 rotating board agent
  if (wordCount <= 4) {
    const board = BOARD_AGENTS.filter(inChannel);
    return board.length > 0 ? [board[lower.length % board.length]] : [];
  }

  // 7. Longer unrecognized message -> CTO (most likely to engage with anything)
  const cto = channelAgentIds.find(id => id === 'cto-marcus');
  return cto ? [cto] : [];
}
