// ============================================================
// Support Ticket Types
// Matches: POST /support-tickets, GET /support-tickets/me, etc.
// ============================================================

export type TicketCategory = 'GENERAL' | 'PAYMENT' | 'PROPERTY' | 'ACCOUNT' | 'TECHNICAL';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface TicketMessage {
  id: string;
  content: string;
  isStaff: boolean;
  staffName?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  messages?: TicketMessage[];
  createdAt: string;
}

export interface CreateTicketRequest {
  subject: string;
  message: string;
  category: TicketCategory;
  priority?: TicketPriority;
  attachments?: string[];
}

export interface ReplyTicketRequest {
  message: string;
  attachments?: string[];
}
