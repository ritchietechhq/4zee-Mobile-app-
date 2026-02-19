// ============================================================
// Support Ticket Service
// Endpoints: POST /support-tickets, GET /support-tickets,
//            GET /support-tickets/:id, POST /support-tickets/:id/messages,
//            PATCH /support-tickets/:id/close
// ============================================================

import api from './api';
import type {
  SupportTicket,
  CreateTicketRequest,
  ReplyTicketRequest,
  PaginatedResponse,
  TicketStatus,
} from '@/types';

class SupportService {
  /** POST /support-tickets */
  async create(payload: CreateTicketRequest): Promise<SupportTicket> {
    const res = await api.post<SupportTicket>('/support-tickets', payload);
    return res.data!;
  }

  /** GET /support-tickets — my tickets */
  async getMyTickets(
    status?: TicketStatus,
    cursor?: string,
    limit = 20,
  ): Promise<PaginatedResponse<SupportTicket>> {
    const params: Record<string, unknown> = { limit };
    if (status) params.status = status;
    if (cursor) params.cursor = cursor;
    const res = await api.get<PaginatedResponse<SupportTicket>>(
      '/support-tickets',
      params,
    );
    return res.data!;
  }

  /** GET /support-tickets/:id */
  async getById(id: string): Promise<SupportTicket> {
    const res = await api.get<SupportTicket>(`/support-tickets/${id}`);
    return res.data!;
  }

  /** POST /support-tickets/:id/messages */
  async reply(id: string, payload: ReplyTicketRequest): Promise<void> {
    await api.post(`/support-tickets/${id}/messages`, payload);
  }

  /** PATCH /support-tickets/:id/close */
  async close(id: string): Promise<void> {
    await api.patch(`/support-tickets/${id}/close`);
  }
}

export const supportService = new SupportService();
export default supportService;
