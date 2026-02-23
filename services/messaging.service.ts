// ============================================================
// Messaging Service — Mobile In-App Messaging
// Aligned with backend updates:
//   - otherParticipant with name, email, phone, role
//   - isMine flag on messages
//   - sender { id, name, role } on messages
//   - voiceNoteUrl, isVoiceNote, voiceDuration support
//   - propertyContext { id, title } on messages
//   - VOICE_NOTE / IMAGE / DOCUMENT message types
// ============================================================

import api from './api';
import type {
  Conversation,
  Message,
  SendMessageRequest,
  PaginatedResponse,
  MessageSender,
} from '@/types';

// ─── Types for raw API responses ─────────────────────────────

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
  email?: string;
  phone?: string;
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
 * Prioritises the new `otherParticipant` shape, falls back to legacy fields.
 */
function normalizeConversation(raw: any, currentUserId?: string): Conversation {
  if (!raw) return raw;

  // ── Resolve participant ──
  // Backend now returns `otherParticipant` with { id, name, email, phone, role }
  let participant: any = null;

  // 1. Try new `otherParticipant` field (preferred)
  const other = raw.otherParticipant;
  if (other && other.id) {
    const nameParts = (other.name || '').split(' ');
    participant = {
      id: other.id,
      firstName: other.firstName ?? nameParts[0] ?? '',
      lastName: other.lastName ?? nameParts.slice(1).join(' ') ?? '',
      name: other.name ?? `${other.firstName ?? ''} ${other.lastName ?? ''}`.trim(),
      email: other.email,
      phone: other.phone,
      profilePicture: other.profilePicture ?? other.avatar,
      role: other.role,
    };
  }

  // 2. Fallback: try legacy `participant` field
  if (!participant) {
    participant = raw.participant;
  }

  // 3. Fallback: try `participants` array
  if (!participant && Array.isArray(raw.participants) && raw.participants.length) {
    const found = raw.participants.find((p: any) =>
      currentUserId ? p.id !== currentUserId : !p.isMe,
    ) ?? raw.participants[0];

    participant = {
      id: found.id ?? '',
      firstName: found.firstName ?? found.name?.split(' ')[0] ?? '',
      lastName: found.lastName ?? found.name?.split(' ').slice(1).join(' ') ?? '',
      name: found.name ?? `${found.firstName ?? ''} ${found.lastName ?? ''}`.trim(),
      email: found.email,
      phone: found.phone,
      profilePicture: found.profilePicture ?? found.avatar,
      role: found.role,
    };
  }

  // 4. Fix empty names from any resolved participant
  if (participant) {
    const hasName =
      (participant.firstName && participant.firstName !== 'Unknown') ||
      (participant.lastName && participant.lastName !== 'Unknown');

    if (!hasName) {
      // Try `name` string
      if (participant.name && typeof participant.name === 'string' && participant.name !== 'Unknown') {
        const parts = participant.name.split(' ');
        participant.firstName = parts[0] || '';
        participant.lastName = parts.slice(1).join(' ') || '';
      }
      // Try `fullName`
      else if (participant.fullName && typeof participant.fullName === 'string') {
        const parts = participant.fullName.split(' ');
        participant.firstName = parts[0] || '';
        participant.lastName = parts.slice(1).join(' ') || '';
      }
      // Try `user` sub-object
      else if (participant.user) {
        participant.firstName = participant.user.firstName ?? participant.firstName ?? '';
        participant.lastName = participant.user.lastName ?? participant.lastName ?? '';
        participant.profilePicture = participant.profilePicture ?? participant.user.profilePicture;
      }
    }

    // Also try raw.realtor / raw.client for name
    if (!participant.firstName && !participant.lastName) {
      const alt = raw.realtor ?? raw.client ?? raw.otherUser;
      if (alt) {
        participant.firstName = alt.firstName ?? alt.name?.split(' ')[0] ?? '';
        participant.lastName = alt.lastName ?? alt.name?.split(' ').slice(1).join(' ') ?? '';
        participant.profilePicture = participant.profilePicture ?? alt.profilePicture;
      }
    }
  }

  // ── Last message ──
  const lastMsg = raw.lastMessage;
  const lastMessage = lastMsg
    ? {
        content: lastMsg.isVoiceNote ? '🎤 Voice message' : (lastMsg.content ?? ''),
        createdAt: lastMsg.createdAt ?? '',
        isRead: lastMsg.isRead ?? true,
        senderId: lastMsg.senderId,
        type: lastMsg.type,
        isVoiceNote: lastMsg.isVoiceNote,
      }
    : { content: '', createdAt: raw.updatedAt ?? raw.createdAt ?? '', isRead: true };

  // ── Property info ──
  const property = raw.property
    ? {
        id: raw.property.id,
        title: raw.property.title,
        images: raw.property.images,
        price: raw.property.price,
        location: raw.property.location,
      }
    : undefined;

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

/**
 * Normalise a single Message from the backend.
 * Handles both new (isMine, sender, voiceNote) and legacy shapes.
 */
function normalizeMessage(raw: any, currentUserId?: string): Message {
  // Resolve sender
  const sender: MessageSender | undefined = raw.sender
    ? {
        id: raw.sender.id ?? '',
        name:
          raw.sender.name ??
          (`${raw.sender.firstName ?? ''} ${raw.sender.lastName ?? ''}`.trim() ||
          'Unknown'),
        role: raw.sender.role,
      }
    : undefined;

  const senderId = raw.senderId ?? raw.sender?.id ?? '';

  // Determine if message is from current user
  const isMine =
    raw.isMine !== undefined ? raw.isMine : currentUserId ? senderId === currentUserId : false;

  // Resolve sender name
  const senderName =
    raw.senderName ??
    sender?.name ??
    (raw.sender
      ? `${raw.sender.firstName ?? ''} ${raw.sender.lastName ?? ''}`.trim()
      : undefined);

  return {
    id: raw.id,
    content: raw.content ?? '',
    senderId,
    receiverId: raw.receiverId,
    senderName: senderName || undefined,
    sender,
    isMine,
    attachments: raw.attachments ?? [],
    createdAt: raw.createdAt ?? '',
    type: raw.type ?? 'RESPONSE',
    isRead: raw.isRead ?? false,
    readAt: raw.readAt,
    // Voice note fields
    voiceNoteUrl: raw.voiceNoteUrl,
    isVoiceNote: raw.isVoiceNote ?? raw.type === 'VOICE_NOTE',
    voiceDuration: raw.voiceDuration,
    // Property context
    propertyContext: raw.propertyContext,
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
      conversation: data?.conversation
        ? normalizeConversation(data.conversation, this.currentUserId)
        : null,
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
   * Backend now returns: otherParticipant, messages[].isMine, messages[].sender
   */
  async getConversation(conversationId: string): Promise<{
    conversation: Conversation;
    messages: Message[];
  }> {
    const res = await api.get<any>(`/messaging/conversations/${conversationId}`);
    const data = res.data;

    return {
      conversation: normalizeConversation(data, this.currentUserId),
      messages: (data?.messages ?? []).map((m: any) =>
        normalizeMessage(m, this.currentUserId),
      ),
    };
  }

  /**
   * GET /messaging/conversations/:id/messages
   * Get paginated messages for a conversation.
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

    return {
      items: items.map((m: any) => normalizeMessage(m, this.currentUserId)),
      pagination,
    };
  }

  /**
   * POST /messaging/conversations/:id/messages
   * Send a text or voice message.
   * Backend returns message with isMine: true and propertyContext.
   */
  async sendMessage(
    conversationId: string,
    payload: SendMessageRequest,
  ): Promise<Message> {
    const res = await api.post<any>(
      `/messaging/conversations/${conversationId}/messages`,
      payload,
    );
    return normalizeMessage(res.data, this.currentUserId);
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

  /**
   * POST /uploads/direct
   * Upload a voice note file and return the public URL.
   */
  async uploadVoiceNote(uri: string, filename?: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: filename || `voice_${Date.now()}.m4a`,
      type: 'audio/m4a',
    } as any);

    const res = await api.upload<{ url: string; publicUrl?: string }>(
      '/uploads/direct',
      formData,
    );
    return res.data!.publicUrl || res.data!.url;
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
      messages: (data?.messages ?? []).map((m: any) =>
        normalizeMessage(m, this.currentUserId),
      ),
    };
  }

  /**
   * POST /realtor/messages/:conversationId/reply
   * Realtor sends a reply (text or voice).
   */
  async realtorReply(
    conversationId: string,
    payload: SendMessageRequest,
  ): Promise<Message> {
    const res = await api.post<any>(
      `/realtor/messages/${conversationId}/reply`,
      payload,
    );
    return normalizeMessage(res.data, this.currentUserId);
  }

  // ─────────────────────────────────────────────────────────
  // LEGACY ALIASES (backward compat)
  // ─────────────────────────────────────────────────────────

  /** @deprecated Use createPropertyInquiry instead */
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
