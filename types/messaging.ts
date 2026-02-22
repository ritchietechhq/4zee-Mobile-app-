// ============================================================
// Messaging Types
// Matches: GET /messaging/conversations, POST /messaging/inquiries, etc.
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
  propertyId?: string;
  propertyTitle?: string;
}

export type MessageType = 'INQUIRY' | 'RESPONSE' | 'SYSTEM';

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  attachments?: string[];
  createdAt: string;
  type?: MessageType;
}

export interface SendMessageRequest {
  content: string;
  type?: MessageType;
  attachments?: string[];
  attachmentUrl?: string;
}

export interface StartConversationRequest {
  participantId: string;
  message: string;
  propertyId?: string;
  subject?: string;
}

export interface PropertyInquiryRequest {
  propertyId: string;
  message: string;
  phone?: string;
}
