import { getAgentConfig, getAgentResponse } from '../mastra/index.js';
import { getAgentInstance } from '../mastra/index.js';
import { messageService } from './message.service.js';
import { channelService } from './channel.service.js';
import { buildAgentPrompt } from '../utils/prompt.utils.js';
import { companyStateCRUD } from '../modals/index.js';
import {
  runConversationalDiscussion,
  type ConversationalMessage
} from '../mastra/workflows/conversational-discussion.js';
import { summaryService } from './summary.service.js';
import { getIO } from '../socket/io.js';

export const agentService = {
  async triggerDiscussion(
    channelId: string,
    scenario: { title: string; description: string },
    agentIds?: string[],
    month = 1,
    year = 1
  ) {
    const channel = await channelService.getChannel(channelId);
    if (!channel) throw new Error('Channel not found');

    const targetAgentIds =
      agentIds ||
      channel.members
        .filter(m => m.id !== 'user' && m.id !== 'ceo-sarah')
        .map(m => m.id)
        .filter(id => getAgentConfig(id));

    const { summaries } = await summaryService.getChannelContext(channelId);
    const recentMessages = await messageService.getChannelMessagesLean(channelId, 20);

    const recentContext = recentMessages
      .map(m => `${m.authorName}: ${m.content}`)
      .join('\n');

    const summaryContext =
      summaries.length > 0
        ? summaries
            .map((s: { date: Date; summary: string }) =>
              `[${new Date(s.date).toDateString()}] ${s.summary}`
            )
            .join('\n')
        : '';

    const context = summaryContext
      ? `## Historical Context (summarized)\n${summaryContext}\n\n## Live Messages\n${recentContext}`
      : recentContext;

    const companyState = await companyStateCRUD.getOrCreateDefault();

    const createdMessages: Awaited<ReturnType<typeof messageService.createMessage>>[] = [];
    for (const agentId of targetAgentIds) {
      const config = getAgentConfig(agentId);
      if (!config) continue;

      try {
        // Per-agent identity prompt — fixes identical response problem
        const prompt = buildAgentPrompt(agentId, scenario, companyState, context);
        const response = await getAgentResponse(agentId, prompt);

        // Clear THIS agent's typing as soon as their message is ready
        try {
          getIO().to(channelId).emit('agent_typing', {
            agentId,
            agentName: config.name,
            isTyping: false
          });
        } catch (_) {}

        if (!response || response.trim() === '') continue;

        const message = await messageService.createMessage({
          channelId,
          content: response,
          authorId: agentId,
          authorName: config.name,
          authorRole: config.role,
          authorAvatar: config.icon,
          authorColor: config.color,
          isAgentMessage: true,
          month,
          year
        });

        try {
          getIO().to(channelId).emit('message_posted',
            (message as any).toObject ? (message as any).toObject() : message
          );
        } catch (_) {}

        createdMessages.push(message);
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (err) {
        // Always clear typing on error
        try {
          getIO().to(channelId).emit('agent_typing', { agentId, isTyping: false });
        } catch (_) {}
        console.error(`Agent ${agentId} failed:`, (err as Error).message);
      }
    }

    return createdMessages;
  },

  async triggerConversationalDiscussion(
    channelId: string,
    scenario: { title: string; description: string },
    agentIds?: string[],
    rounds = 2,
    month = 1,
    year = 1
  ) {
    const channel = await channelService.getChannel(channelId);
    if (!channel) throw new Error('Channel not found');

    const targetAgentIds =
      agentIds ||
      channel.members
        .filter(m => m.id !== 'user' && m.id !== 'ceo-sarah')
        .map(m => m.id)
        .filter(id => getAgentConfig(id));

    const companyState = await companyStateCRUD.getOrCreateDefault();

    const createdMessages: Awaited<ReturnType<typeof messageService.createMessage>>[] = [];

    await runConversationalDiscussion(
      {
        agentIds: targetAgentIds,
        scenario,
        channelId,
        rounds
      },
      async ({ agentId, threadHistory }) => {
        const config = getAgentConfig(agentId);
        if (!config) throw new Error(`Agent config not found for ${agentId}`);

        const agent = getAgentInstance(agentId);
        if (!agent) throw new Error(`Agent ${agentId} not found`);

        try {
          getIO().to(channelId).emit('agent_typing', {
            agentId,
            agentName: config.name,
            isTyping: true
          });
        } catch (_) {}

        let content = '';
        try {
          const fullPrompt = buildAgentPrompt(agentId, scenario, companyState, '', threadHistory);
          content = await getAgentResponse(agentId, fullPrompt);
        } finally {
          try {
            getIO().to(channelId).emit('agent_typing', {
              agentId,
              agentName: config.name,
              isTyping: false
            });
          } catch (_) {}
        }

        const message = await messageService.createMessage({
          channelId,
          content,
          authorId: agentId,
          authorName: config.name,
          authorRole: config.role,
          authorAvatar: config.icon,
          authorColor: config.color,
          isAgentMessage: true,
          month,
          year
        });

        try {
          getIO().to(channelId).emit('message_posted', message.toObject ? message.toObject() : message);
        } catch (e) {
          console.warn('Socket emit skipped — io not ready');
        }

        createdMessages.push(message);

        // After each agent responds, wait 500ms before next call
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
          agentId,
          agentName: config.name,
          content
        };
      }
    );

    return createdMessages;
  }
};
