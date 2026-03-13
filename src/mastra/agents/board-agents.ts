import { Agent } from '@mastra/core/agent';

// Import the real agents so board-agents never duplicates instructions
import { ctoMarcus } from './cto-marcus.js';
import { cfoPriya } from './cfo-priya.js';
import { cooJames } from './coo-james.js';
import { legalCounsel } from './legal-counsel.js';
import { competitorMonitor } from './competitor-monitor.js';
import { wildcardChaos } from './wildcard-chaos.js';

export interface AgentConfigItem {
  id: string;
  name: string;
  role: string;
  type: 'board' | 'legal' | 'external_competitor' | 'external_wildcard';
  color: string;
  icon: string;
}

// Metadata only — no instructions here, instructions live in the individual files
export const boardAgentConfigs: AgentConfigItem[] = [
  {
    id: 'cto-marcus',
    name: 'Marcus Wei',
    role: 'CTO',
    type: 'board',
    color: 'from-blue-600 to-cyan-600',
    icon: '👨‍💻',
  },
  {
    id: 'cfo-priya',
    name: 'Priya Nair',
    role: 'CFO',
    type: 'board',
    color: 'from-green-600 to-emerald-600',
    icon: '📊',
  },
  {
    id: 'coo-james',
    name: 'James Park',
    role: 'COO',
    type: 'board',
    color: 'from-orange-600 to-red-600',
    icon: '⚙️',
  },
];

export const specialistAgentConfigs: AgentConfigItem[] = [
  {
    id: 'legal-counsel',
    name: 'Alex Rivera',
    role: 'General Counsel',
    type: 'legal',
    color: 'from-indigo-600 to-blue-600',
    icon: '⚖️',
  },
  {
    id: 'competitor-monitor',
    name: 'Market Intel',
    role: 'Competitor Watch',
    type: 'external_competitor',
    color: 'from-red-600 to-pink-600',
    icon: '🎯',
  },
  {
    id: 'wildcard-chaos',
    name: 'Uncertainty Agent',
    role: 'Wild Cards',
    type: 'external_wildcard',
    color: 'from-yellow-600 to-orange-600',
    icon: '⚡',
  },
];

export const allAgentConfigs: AgentConfigItem[] = [
  ...boardAgentConfigs,
  ...specialistAgentConfigs,
];

export function getAgentConfig(agentId: string): AgentConfigItem | undefined {
  return allAgentConfigs.find(a => a.id === agentId);
}

// Agent instances always come from the individual files — single source of truth
const _agentInstanceMap: Record<string, Agent> = {
  'cto-marcus': ctoMarcus,
  'cfo-priya': cfoPriya,
  'coo-james': cooJames,
  'legal-counsel': legalCounsel,
  'competitor-monitor': competitorMonitor,
  'wildcard-chaos': wildcardChaos,
};

export function createBoardAgents(): Agent[] {
  return [ctoMarcus, cfoPriya, cooJames];
}

export function createSpecialistAgents(): Agent[] {
  return [legalCounsel, competitorMonitor, wildcardChaos];
}

export function createAllAgents(): Agent[] {
  return [...createBoardAgents(), ...createSpecialistAgents()];
}

export function getAgentInstance(agentId: string): Agent | undefined {
  return _agentInstanceMap[agentId];
}
