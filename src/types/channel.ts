export interface Channel {
  _id?: string;
  name: string;
  displayName: string;
  type: 'group' | 'dm';
  description?: string;
  members: Array<{
    id: string;
    name: string;
    role?: string;
    joinedAt: Date;
  }>;
  messageCount: number;
  stats: {
    totalMessages: number;
    agentMessages: number;
    userMessages: number;
    lastAgentAt?: Date;
    lastUserAt?: Date;
  };
  lastMessageAt?: Date;
  vectorMemory: Array<{
    month: number;
    summary: string;
    keyDecisions: string[];
    embedding: number[];
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChannelDto {
  name: string;
  displayName: string;
  type: 'group' | 'dm';
  description?: string;
  members: Channel['members'];
}
