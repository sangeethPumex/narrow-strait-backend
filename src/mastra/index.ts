import { Mastra } from '@mastra/core';
import {
  ctoMarcus,
  cfoPriya,
  cooJames,
  legalCounsel,
  competitorMonitor,
  wildcardChaos
} from './agents/index.js';
import { vectorSearchTool, channelContextTool } from './tools/index.js';
import { discussionWorkflow } from './workflows/discussion.js';
import { conversationalDiscussionWorkflow } from './workflows/conversational-discussion.js';

export const mastra = new Mastra({
  agents: {
    'cto-marcus': ctoMarcus,
    'cfo-priya': cfoPriya,
    'coo-james': cooJames,
    'legal-counsel': legalCounsel,
    'competitor-monitor': competitorMonitor,
    'wildcard-chaos': wildcardChaos
  },
  workflows: { discussionWorkflow, conversationalDiscussionWorkflow },
  tools: { vectorSearchTool, channelContextTool }
});

export async function getAgentResponse(agentId: string, prompt: string): Promise<string> {
  const agent = getAgentInstance(agentId);
  if (!agent) throw new Error(`Agent ${agentId} not found`);
  try {
    const result = await agent.generateLegacy(prompt);
    return result.text ?? '';
  } catch (error) {
    console.error(`Agent ${agentId} error:`, error);
    throw error;
  }
}

export async function getMultiAgentResponses(
  agentIds: string[],
  prompt: string
): Promise<Record<string, string>> {
  const responses: Record<string, string> = {};
  await Promise.all(
    agentIds.map(async agentId => {
      try {
        responses[agentId] = await getAgentResponse(agentId, prompt);
      } catch (error) {
        console.error(`Failed for ${agentId}:`, error);
        responses[agentId] = '';
      }
    })
  );
  return responses;
}

export {
  vectorSearchTool,
  channelContextTool,
  discussionWorkflow,
  conversationalDiscussionWorkflow
};

// Agent configurations for backward compatibility
const agentConfigs = {
  'cto-marcus': { id: 'cto-marcus', name: 'Marcus Wei', role: 'CTO', type: 'board' as const, icon: '👨‍💻', color: 'from-blue-600 to-cyan-600' },
  'cfo-priya': { id: 'cfo-priya', name: 'Priya Patel', role: 'CFO', type: 'board' as const, icon: '📊', color: 'from-green-600 to-emerald-600' },
  'coo-james': { id: 'coo-james', name: 'James Park', role: 'COO', type: 'board' as const, icon: '⚙️', color: 'from-orange-600 to-red-600' },
  'legal-counsel': { id: 'legal-counsel', name: 'Alex Rivera', role: 'General Counsel', type: 'legal' as const, icon: '⚖️', color: 'from-indigo-600 to-blue-600' },
  'competitor-monitor': { id: 'competitor-monitor', name: 'Market Intel', role: 'Competitor Watch', type: 'external_competitor' as const, icon: '🎯', color: 'from-red-600 to-pink-600' },
  'wildcard-chaos': { id: 'wildcard-chaos', name: 'Uncertainty Agent', role: 'Wild Cards', type: 'external_wildcard' as const, icon: '⚡', color: 'from-yellow-600 to-orange-600' }
};

export function getAgentConfig(agentId: string) {
  return agentConfigs[agentId as keyof typeof agentConfigs];
}

// Agent instances keyed by config id (CEO removed — user is the Founder/CEO)
const _agentInstances: Record<string, any> = {
  'cto-marcus': ctoMarcus,
  'cfo-priya': cfoPriya,
  'coo-james': cooJames,
  'legal-counsel': legalCounsel,
  'competitor-monitor': competitorMonitor,
  'wildcard-chaos': wildcardChaos
};

export function getAgentInstance(agentId: string): any {
  return _agentInstances[agentId];
}
