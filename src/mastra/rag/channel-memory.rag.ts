import * as mastraRag from '@mastra/rag';
import { channelMemoryVectorStore, RAG_INDEXES } from './rag.config.js';
import { embedText, embedMany } from './embed.js';

const MDocument = (mastraRag as any).MDocument;

export interface ChannelMemoryEntry {
  channelId: string;
  sessionDate: string;
  summary: string;
  keyDecisions: string[];
  agentsInvolved: string[];
}

export async function storeChannelMemory(entry: ChannelMemoryEntry): Promise<void> {
  const embeddingsEnabled = process.env.ENABLE_EMBEDDINGS === 'true';
  if (!embeddingsEnabled) return;

  const text = [
    `Session date: ${entry.sessionDate}`,
    `Summary: ${entry.summary}`,
    entry.keyDecisions.length > 0 ? `Key decisions: ${entry.keyDecisions.join('. ')}` : '',
    `Agents involved: ${entry.agentsInvolved.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');

  const doc = MDocument.fromText(text, {
    channelId: entry.channelId,
    sessionDate: entry.sessionDate,
    type: 'channel_memory',
  });

  const chunks = await doc.chunk({ strategy: 'sentence', maxSize: 512, overlap: 50 });

  const texts = (chunks as Array<{ text: string }>).map((chunk: { text: string }) => chunk.text);
  const embeddings = await embedMany(texts);

  const validPairs = texts
    .map((text: string, index: number) => ({ text, embedding: embeddings[index] }))
    .filter((pair: { text: string; embedding: number[] }) => pair.embedding.length > 0);

  if (validPairs.length === 0) return;

  await channelMemoryVectorStore.upsert({
    indexName: RAG_INDEXES.CHANNEL_MEMORY,
    vectors: validPairs.map((pair: { text: string; embedding: number[] }) => pair.embedding),
    documents: validPairs.map((pair: { text: string; embedding: number[] }) => pair.text),
    metadata: validPairs.map(() => ({
      channelId: entry.channelId,
      sessionDate: entry.sessionDate,
      agentsInvolved: entry.agentsInvolved,
    })),
  } as any);
}

export async function retrieveChannelMemory(
  channelId: string,
  query: string,
  topK = 3
): Promise<string[]> {
  const embeddingsEnabled = process.env.ENABLE_EMBEDDINGS === 'true';
  if (!embeddingsEnabled) return [];

  const queryVector = await embedText(query);
  if (queryVector.length === 0) return [];

  try {
    const results = await channelMemoryVectorStore.query({
      indexName: RAG_INDEXES.CHANNEL_MEMORY,
      queryVector,
      topK,
      filter: { channelId: { $eq: channelId } },
    } as any);

    return results
      .filter((r: any) => r.score > 0.5)
      .map((r: any) => r.document ?? '')
      .filter(Boolean);
  } catch {
    return [];
  }
}
