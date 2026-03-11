import { Request, Response, NextFunction } from 'express';

let ollamaAvailable = true;
let lastChecked = 0;
const CHECK_INTERVAL = 30000;

async function checkOllama(): Promise<boolean> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Middleware that blocks agent calls if Ollama is down
export async function requireOllama(_req: Request, res: Response, next: NextFunction) {
  const now = Date.now();

  // Only recheck after interval to avoid hammering
  if (now - lastChecked > CHECK_INTERVAL) {
    ollamaAvailable = await checkOllama();
    lastChecked = now;
  }

  if (!ollamaAvailable) {
    return res.status(503).json({
      error: 'Ollama is not available. Make sure Ollama is running on port 11434.',
      hint: 'Run: ollama serve'
    });
  }

  return next();
}

export { checkOllama };
