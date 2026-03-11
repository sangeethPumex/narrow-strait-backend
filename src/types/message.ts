export interface Message {
  _id?: string;
  channelId: string;
  month: number;
  year: number;
  authorId: string;
  authorName: string;
  authorRole?: string;
  authorAvatar?: string;
  authorColor?: string;
  content: string;
  contentType: 'text' | 'voice' | 'system';
  voiceUrl?: string;
  isAgentMessage: boolean;
  agentPersonality?: {
    tone: string;
    confidence: number;
    certainty: string;
  };
  vectorEmbedding?: number[];
  reactions: Array<{ emoji: string; users: string[] }>;
  mentionedAgents?: string[];
  linkedScenarioId?: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageDto {
  channelId: string;
  content: string;
  contentType?: 'text' | 'voice';
  voiceUrl?: string;
}

export interface MessageWithSimilarity extends Message {
  similarity?: number;
}
