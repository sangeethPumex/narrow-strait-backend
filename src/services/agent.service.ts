import { getMultiAgentResponses, getAgentConfig, getAgentResponse } from '../mastra/index.js';
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
      agentIds || channel.members.filter(m => m.id !== 'user').map(m => m.id);

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

    // Fetch live company state (creates default if none exists)
    const companyState = await companyStateCRUD.getOrCreateDefault();

    const prompt = buildAgentPrompt('', scenario, companyState, context);
    const agentResponses = await getMultiAgentResponses(targetAgentIds, prompt);

    const createdMessages: Awaited<ReturnType<typeof messageService.createMessage>>[] = [];
    for (const agentId of targetAgentIds) {
      const response = agentResponses[agentId];
      if (!response) continue;

      const config = getAgentConfig(agentId);
      if (!config) continue;

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
        getIO().to(channelId).emit('message_posted', {
          _id: message._id,
          authorId: agentId,
          authorName: config.name,
          authorRole: config.role,
          authorAvatar: config.icon,
          authorColor: config.color,
          content: response,
          channelId,
          isAgentMessage: true,
          timestamp: new Date()
        });
      } catch (e) {
        console.warn('Socket emit skipped — io not ready');
      }

      createdMessages.push(message);
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
      agentIds || channel.members.filter(m => m.id !== 'user').map(m => m.id);

    // Fetch live company state (creates default if none exists)
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

        const basePrompt = buildAgentPrompt('', scenario, companyState, '');
        const threadSection = threadHistory.length > 0
          ? `\n## What Your Colleagues Have Said So Far\n${threadHistory
              .map(t => `[${t.agentName}]: ${t.content}`)
              .join('\n\n')}\n\nNow respond in character. React to what your colleagues said above.\nDo NOT repeat what they already said. Add your own perspective.`
          : '\nYou are the first to respond. Set the tone for this discussion.';

        const fullPrompt = basePrompt + threadSection;
        const content = await getAgentResponse(agentId, fullPrompt);

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
          getIO().to(channelId).emit('message_posted', {
            _id: message._id,
            authorId: agentId,
            authorName: config.name,
            authorRole: config.role,
            authorAvatar: config.icon,
            authorColor: config.color,
            content,
            channelId,
            isAgentMessage: true,
            timestamp: new Date()
          });
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
