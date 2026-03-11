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
