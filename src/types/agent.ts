export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  type: 'board' | 'legal' | 'external_competitor' | 'external_wildcard';
  color: string;
  icon: string;
  instructions: string;
  riskTolerance: number;
  focusAreas: string[];
}

export interface AgentResponse {
  agentId: string;
  agentName: string;
  recommendation: string;
  reasoning: string;
  risks: string[];
  opportunities: string[];
  confidence: number;
}

export interface ToolInput {
  channelId?: string;
  query?: string;
  limit?: number;
  threshold?: number;
}
