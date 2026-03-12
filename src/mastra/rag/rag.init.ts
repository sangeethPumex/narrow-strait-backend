import {
  channelMemoryVectorStore,
  companyDocsVectorStore,
  companyProgressVectorStore,
  RAG_INDEXES,
  EMBED_DIMENSION,
} from './rag.config.js';

export async function initRAGIndexes() {
  const stores = [
    { store: channelMemoryVectorStore, index: RAG_INDEXES.CHANNEL_MEMORY },
    { store: companyDocsVectorStore, index: RAG_INDEXES.COMPANY_DOCS },
    { store: companyProgressVectorStore, index: RAG_INDEXES.COMPANY_PROGRESS },
  ];

  for (const { store, index } of stores) {
    try {
      await store.connect();
      await store.createIndex({
        indexName: index,
        dimension: EMBED_DIMENSION,
        metric: 'cosine',
      } as any);
      console.log(`✅ RAG index ready: ${index}`);
    } catch (err: any) {
      if (!err.message?.includes('already exists') && !err.message?.includes('IndexAlreadyExists')) {
        console.warn(`⚠️  RAG index ${index}: ${err.message}`);
      }
    }
  }
}
