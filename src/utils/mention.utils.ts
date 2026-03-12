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
  'legal-counsel', 'competitor-monitor', 'wildcard-chaos',
];

// Cross-functional: topic matches 2 specific agents
const CROSS_FUNCTIONAL: Array<{ keywords: string[]; agentIds: string[] }> = [
  {
    // Infrastructure / cloud / tech decisions with cost implications
    keywords: ['aws', 'gcp', 'azure', 'cloud', 'switch', 'migrate', 'migration',
      'move from', 'vs ', ' or ', 'replace', 'infrastructure', 'hosting'],
    agentIds: ['cto-marcus', 'cfo-priya'],
  },
  {
    // Hiring with financial impact
    keywords: ['hire', 'hiring', 'headcount', 'recruit', 'salary', 'comp',
      'compensation', 'equity', 'offer'],
    agentIds: ['coo-james', 'cfo-priya'],
  },
  {
    // Fundraising / investors
    keywords: ['series a', 'fundraise', 'raise', 'investor', 'term sheet',
      'valuation', 'dilution', 'cap table'],
    agentIds: ['cfo-priya', 'coo-james'],
  },
  {
    // Product launch / go-live
    keywords: ['launch', 'release', 'ship', 'go live', 'deploy to prod',
      'production release'],
    agentIds: ['cto-marcus', 'coo-james'],
  },
  {
    // People / team / culture decisions (including personal ones like "wife", "friend", "family")
    keywords: ['wife', 'husband', 'friend', 'family', 'co-founder', 'partner',
      'vp', 'director', 'manager', 'title', 'role', 'promote', 'promotion',
      'fired', 'fire', 'let go', 'performance'],
    agentIds: ['coo-james'],  // people decisions -> just James
  },
  {
    // Legal / compliance
    keywords: ['legal', 'compliance', 'gdpr', 'contract', 'nda', 'ip',
      'patent', 'regulation', 'liability', 'privacy', 'soc2'],
    agentIds: ['legal-counsel'],
  },
  {
    // Market / competition
    keywords: ['competitor', 'palantir', 'databricks', 'snowflake', 'tableau',
      'market share', 'win', 'lose', 'deal lost', 'pricing'],
    agentIds: ['competitor-monitor'],
  },
];

// Single-domain strong signals -> 1 agent
const SINGLE_DOMAIN: Array<{ keywords: string[]; agentId: string }> = [
  {
    keywords: ['budget', 'runway', 'burn', 'arr', 'revenue', 'cash', 'finance',
      'profit', 'margin', 'unit economics', 'cac', 'ltv'],
    agentId: 'cfo-priya',
  },
  {
    keywords: ['technical', 'build', 'engineer', 'architect', 'code', 'stack',
      'api', 'system', 'database', 'performance', 'latency', 'tech debt'],
    agentId: 'cto-marcus',
  },
  {
    keywords: ['customer', 'pilot', 'onboard', 'churn', 'client', 'deal',
      'close', 'sales', 'pipeline', 'conversion'],
    agentId: 'coo-james',
  },
];

// General board-level strategy -> all 3 board agents
const BOARD_STRATEGY_KEYWORDS = [
  'strategy', 'roadmap', 'quarter', 'q1', 'q2', 'q3', 'q4',
  'milestone', 'goal', 'objective', 'vision', 'mission', 'pivot',
  'expand', 'new market', 'new vertical', 'series b',
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
