import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  ctoMarcus,
  cfoPriya,
  cooJames,
  legalCounsel,
  competitorMonitor,
  wildcardChaos
} from '../agents/index.js';

const AGENT_REGISTRY: Record<string, any> = {
  'cto-marcus': ctoMarcus,
  'cfo-priya': cfoPriya,
  'coo-james': cooJames,
  'legal-counsel': legalCounsel,
  'competitor-monitor': competitorMonitor,
  'wildcard-chaos': wildcardChaos
};

const generateResponsesStep = createStep({
  id: 'generate-responses',
  description: 'Generate responses from multiple Narrow Striat board agents',
  inputSchema: z.object({
    agentIds: z.string().describe('Comma-separated agent IDs, e.g. cto-marcus,cfo-priya,coo-james'),
    prompt: z.string().describe('The scenario or question for the agents')
  }),
  outputSchema: z.object({
    summary: z.string()
  }),
  execute: async ({ inputData }) => {
    const agentIdList = inputData.agentIds.split(',').map((id: string) => id.trim()).filter(Boolean);
    const lines: string[] = [];

    for (const agentId of agentIdList) {
      const agent = AGENT_REGISTRY[agentId];
      if (!agent) {
        lines.push(`[${agentId}]: Agent not found.`);
        continue;
      }
      try {
        const result = await agent.generateLegacy(inputData.prompt);
        lines.push(`[${agent.name ?? agentId}]: ${result.text ?? ''}`);
      } catch (err: any) {
        lines.push(`[${agentId}]: Error — ${err?.message}`);
      }
    }

    return { summary: lines.join('\n\n') };
  }
});

export const discussionWorkflow = createWorkflow({
  id: 'multi-agent-discussion',
  description: 'Trigger a multi-agent board discussion on any scenario',
  inputSchema: z.object({
    agentIds: z.string().describe('Comma-separated agent IDs, e.g. cto-marcus,cfo-priya,coo-james'),
    prompt: z.string().describe('The scenario or question to discuss')
  }),
  outputSchema: z.object({
    summary: z.string()
  })
})
  .then(generateResponsesStep)
  .commit();
