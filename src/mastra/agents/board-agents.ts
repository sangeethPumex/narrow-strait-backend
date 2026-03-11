import { Agent } from '@mastra/core/agent';
import { createOllama } from 'ollama-ai-provider';

export interface AgentConfigItem {
  id: string;
  name: string;
  role: string;
  type: 'board' | 'legal' | 'external_competitor' | 'external_wildcard';
  color: string;
  icon: string;
  instructions: string;
}

export const boardAgentConfigs: AgentConfigItem[] = [
  {
    id: 'ceo-sarah',
    name: 'Sarah Chen',
    role: 'CEO',
    type: 'board',
    color: 'from-purple-600 to-pink-600',
    icon: '👩‍💼',
    instructions: `You are Sarah Chen, CEO of SimCo. You focus on strategic growth, 18-month vision, and competitive positioning. Be confident, forward-thinking, and ambitious. Disagree if others are too conservative. Respond concisely (1-3 sentences).`
  },
  {
    id: 'cto-marcus',
    name: 'Marcus Wei',
    role: 'CTO',
    type: 'board',
    color: 'from-blue-600 to-cyan-600',
    icon: '👨‍💻',
    instructions: `You are Marcus Wei, CTO. You focus on technical feasibility, quality, and engineering capacity. Think in 6-month blocks. Be pragmatic about technical reality. Disagree if commitments are unrealistic. Respond concisely (1-3 sentences).`
  },
  {
    id: 'cfo-priya',
    name: 'Priya Patel',
    role: 'CFO',
    type: 'board',
    color: 'from-green-600 to-emerald-600',
    icon: '📊',
    instructions: `You are Priya Patel, CFO. You focus on cash, runway, unit economics, and ROI. Be data-driven and conservative. Disagree if plans are financially unsustainable. Respond concisely (1-3 sentences).`
  },
  {
    id: 'coo-james',
    name: 'James Park',
    role: 'COO',
    type: 'board',
    color: 'from-orange-600 to-red-600',
    icon: '⚙️',
    instructions: `You are James Park, COO. You focus on customer success, operations, and team morale. Be pragmatic. Disagree if team will burn out or we're overcommitting. Respond concisely (1-3 sentences).`
  }
];

export const specialistAgentConfigs: AgentConfigItem[] = [
  {
    id: 'legal-counsel',
    name: 'Alex Rivera',
    role: 'General Counsel',
    type: 'legal',
    color: 'from-indigo-600 to-blue-600',
    icon: '⚖️',
    instructions: `You are Alex Rivera, General Counsel. Focus on legal risks, compliance, IP, and liability. Alert on legal and regulatory issues. Respond concisely (1-3 sentences).`
  },
  {
    id: 'competitor-monitor',
    name: 'Market Intel',
    role: 'Competitor Watch',
    type: 'external_competitor',
    color: 'from-red-600 to-pink-600',
    icon: '🎯',
    instructions: `You are Market Intelligence. Represent competitor dynamics, market shifts, industry trends. Bring external perspective. Respond concisely (1-3 sentences).`
  },
  {
    id: 'wildcard-chaos',
    name: 'Uncertainty Agent',
    role: 'Wild Cards',
    type: 'external_wildcard',
    color: 'from-yellow-600 to-orange-600',
    icon: '⚡',
    instructions: `You are Uncertainty Agent. Highlight black swans, second-order effects, tail risks, crazy opportunities. Be provocative and outside-the-box. Respond concisely (1-3 sentences).`
  }
];

export const allAgentConfigs: AgentConfigItem[] = [
  ...boardAgentConfigs,
  ...specialistAgentConfigs
];

export function getAgentConfig(agentId: string): AgentConfigItem | undefined {
  return allAgentConfigs.find(a => a.id === agentId);
}

function buildOllamaModel() {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  // Explicitly use OLLAMA_MODEL (chat) never OLLAMA_EMBED_MODEL
  const modelName = process.env.OLLAMA_MODEL || 'llama3.2:1b';
  const ollamaProvider = createOllama({ baseURL: `${baseUrl}/api` });
  return ollamaProvider(modelName, {
    numCtx: 1024,
    numPredict: 150,
    temperature: 0.7,
    repeatPenalty: 1.1
  } as any);
}

export function createBoardAgents(): Agent[] {
  const model = buildOllamaModel();
  return boardAgentConfigs.map(
    config =>
      new Agent({
        id: config.id,
        name: config.name,
        instructions: config.instructions,
        model
      })
  );
}

export function createSpecialistAgents(): Agent[] {
  const model = buildOllamaModel();
  return specialistAgentConfigs.map(
    config =>
      new Agent({
        id: config.id,
        name: config.name,
        instructions: config.instructions,
        model
      })
  );
}

export function createAllAgents(): Agent[] {
  return [...createBoardAgents(), ...createSpecialistAgents()];
}

// Lazy-instantiated agent map keyed by config id
const _agentInstances: Record<string, Agent> = {};

export function getAgentInstance(agentId: string): Agent | undefined {
  if (!_agentInstances[agentId]) {
    const config = getAgentConfig(agentId);
    if (!config) return undefined;
    const model = buildOllamaModel();
    _agentInstances[agentId] = new Agent({
      id: config.id,
      name: config.name,
      instructions: config.instructions,
      model
    });
  }
  return _agentInstances[agentId];
}
