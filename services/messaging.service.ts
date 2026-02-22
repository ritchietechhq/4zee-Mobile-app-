// ============================================================
// Messaging Service
// Endpoints: GET /messaging/conversations,
//            GET /messaging/conversations/:id/messages,
//            POST /messaging/conversations/:id/messages,
//            POST /messaging/conversations,
//            POST /messaging/inquiries,
//            GET /messaging/unread-count
// ============================================================

import api from './api';
import type {
  Conversation,
  Message,
  SendMessageRequest,
  StartConversationRequest,
  PaginatedResponse,
} from '@/types';

/**
 * Normalise a single Conversation from the backend.
 * The backend may return participants in different shapes —
 * we map the first "other" participant into our flat `participant` field.
 */
function normalizeConversation(raw: any): Conversation {
  if (!raw) return raw;

  // If backend returns `participants[]` instead of flat `participant`
  let participant = raw.participant;
  if (!participant && Array.isArray(raw.participants) && raw.participants.length) {
    const other = raw.participants.find((p: any) => !p.isMe) ?? raw.participants[0];
    participant = {
      id: other.id ?? other.userId ?? '',
      firstName: other.firstName ?? other.user?.firstName ?? '',
      lastName: other.lastName ?? other.user?.lastName ?? '',
      profilePicture: other.profilePicture ?? other.user?.profilePicture,
    };
  }

  return {
    id: raw.id,
    participant: participant ?? { id: '', firstName: 'Unknown', lastName: '' },
    lastMessage: raw.lastMessage ?? { content: '', createdAt: raw.updatedAt ?? raw.createdAt ?? '', isRead: true },
    unreadCount: raw.unreadCount ?? 0,
    propertyId: raw.propertyId,
    propertyTitle: raw.propertyTitle ?? raw.property?.title,
  };
}

function normalizeMessage(raw: any): Message {
  return {
    id: raw.id,
    content: raw.content ?? raw.message ?? '',
    senderId: raw.senderId ?? raw.sender?.id ?? '',
    senderName: raw.senderName ?? (raw.sender ? `${raw.sender.firstName ?? ''} ${raw.sender.lastName ?? ''}`.trim() : undefined),
    attachments: raw.attachments ?? [],
    createdAt: raw.createdAt ?? '',
    type: raw.type,
  };
}

class MessagingService {
  /** GET /messaging/conversations */
  async getConversations(propertyId?: string, unreadOnly?: boolean): Promise<Conversation[]> {
    const params: Record<string, unknown> = {};
    if (propertyId) params.propertyId = propertyId;
    if (unreadOnly) params.unreadOnly = true;
    const res = await api.get<any>('/messaging/conversations', params);
    const raw = res.data;
    const list: any[] = Array.isArray(raw) ? raw : raw?.items ?? raw?.conversations ?? [];
    return list.map(normalizeConversation);
  }

  /** GET /messaging/conversations/:id/messages — cursor-paginated */
  async getMessages(
    conversationId: string,
    cursor?: string,
    limit = 30,
  ): Promise<PaginatedResponse<Message>> {
    const params: Record<string, unknown> = { limit };
    if (cursor) params.cursor = cursor;
    const res = await api.get<any>(
      `/messaging/conversations/${conversationId}/messages`,
      params,
    );
    const raw = res.data;

    // Handle both paginated and plain-array responses
    let items: any[] = [];
    let pagination: any = { limit, hasNext: false, hasPrev: false };
    if (Array.isArray(raw)) {
      items = raw;
    } else if (raw?.items) {
      items = raw.items;
      pagination = raw.pagination ?? pagination;
    } else if (raw?.messages) {
      items = raw.messages;
      pagination = raw.pagination ?? pagination;
    }

    return { items: items.map(normalizeMessage), pagination };
  }

  /** POST /messaging/conversations/:id/messages */
  async sendMessage(
    conversationId: string,
    payload: SendMessageRequest,
  ): Promise<Message> {
    const res = await api.post<any>(
      `/messaging/conversations/${conversationId}/messages`,
      payload,
    );
    return normalizeMessage(res.data);
  }

  /** POST /messaging/conversations — start a new conversation */
  async startConversation(
    payload: StartConversationRequest,
  ): Promise<Conversation> {
    const res = await api.post<any>('/messaging/conversations', payload);
    return normalizeConversation(res.data);
  }

  /**
   * POST /messaging/inquiries — shortcut for property inquiry.
   * Starts a conversation with the property's realtor automatically.
   */
  async sendInquiry(payload: {
    propertyId: string;
    message: string;
    phone?: string;
  }): Promise<Conversation> {
    const res = await api.post<any>('/messaging/inquiries', payload);
    return normalizeConversation(res.data);
  }

  /** GET /messaging/unread-count */
  async getUnreadCount(): Promise<number> {
    const res = await api.get<any>('/messaging/unread-count');
    return res.data?.count ?? res.data?.unreadCount ?? 0;
  }
}

export const messagingService = new MessagingService();
export default messagingService;
