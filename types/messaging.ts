// ============================================================
// Messaging Types — Mobile In-App Messaging
// Matches MOBILE_MESSAGING_API.md specification
// ============================================================

export interface ConversationParticipant {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  role?: 'CLIENT' | 'REALTOR';
}

export interface ConversationLastMessage {
  content: string;
  createdAt: string;
  isRead: boolean;
  senderId?: string;
  type?: MessageType;
}

export interface ConversationProperty {
  id: string;
  title: string;
  images?: string[];
  price?: number;
  location?: string;
}

export interface Conversation {
  id: string;
  subject?: string;
  participant: ConversationParticipant;
  lastMessage: ConversationLastMessage;
  unreadCount: number;
  propertyId?: string;
  propertyTitle?: string;
  property?: ConversationProperty;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Message types as defined by the API
 */
export type MessageType = 
  | 'INQUIRY'       // Initial inquiry
  | 'RESPONSE'      // Reply to a message
  | 'OFFER'         // Making an offer
  | 'COUNTER_OFFER' // Counter offer
  | 'NEGOTIATION'   // Negotiation message
  | 'DOCUMENT'      // Document sharing
  | 'SYSTEM';       // System message

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId?: string;
  senderName?: string;
  attachments?: string[];
  createdAt: string;
  type?: MessageType;
  isRead?: boolean;
  readAt?: string;
}

export interface SendMessageRequest {
  content: string;
  type?: MessageType;
  attachments?: string[];
}

export interface StartConversationRequest {
  participantId: string;
  message: string;
  propertyId?: string;
  subject?: string;
}

export interface PropertyInquiryRequest {
  propertyId: string;
  content: string;
}

export interface InquiryResponse {
  conversationId: string;
  conversation: Conversation;
  isNew: boolean;
  recipientType?: 'realtor' | 'client';
}

export interface ConversationCheckResponse {
  exists: boolean;
  conversationId: string | null;
  conversation: Conversation | null;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface MarkAsReadResponse {
  markedAsRead: number;
  conversationId: string;
}

/** Push notification data for messaging */
export interface MessagePushData {
  type: 'property_inquiry' | 'message';
  conversationId: string;
  propertyId?: string;
  senderId?: string;
  senderName?: string;
  preview?: string;
}
