// ============================================================
// Messaging Service — Mobile In-App Messaging
// Matches MOBILE_MESSAGING_API.md specification exactly
// ============================================================

import api from './api';
import type {
  Conversation,
  Message,
  SendMessageRequest,
  PaginatedResponse,
} from '@/types';

// ─── Types for API responses ─────────────────────────────────

export interface ConversationProperty {
  id: string;
  title: string;
  images?: string[];
  price?: number;
  location?: string;
}

export interface ConversationParticipantRaw {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: 'CLIENT' | 'REALTOR';
  profilePicture?: string;
}

export interface InquiryResponse {
  conversationId: string;
  conversation: any;
  isNew: boolean;
  recipientType?: 'realtor' | 'client';
}

export interface ConversationCheckResponse {
  exists: boolean;
  conversationId: string | null;
  conversation: any | null;
}

// ─── Normalization helpers ───────────────────────────────────

/**
 * Normalise a single Conversation from the backend.
 * Handles various response shapes from the API.
 */
function normalizeConversation(raw: any, currentUserId?: string): Conversation {
  if (!raw) return raw;

  // Find the "other" participant — try multiple shapes
  let participant = raw.participant;
  if (!participant && Array.isArray(raw.participants) && raw.participants.length) {
    const other = raw.participants.find((p: any) => 
      currentUserId ? p.id !== currentUserId : !p.isMe
    ) ?? raw.participants[0];
    
    participant = {
      id: other.id ?? '',
      firstName: other.firstName ?? other.name?.split(' ')[0] ?? '',
      lastName: other.lastName ?? other.name?.split(' ').slice(1).join(' ') ?? '',
      profilePicture: other.profilePicture ?? other.avatar,
      role: other.role,
    };
  }

  // If participant exists but has empty names, try to resolve from other fields
  if (participant) {
    const hasName = (participant.firstName && participant.firstName !== 'Unknown') 
      || (participant.lastName && participant.lastName !== 'Unknown');

    if (!hasName) {
      // Try name field (some APIs return a single "name" string)
      if (participant.name && typeof participant.name === 'string') {
        const parts = participant.name.split(' ');
        participant.firstName = parts[0] || '';
        participant.lastName = parts.slice(1).join(' ') || '';
      }
      // Try fullName
      else if (participant.fullName && typeof participant.fullName === 'string') {
        const parts = participant.fullName.split(' ');
        participant.firstName = parts[0] || '';
        participant.lastName = parts.slice(1).join(' ') || '';
      }
      // Try user sub-object
      else if (participant.user) {
        participant.firstName = participant.user.firstName ?? participant.firstName ?? '';
        participant.lastName = participant.user.lastName ?? participant.lastName ?? '';
        participant.profilePicture = participant.profilePicture ?? participant.user.profilePicture;
      }
    }
  }

  // Also try raw.realtor or raw.client for name
  if (participant && !participant.firstName && !participant.lastName) {
    const alt = raw.realtor ?? raw.client ?? raw.otherUser;
    if (alt) {
      participant.firstName = alt.firstName ?? alt.name?.split(' ')[0] ?? '';
      participant.lastName = alt.lastName ?? alt.name?.split(' ').slice(1).join(' ') ?? '';
      participant.profilePicture = participant.profilePicture ?? alt.profilePicture;
    }
  }

  // Build last message
  const lastMsg = raw.lastMessage;
  const lastMessage = lastMsg ? {
    content: lastMsg.content ?? '',
    createdAt: lastMsg.createdAt ?? '',
    isRead: lastMsg.isRead ?? true,
    senderId: lastMsg.senderId,
    type: lastMsg.type,
  } : { content: '', createdAt: raw.updatedAt ?? raw.createdAt ?? '', isRead: true };

  // Property info
  const property = raw.property ? {
    id: raw.property.id,
    title: raw.property.title,
    images: raw.property.images,
    price: raw.property.price,
    location: raw.property.location,
  } : undefined;

  return {
    id: raw.id,
    subject: raw.subject,
    participant: participant ?? { id: '', firstName: '', lastName: '' },
    lastMessage,
    unreadCount: raw.unreadCount ?? 0,
    propertyId: raw.propertyId ?? raw.property?.id,
    propertyTitle: raw.propertyTitle ?? raw.property?.title ?? raw.subject?.replace('Inquiry: ', ''),
    property,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function normalizeMessage(raw: any): Message {
  return {
    id: raw.id,
    content: raw.content ?? '',
    senderId: raw.senderId ?? raw.sender?.id ?? '',
    receiverId: raw.receiverId,
    senderName: raw.senderName ?? (raw.sender ? `${raw.sender.firstName ?? ''} ${raw.sender.lastName ?? ''}`.trim() : undefined),
    attachments: raw.attachments ?? [],
    createdAt: raw.createdAt ?? '',
    type: raw.type ?? 'RESPONSE',
    isRead: raw.isRead ?? false,
    readAt: raw.readAt,
  };
}

// ─── Service Class ───────────────────────────────────────────

class MessagingService {
  private currentUserId?: string;

  /** Set current user ID for proper participant detection */
  setCurrentUserId(userId: string) {
    this.currentUserId = userId;
  }

  // ─────────────────────────────────────────────────────────
  // CLIENT ENDPOINTS
  // ─────────────────────────────────────────────────────────

  /**
   * POST /messaging/properties/:propertyId/inquiry
   * Start a conversation with the realtor who posted a property.
   * If conversation exists, returns the existing one.
   */
  async createPropertyInquiry(
    propertyId: string,
    content: string,
  ): Promise<{ conversation: Conversation; isNew: boolean }> {
    const res = await api.post<any>(
      `/messaging/properties/${propertyId}/inquiry`,
      { content },
    );
    const data = res.data;
    return {
      conversation: normalizeConversation(data?.conversation ?? data, this.currentUserId),
      isNew: data?.isNew ?? true,
    };
  }

  /**
   * GET /messaging/properties/:propertyId/conversation
   * Check if you already have a conversation about a specific property.
   */
  async checkPropertyConversation(
    propertyId: string,
  ): Promise<ConversationCheckResponse> {
    const res = await api.get<any>(`/messaging/properties/${propertyId}/conversation`);
    const data = res.data;
    return {
      exists: data?.exists ?? !!data?.conversationId,
      conversationId: data?.conversationId ?? null,
      conversation: data?.conversation ? normalizeConversation(data.conversation, this.currentUserId) : null,
    };
  }

  /**
   * GET /messaging/conversations
   * List all conversations for the authenticated user.
   */
  async getConversations(params?: {
    page?: number;
    limit?: number;
    propertyId?: string;
    unreadOnly?: boolean;
  }): Promise<{ conversations: Conversation[]; total: number; unreadTotal: number }> {
    const queryParams: Record<string, unknown> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.propertyId) queryParams.propertyId = params.propertyId;
    if (params?.unreadOnly) queryParams.unreadOnly = true;

    const res = await api.get<any>('/messaging/conversations', queryParams);
    const data = res.data;

    // Handle various response shapes
    const rawList = Array.isArray(data) 
      ? data 
      : data?.conversations ?? data?.items ?? [];

    return {
      conversations: rawList.map((c: any) => normalizeConversation(c, this.currentUserId)),
      total: data?.total ?? rawList.length,
      unreadTotal: data?.unreadTotal ?? 0,
    };
  }

  /**
   * GET /messaging/conversations/:id
   * Get conversation details with all messages.
   */
  async getConversation(conversationId: string): Promise<{
    conversation: Conversation;
    messages: Message[];
  }> {
    const res = await api.get<any>(`/messaging/conversations/${conversationId}`);
    const data = res.data;
    
    return {
      conversation: normalizeConversation(data, this.currentUserId),
      messages: (data?.messages ?? []).map(normalizeMessage),
    };
  }

  /**
   * GET /messaging/conversations/:id/messages
   * Get paginated messages for a conversation (for lazy loading).
   */
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
      pagination = raw.pagination ?? raw.meta?.pagination ?? pagination;
    }

    return { items: items.map(normalizeMessage), pagination };
  }

  /**
   * POST /messaging/conversations/:id/messages
   * Send a message in an existing conversation.
   */
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

  /**
   * PATCH /messaging/conversations/:id/read
   * Mark all messages in a conversation as read.
   */
  async markAsRead(conversationId: string): Promise<{ markedAsRead: number }> {
    const res = await api.patch<any>(`/messaging/conversations/${conversationId}/read`);
    return { markedAsRead: res.data?.markedAsRead ?? 0 };
  }

  /**
   * GET /messaging/unread-count
   * Get total count of unread messages.
   */
  async getUnreadCount(): Promise<number> {
    const res = await api.get<any>('/messaging/unread-count');
    return res.data?.unreadCount ?? res.data?.count ?? 0;
  }

  // ─────────────────────────────────────────────────────────
  // REALTOR ENDPOINTS
  // ─────────────────────────────────────────────────────────

  /**
   * GET /realtor/messages
   * List all conversations for the realtor.
   */
  async getRealtorConversations(params?: {
    page?: number;
    limit?: number;
    propertyId?: string;
    unreadOnly?: boolean;
  }): Promise<{ conversations: Conversation[]; total: number; unreadTotal: number }> {
    const queryParams: Record<string, unknown> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.propertyId) queryParams.propertyId = params.propertyId;
    if (params?.unreadOnly) queryParams.unreadOnly = true;

    const res = await api.get<any>('/realtor/messages', queryParams);
    const data = res.data;

    const rawList = Array.isArray(data) 
      ? data 
      : data?.conversations ?? data?.items ?? [];

    return {
      conversations: rawList.map((c: any) => normalizeConversation(c, this.currentUserId)),
      total: data?.total ?? rawList.length,
      unreadTotal: data?.unreadTotal ?? 0,
    };
  }

  /**
   * GET /realtor/messages/:conversationId
   * Get a specific conversation for the realtor.
   */
  async getRealtorConversation(conversationId: string): Promise<{
    conversation: Conversation;
    messages: Message[];
  }> {
    const res = await api.get<any>(`/realtor/messages/${conversationId}`);
    const data = res.data;

    return {
      conversation: normalizeConversation(data, this.currentUserId),
      messages: (data?.messages ?? []).map(normalizeMessage),
    };
  }

  /**
   * POST /realtor/messages/:conversationId/reply
   * Realtor sends a reply in a conversation.
   */
  async realtorReply(
    conversationId: string,
    payload: SendMessageRequest,
  ): Promise<Message> {
    const res = await api.post<any>(
      `/realtor/messages/${conversationId}/reply`,
      payload,
    );
    return normalizeMessage(res.data);
  }

  // ─────────────────────────────────────────────────────────
  // LEGACY ALIASES (for backward compatibility)
  // ─────────────────────────────────────────────────────────

  /**
   * @deprecated Use createPropertyInquiry instead
   */
  async sendInquiry(payload: {
    propertyId: string;
    message: string;
  }): Promise<Conversation> {
    const result = await this.createPropertyInquiry(payload.propertyId, payload.message);
    return result.conversation;
  }
}

export const messagingService = new MessagingService();
export default messagingService;
