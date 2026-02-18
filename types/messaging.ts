// ============================================================
// Messaging Types
// Matches: GET /messaging/conversations, etc.
// ============================================================

export interface ConversationParticipant {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

export interface ConversationLastMessage {
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participant: ConversationParticipant;
  lastMessage: ConversationLastMessage;
  unreadCount: number;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  attachments?: string[];
  createdAt: string;
}

export interface SendMessageRequest {
  content: string;
  attachments?: string[];
}

export interface StartConversationRequest {
  participantId: string;
  message: string;
}
