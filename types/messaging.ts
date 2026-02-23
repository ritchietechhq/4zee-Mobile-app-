// ============================================================
// Messaging Types — Mobile In-App Messaging
// Aligned with backend: otherParticipant, isMine, sender,
// voiceNote support, propertyContext, new message types
// ============================================================

// ─── Participant Types ───────────────────────────────────────

export interface ConversationParticipant {
  id: string;
  firstName: string;
  lastName: string;
  name?: string;
  email?: string;
  phone?: string;
  profilePicture?: string;
  role?: 'CLIENT' | 'REALTOR';
}

export interface ConversationLastMessage {
  content: string;
  createdAt: string;
  isRead: boolean;
  senderId?: string;
  type?: MessageType;
  isVoiceNote?: boolean;
}

export interface ConversationProperty {
  id: string;
  title: string;
  images?: string[];
  price?: number;
  location?: string;
}

// ─── Conversation ────────────────────────────────────────────

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

// ─── Message Types (matches backend enum) ────────────────────

export type MessageType =
  | 'INQUIRY'       // Initial inquiry
  | 'RESPONSE'      // Reply to a message
  | 'OFFER'         // Making an offer
  | 'COUNTER_OFFER' // Counter offer
  | 'NEGOTIATION'   // Negotiation message
  | 'DOCUMENT'      // Document sharing
  | 'SYSTEM'        // System message
  | 'VOICE_NOTE'    // Voice message
  | 'IMAGE';        // Image message

// ─── Message Sender ──────────────────────────────────────────

export interface MessageSender {
  id: string;
  name: string;
  role?: 'CLIENT' | 'REALTOR';
}

// ─── Property Context (in each message) ──────────────────────

export interface MessagePropertyContext {
  id: string;
  title: string;
}

// ─── Message ─────────────────────────────────────────────────

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId?: string;
  senderName?: string;
  sender?: MessageSender;
  isMine?: boolean;
  attachments?: string[];
  createdAt: string;
  type?: MessageType;
  isRead?: boolean;
  readAt?: string;
  // Voice note fields
  voiceNoteUrl?: string;
  isVoiceNote?: boolean;
  voiceDuration?: number;
  // Property context
  propertyContext?: MessagePropertyContext;
}

// ─── Requests ────────────────────────────────────────────────

export interface SendMessageRequest {
  content: string;
  type?: MessageType;
  attachments?: string[];
  // Voice note fields
  voiceNoteUrl?: string;
  isVoiceNote?: boolean;
  voiceDuration?: number;
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

// ─── Responses ───────────────────────────────────────────────

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
