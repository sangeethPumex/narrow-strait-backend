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
