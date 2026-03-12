import * as mastraRag from '@mastra/rag';
import { companyProgressVectorStore, RAG_INDEXES } from './rag.config.js';
import { embedText } from './embed.js';

const MDocument = (mastraRag as any).MDocument;

export type ProgressEventType =
  | 'new_client'
  | 'client_churned'
  | 'funding'
  | 'hiring'
  | 'product_milestone'
  | 'financial_update'
  | 'general';

export interface ProgressEvent {
  type: ProgressEventType;
  description: string;
  recordedAt: string;
  recordedBy?: string;
}

export async function recordProgressEvent(event: ProgressEvent): Promise<void> {
  const embeddingsEnabled = process.env.ENABLE_EMBEDDINGS === 'true';
  if (!embeddingsEnabled) return;

  const text = `[${event.recordedAt}] ${event.type.toUpperCase()}: ${event.description}`;

  const doc = MDocument.fromText(text, {
    type: event.type,
    recordedAt: event.recordedAt,
    recordedBy: event.recordedBy ?? 'user',
  });

  const chunks = await doc.chunk({ strategy: 'sentence', maxSize: 256, overlap: 0 });
  if (chunks.length === 0) return;

  const embedding = await embedText(chunks[0].text);
  if (embedding.length === 0) return;

  await companyProgressVectorStore.upsert({
    indexName: RAG_INDEXES.COMPANY_PROGRESS,
    vectors: [embedding],
    documents: [chunks[0].text],
    metadata: [{
      type: event.type,
      recordedAt: event.recordedAt,
      recordedBy: event.recordedBy ?? 'user',
    }],
  } as any);
}

export async function retrieveProgressEvents(
  query: string,
  topK = 5,
  eventType?: ProgressEventType
): Promise<string[]> {
  const embeddingsEnabled = process.env.ENABLE_EMBEDDINGS === 'true';
  if (!embeddingsEnabled) return [];

  const queryVector = await embedText(query);
  if (queryVector.length === 0) return [];

  const filter = eventType ? { type: { $eq: eventType } } : undefined;

  try {
    const results = await companyProgressVectorStore.query({
      indexName: RAG_INDEXES.COMPANY_PROGRESS,
      queryVector,
      topK,
      filter,
    } as any);

    return results
      .filter((r: any) => r.score > 0.4)
      .map((r: any) => r.document ?? '')
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function getRecentProgressEvents(topK = 10): Promise<string[]> {
  const embeddingsEnabled = process.env.ENABLE_EMBEDDINGS === 'true';
  if (!embeddingsEnabled) return [];

  const queryVector = await embedText('company news clients funding progress milestones');
  if (queryVector.length === 0) return [];

  try {
    const results = await companyProgressVectorStore.query({
      indexName: RAG_INDEXES.COMPANY_PROGRESS,
      queryVector,
      topK,
    } as any);

    return results.map((r: any) => r.document ?? '').filter(Boolean);
  } catch {
    return [];
  }
}
