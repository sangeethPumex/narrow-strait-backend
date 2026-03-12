import { Request, Response, NextFunction } from 'express';

const CHAT_MODEL = process.env.OLLAMA_MODEL || 'hermes3:8b';
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'all-minilm';

let ollamaAvailable = true;
let lastChecked = 0;
const CHECK_INTERVAL = 30000;

// Check if a specific model is available in Ollama
async function checkModelAvailable(modelName: string): Promise<boolean> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000)
    });

    if (!res.ok) {
      return false;
    }

    const data = (await res.json()) as { models: { name: string }[] };
    // Check if model name appears in the list
    return data.models.some(m => m.name.startsWith(modelName.split(':')[0]));
  } catch {
    return false;
  }
}

export async function checkOllama(): Promise<boolean> {
  return checkModelAvailable(CHAT_MODEL);
}

export async function checkEmbedModel(): Promise<boolean> {
  if (process.env.ENABLE_EMBEDDINGS !== 'true') return true;
  return checkModelAvailable(EMBED_MODEL);
}

// Middleware: block agent routes if chat model unavailable
export async function requireOllama(_req: Request, res: Response, next: NextFunction) {
  const now = Date.now();

  if (now - lastChecked > CHECK_INTERVAL) {
    ollamaAvailable = await checkOllama();
    lastChecked = now;
  }

  if (!ollamaAvailable) {
    return res.status(503).json({
      error: `Chat model ${CHAT_MODEL} is not available`,
      hint: `Run: ollama pull ${CHAT_MODEL} && ollama serve`
    });
  }

  return next();
}
