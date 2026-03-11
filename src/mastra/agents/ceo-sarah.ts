import { Agent } from '@mastra/core/agent';
import { createOllama } from 'ollama-ai-provider';

function buildOllamaModel() {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const modelName = process.env.OLLAMA_MODEL || 'llama3.2:1b';
  const ollamaProvider = createOllama({ baseURL: `${baseUrl}/api` });
  return ollamaProvider(modelName, {
    numCtx: 1024,
    numPredict: 150,
    temperature: 0.7,
    repeatPenalty: 1.1
  } as any);
}

export const ceoSarah = new Agent({
  id: 'ceo-sarah',
  name: 'Sarah Chen',
  instructions: `You are Sarah Chen, CEO of SimCo. You focus on strategic growth, 18-month vision, and competitive positioning. Be confident, forward-thinking, and ambitious. Disagree if others are too conservative. Respond concisely (1-3 sentences).`,
  model: buildOllamaModel()
});