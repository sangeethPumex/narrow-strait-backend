import * as mastraRag from '@mastra/rag';
import { companyDocsVectorStore, RAG_INDEXES } from './rag.config.js';
import { embedText, embedMany } from './embed.js';

const MDocument = (mastraRag as any).MDocument;

export type DocType = 'financial' | 'pitch' | 'contract' | 'general';

export interface IngestDocumentOptions {
  title: string;
  content: string;
  docType: DocType;
  uploadedAt?: string;
}

export async function ingestDocument(opts: IngestDocumentOptions): Promise<number> {
  const embeddingsEnabled = process.env.ENABLE_EMBEDDINGS === 'true';
  if (!embeddingsEnabled) return 0;

  const doc = MDocument.fromText(opts.content, {
    title: opts.title,
    docType: opts.docType,
    uploadedAt: opts.uploadedAt ?? new Date().toISOString(),
  });

  const chunks = await doc.chunk({
    strategy: 'recursive',
    maxSize: 512,
    overlap: 50,
  });

  const texts = (chunks as Array<{ text: string }>).map((chunk: { text: string }) => chunk.text);
  const embeddings = await embedMany(texts);

  const validPairs = texts
    .map((text: string, index: number) => ({ text, embedding: embeddings[index] }))
    .filter((pair: { text: string; embedding: number[] }) => pair.embedding.length > 0);

  if (validPairs.length === 0) return 0;

  await companyDocsVectorStore.upsert({
    indexName: RAG_INDEXES.COMPANY_DOCS,
    vectors: validPairs.map((pair: { text: string; embedding: number[] }) => pair.embedding),
    documents: validPairs.map((pair: { text: string; embedding: number[] }) => pair.text),
    metadata: validPairs.map(() => ({
      title: opts.title,
      docType: opts.docType,
      uploadedAt: opts.uploadedAt ?? new Date().toISOString(),
    })),
  } as any);

  return validPairs.length;
}

export async function retrieveDocChunks(
  query: string,
  topK = 4,
  docType?: DocType
): Promise<string[]> {
  const embeddingsEnabled = process.env.ENABLE_EMBEDDINGS === 'true';
  if (!embeddingsEnabled) return [];

  const queryVector = await embedText(query);
  if (queryVector.length === 0) return [];

  const filter = docType ? { docType: { $eq: docType } } : undefined;

  try {
    const results = await companyDocsVectorStore.query({
      indexName: RAG_INDEXES.COMPANY_DOCS,
      queryVector,
      topK,
      filter,
    } as any);

    return results
      .filter((r: any) => r.score > 0.45)
      .map((r: any) => r.document ?? '')
      .filter(Boolean);
  } catch {
    return [];
  }
}
