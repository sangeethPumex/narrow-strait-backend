export async function embedWithOllama(text: string): Promise<number[]> {
  // Skip if embeddings are disabled
  if (process.env.ENABLE_EMBEDDINGS !== 'true') {
    return [];
  }

  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  // Uses dedicated embedding model, NOT the chat model
  const model = process.env.OLLAMA_EMBED_MODEL || 'all-minilm';

  try {
    const response = await fetch(`${baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: text }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error(
        `❌ Embedding failed [${model}]: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const data = (await response.json()) as { embedding?: number[] };

    if (!data.embedding || data.embedding.length === 0) {
      console.error(
        `❌ Empty embedding returned — is ${model} installed? Run: ollama pull ${model}`
      );
      return [];
    }

    console.log(
      `✅ [${model}] embedded "${text.slice(0, 40)}..." → ${data.embedding.length} dims`
    );
    return data.embedding;
  } catch (error) {
    const err = error as Error;
    if (err.name === 'TimeoutError') {
      console.error(`❌ Embedding timed out for model ${model}`);
    } else {
      console.error(`❌ Embedding error [${model}]:`, err.message);
    }
    return [];
  }
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA?.length || !vecB?.length) return 0;
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * (vecB[i] || 0), 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}
