import { MongoDBVector } from '@mastra/mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/simco-slack';
const DB_NAME = 'simco-slack';

export const channelMemoryVectorStore = new MongoDBVector({
  id: 'channel-memory-store',
  uri: MONGODB_URI,
  dbName: DB_NAME,
});

export const companyDocsVectorStore = new MongoDBVector({
  id: 'company-docs-store',
  uri: MONGODB_URI,
  dbName: DB_NAME,
});

export const companyProgressVectorStore = new MongoDBVector({
  id: 'company-progress-store',
  uri: MONGODB_URI,
  dbName: DB_NAME,
});

export const RAG_INDEXES = {
  CHANNEL_MEMORY: 'channel_memory_vectors',
  COMPANY_DOCS: 'company_docs_vectors',
  COMPANY_PROGRESS: 'company_progress_vectors',
} as const;

export const EMBED_DIMENSION = 384;
