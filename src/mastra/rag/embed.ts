import { embedWithOllama } from '../../utils/vector.utils.js';

export async function embedText(text: string): Promise<number[]> {
  return embedWithOllama(text);
}

export async function embedMany(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    const embedding = await embedWithOllama(text);
    results.push(embedding);
  }
  return results;
}
