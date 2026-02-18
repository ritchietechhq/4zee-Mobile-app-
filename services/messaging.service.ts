// ============================================================
// Messaging Service
// Endpoints: GET /messaging/conversations,
//            GET /messaging/conversations/:id/messages,
//            POST /messaging/conversations/:id/messages,
//            POST /messaging/conversations
// ============================================================

import api from './api';
import type {
  Conversation,
  Message,
  SendMessageRequest,
  StartConversationRequest,
  PaginatedResponse,
} from '@/types';

class MessagingService {
  /** GET /messaging/conversations */
  async getConversations(): Promise<Conversation[]> {
    const res = await api.get<Conversation[]>('/messaging/conversations');
    return res.data!;
  }

  /** GET /messaging/conversations/:id/messages — cursor-paginated */
  async getMessages(
    conversationId: string,
    cursor?: string,
    limit = 20,
  ): Promise<PaginatedResponse<Message>> {
    const params: Record<string, unknown> = { limit };
    if (cursor) params.cursor = cursor;
    const res = await api.get<PaginatedResponse<Message>>(
      `/messaging/conversations/${conversationId}/messages`,
      params,
    );
    return res.data!;
  }

  /** POST /messaging/conversations/:id/messages */
  async sendMessage(
    conversationId: string,
    payload: SendMessageRequest,
  ): Promise<Message> {
    const res = await api.post<Message>(
      `/messaging/conversations/${conversationId}/messages`,
      payload,
    );
    return res.data!;
  }

  /** POST /messaging/conversations — start a new conversation */
  async startConversation(
    payload: StartConversationRequest,
  ): Promise<Conversation> {
    const res = await api.post<Conversation>(
      '/messaging/conversations',
      payload,
    );
    return res.data!;
  }
}

export const messagingService = new MessagingService();
export default messagingService;
