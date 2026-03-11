import { channelModalCRUD } from '../modals/channel.modal.js';
import { embedWithOllama } from '../utils/vector.utils.js';

export const channelService = {
  async createChannel(data: any) {
    return channelModalCRUD.create(data);
  },

  async getChannel(id: string) {
    return channelModalCRUD.findById(id);
  },

  async getChannelByName(name: string) {
    return channelModalCRUD.findByName(name);
  },

  async getAllChannels() {
    return channelModalCRUD.findAll();
  },

  async addVectorMemory(
    channelId: string,
    month: number,
    summary: string,
    keyDecisions: string[]
  ) {
    const embedding = await embedWithOllama(summary);
    return channelModalCRUD.addVectorMemory(channelId, month, summary, keyDecisions, embedding);
  }
};
