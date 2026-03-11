import { getMultiAgentResponses, getAgentConfig } from '../mastra/index.js';
import { messageService } from './message.service.js';
import { channelService } from './channel.service.js';
import { buildAgentPrompt } from '../utils/prompt.utils.js';
import { companyStateCRUD } from '../modals/index.js';

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

    const recentMessages = await messageService.getChannelMessages(channelId, 5);
    const context = recentMessages
      .map(m => `${m.authorName}: ${m.content}`)
      .join('\n');

    // Fetch live company state (creates default if none exists)
    const companyState = await companyStateCRUD.getOrCreateDefault();

    const prompt = buildAgentPrompt('', scenario, companyState, context);
    const agentResponses = await getMultiAgentResponses(targetAgentIds, prompt);

    const createdMessages = [];
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

      createdMessages.push(message);
    }

    return createdMessages;
  }
};
