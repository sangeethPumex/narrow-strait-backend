import { Server as SocketIOServer, Socket } from 'socket.io';
import { ZodError } from 'zod';
import { messageService } from '../services/message.service.js';

type SendMessagePayload = {
  channelId?: string;
  content?: string;
  contentType?: 'text' | 'voice' | 'system';
  voiceUrl?: string;
};

const socketMessageCounts = new Map<string, { count: number; resetAt: number }>();

function isSocketRateLimited(socketId: string): boolean {
  const now = Date.now();
  const entry = socketMessageCounts.get(socketId);

  if (!entry || now > entry.resetAt) {
    socketMessageCounts.set(socketId, { count: 1, resetAt: now + 10000 });
    return false;
  }

  if (entry.count >= 10) {
    return true;
  }

  entry.count += 1;
  return false;
}

function getJoinedChannelId(socket: Socket): string | undefined {
  for (const roomId of socket.rooms) {
    if (roomId !== socket.id) {
      return roomId;
    }
  }

  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;
}

function normalizeSendMessagePayload(socket: Socket, args: unknown[]): SendMessagePayload {
  const [firstArg, secondArg] = args;
  const firstRecord = asRecord(firstArg);

  if (firstRecord) {
    return {
      channelId:
        (firstRecord.channelId as string | undefined) ??
        (firstRecord.channel as string | undefined) ??
        (firstRecord.roomId as string | undefined) ??
        (firstRecord.room as string | undefined) ??
        getJoinedChannelId(socket),
      content:
        (firstRecord.content as string | undefined) ??
        (firstRecord.message as string | undefined) ??
        (firstRecord.text as string | undefined) ??
        (firstRecord.body as string | undefined),
      contentType:
        (firstRecord.contentType as 'text' | 'voice' | 'system' | undefined) ??
        (firstRecord.type as 'text' | 'voice' | 'system' | undefined),
      voiceUrl: (firstRecord.voiceUrl as string | undefined) ?? (firstRecord.audioUrl as string | undefined)
    };
  }

  if (typeof firstArg === 'string' && typeof secondArg === 'string') {
    return {
      channelId: firstArg,
      content: secondArg
    };
  }

  if (typeof firstArg === 'string') {
    return {
      channelId: getJoinedChannelId(socket),
      content: firstArg
    };
  }

  return {
    channelId: getJoinedChannelId(socket)
  };
}

export function registerSocketHandlers(io: SocketIOServer) {
  io.on('connection', (socket: Socket) => {
    console.log(`✅ Socket connected: ${socket.id}`);

    socket.on('join_channel', (channelId: string) => {
      socket.join(channelId);
      console.log(`Socket ${socket.id} joined channel ${channelId}`);
      io.to(channelId).emit('user_joined', { userId: socket.id });
    });

    socket.on('send_message', async (...args: unknown[]) => {
      if (isSocketRateLimited(socket.id)) {
        socket.emit('error', { message: 'Sending too fast, slow down' });
        return;
      }

      try {
        const payload = normalizeSendMessagePayload(socket, args);

        const message = await messageService.createMessage({
          channelId: payload.channelId ?? '',
          content: payload.content ?? '',
          contentType: payload.contentType ?? 'text',
          voiceUrl: payload.voiceUrl,
          authorId: 'user',
          authorName: 'You',
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        });

        // send to everyone else in the room
        socket.to(message.channelId).emit('message_posted', message);
        // confirm back to sender
        socket.emit('message_posted', message);
      } catch (error) {
        console.error('send_message error:', error);
        const detail =
          error instanceof ZodError
            ? error.issues.map(issue => issue.message).join(', ')
            : (error as Error).message;

        socket.emit('error', {
          message: error instanceof ZodError ? 'Invalid message payload' : 'Failed to save message',
          detail
        });
      }
    });

    socket.on('disconnect', () => {
      socketMessageCounts.delete(socket.id);
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });
}
