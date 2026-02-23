// ============================================================
// Leads Service — Realtor Leads Management
// Endpoints: GET /realtor/leads, GET /realtor/leads/:id
// ============================================================

import api from './api';

// ─── Types ─────────────────────────────────────────────────

export type LeadStatus = 'unread' | 'read' | 'all';

export interface LeadClient {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  profilePicture?: string;
}

export interface LeadProperty {
  id: string;
  title: string;
  location: string;
  price: number;
  mediaUrls?: string[];
  images?: string[];
}

export interface LeadMessage {
  id: string;
  content: string;
  senderId: string;
  isFromClient: boolean;
  type: 'INQUIRY' | 'RESPONSE' | 'OFFER' | 'COUNTER_OFFER' | 'NEGOTIATION' | 'DOCUMENT' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
}

export interface Lead {
  id: string;
  status: 'unread' | 'read';
  subject: string;
  property: LeadProperty;
  client: LeadClient;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
    type: string;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeadDetail extends Lead {
  messages: LeadMessage[];
}

export interface LeadsResponse {
  leads: Lead[];
  total: number;
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface LeadsParams {
  status?: LeadStatus;
  propertyId?: string;
  page?: number;
  limit?: number;
}

// ─── Normalization ─────────────────────────────────────────

function normalizeLead(raw: any): Lead {
  return {
    id: raw.id,
    status: raw.status ?? (raw.unreadCount > 0 ? 'unread' : 'read'),
    subject: raw.subject ?? `Inquiry: ${raw.property?.title ?? 'Property'}`,
    property: {
      id: raw.property?.id ?? '',
      title: raw.property?.title ?? 'Property',
      location: raw.property?.location ?? '',
      price: raw.property?.price ?? 0,
      mediaUrls: raw.property?.mediaUrls,
      images: raw.property?.images ?? raw.property?.mediaUrls,
    },
    client: {
      id: raw.client?.id ?? '',
      name: raw.client?.name ?? (`${raw.client?.firstName ?? ''} ${raw.client?.lastName ?? ''}`.trim() || 'Client'),
      firstName: raw.client?.firstName,
      lastName: raw.client?.lastName,
      email: raw.client?.email,
      phone: raw.client?.phone,
      profilePicture: raw.client?.profilePicture,
    },
    lastMessage: raw.lastMessage ? {
      content: raw.lastMessage.content ?? '',
      senderId: raw.lastMessage.senderId ?? '',
      createdAt: raw.lastMessage.createdAt ?? '',
      type: raw.lastMessage.type ?? 'RESPONSE',
    } : undefined,
    unreadCount: raw.unreadCount ?? 0,
    createdAt: raw.createdAt ?? '',
    updatedAt: raw.updatedAt ?? '',
  };
}

function normalizeLeadDetail(raw: any): LeadDetail {
  const lead = normalizeLead(raw);
  return {
    ...lead,
    messages: (raw.messages ?? []).map((msg: any) => ({
      id: msg.id,
      content: msg.content ?? '',
      senderId: msg.senderId ?? '',
      isFromClient: msg.isFromClient ?? false,
      type: msg.type ?? 'RESPONSE',
      isRead: msg.isRead ?? false,
      createdAt: msg.createdAt ?? '',
    })),
  };
}

// ─── Service ───────────────────────────────────────────────

class LeadsService {
  /**
   * GET /realtor/leads
   * Get all leads (property inquiries) for the realtor.
   */
  async getLeads(params?: LeadsParams): Promise<LeadsResponse> {
    const queryParams: Record<string, unknown> = {};
    if (params?.status && params.status !== 'all') queryParams.status = params.status;
    if (params?.propertyId) queryParams.propertyId = params.propertyId;
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;

    const res = await api.get<any>('/realtor/leads', queryParams);
    const data = res.data;

    const rawLeads = Array.isArray(data) ? data : data?.leads ?? [];

    return {
      leads: rawLeads.map(normalizeLead),
      total: data?.total ?? rawLeads.length,
      unreadCount: data?.unreadCount ?? 0,
      pagination: data?.pagination ?? {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    };
  }

  /**
   * GET /realtor/leads/:id
   * Get lead details with full conversation.
   * Note: Accessing this endpoint auto-marks messages as read.
   */
  async getLeadDetail(leadId: string): Promise<LeadDetail> {
    const res = await api.get<any>(`/realtor/leads/${leadId}`);
    return normalizeLeadDetail(res.data);
  }

  /**
   * Get unread leads count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const res = await this.getLeads({ limit: 1 });
      return res.unreadCount;
    } catch {
      return 0;
    }
  }
}

export const leadsService = new LeadsService();
export default leadsService;
