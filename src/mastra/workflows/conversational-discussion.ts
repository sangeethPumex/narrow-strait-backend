import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  ctoMarcus,
  cfoPriya,
  cooJames,
  legalCounsel,
  competitorMonitor,
  wildcardChaos
} from '../agents/index.js';

export type ConversationalScenario = {
  title: string;
  description: string;
};

export type ConversationalMessage = {
  agentId: string;
  agentName: string;
  content: string;
};

type ConversationalWorkflowInput = {
  agentIds: string[];
  scenario: ConversationalScenario;
  channelId: string;
  rounds?: number;
};

type TurnGenerator = (args: {
  agentId: string;
  scenario: ConversationalScenario;
  channelId: string;
  rounds: number;
  roundNumber: number;
  threadHistory: ConversationalMessage[];
}) => Promise<ConversationalMessage>;

const AGENT_REGISTRY: Record<string, any> = {
  'cto-marcus': ctoMarcus,
  'cfo-priya': cfoPriya,
  'coo-james': cooJames,
  'legal-counsel': legalCounsel,
  'competitor-monitor': competitorMonitor,
  'wildcard-chaos': wildcardChaos
};

function normalizeRounds(rounds?: number) {
  if (typeof rounds !== 'number' || Number.isNaN(rounds) || !Number.isFinite(rounds)) return 2;
  return Math.max(1, Math.floor(rounds));
}

export async function runConversationalDiscussion(
  input: ConversationalWorkflowInput,
  turnGenerator: TurnGenerator
): Promise<ConversationalMessage[]> {
  const rounds = normalizeRounds(input.rounds);
  const threadHistory: ConversationalMessage[] = [];

  for (let roundNumber = 1; roundNumber <= rounds; roundNumber += 1) {
    for (const agentId of input.agentIds) {
      const message = await turnGenerator({
        agentId,
        scenario: input.scenario,
        channelId: input.channelId,
        rounds,
        roundNumber,
        threadHistory: [...threadHistory]
      });

      threadHistory.push(message);
    }
  }

  return threadHistory;
}

const conversationalDiscussionStep = createStep({
  id: 'run-conversational-discussion',
  description: 'Runs a sequential multi-round board discussion',
  inputSchema: z.object({
    agentIds: z.array(z.string()).min(1),
    scenario: z.object({
      title: z.string(),
      description: z.string()
    }),
    channelId: z.string(),
    rounds: z.number().int().positive().default(2)
  }),
  outputSchema: z.object({
    messages: z.array(
      z.object({
        agentId: z.string(),
        agentName: z.string(),
        content: z.string()
      })
    )
  }),
  execute: async ({ inputData }) => {
    const messages = await runConversationalDiscussion(
      {
        agentIds: inputData.agentIds,
        scenario: inputData.scenario,
        channelId: inputData.channelId,
        rounds: inputData.rounds
      },
      async ({ agentId, scenario, threadHistory }) => {
        const agent = AGENT_REGISTRY[agentId];
        if (!agent) {
          return { agentId, agentName: agentId, content: 'Agent not found.' };
        }

        const historyText =
          threadHistory.length > 0
            ? threadHistory.map(m => `${m.agentName}: ${m.content}`).join('\n\n')
            : 'No previous responses yet.';

        const prompt = `## Scenario\n${scenario.title}: ${scenario.description}\n\n## Thread History\n${historyText}`;
        const result = await agent.generateLegacy(prompt);

        return {
          agentId,
          agentName: agent.name ?? agentId,
          content: result.text ?? ''
        };
      }
    );

    return { messages };
  }
});

export const conversationalDiscussionWorkflow = createWorkflow({
  id: 'conversational-discussion',
  description: 'Sequential round-robin discussion where agents react to thread history',
  inputSchema: z.object({
    agentIds: z.array(z.string()).min(1),
    scenario: z.object({
      title: z.string(),
      description: z.string()
    }),
    channelId: z.string(),
    rounds: z.number().int().positive().default(2)
  }),
  outputSchema: z.object({
    messages: z.array(
      z.object({
        agentId: z.string(),
        agentName: z.string(),
        content: z.string()
      })
    )
  })
})
  .then(conversationalDiscussionStep)
  .commit();
