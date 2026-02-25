// ============================================================
// Realtor Service
// Endpoints: GET/POST /realtor/listings, GET /realtor/listings/stats,
//            GET /realtor/listings/analytics,
//            PATCH/DELETE /realtor/listings/:id, POST /uploads/direct,
//            GET /realtor/activity-feed, GET /realtor/goals,
//            GET /realtor/schedule
// ============================================================

import api from './api';
import type {
  Property,
  CreateListingRequest,
  UpdateListingRequest,
  ListingStats,
  PaginatedResponse,
  ActivityFeedResponse,
  ListingAnalyticsResponse,
  GoalsResponse,
  ScheduleResponse,
  InstallmentRequest,
  InstallmentRequestsResponse,
} from '@/types';

/**
 * Normalise a single property from the backend.
 * Maps `mediaUrls` → `images` so all UI components can use `property.images`.
 */
function normalizeProperty(raw: any): Property {
  if (!raw) return raw;
  return {
    ...raw,
    images: raw.images?.length ? raw.images : (raw.mediaUrls ?? []),
    amenities: raw.amenities ?? [],
  };
}

/** Normalise backend response: handles both plain array and { items, pagination } */
function normalizePaginated(raw: any): PaginatedResponse<Property> {
  let items: any[] = [];
  let pagination = { limit: 0, hasNext: false, hasPrev: false } as any;

  if (Array.isArray(raw)) {
    items = raw;
    pagination = { limit: raw.length, hasNext: false, hasPrev: false };
  } else if (raw?.items && Array.isArray(raw.items)) {
    items = raw.items;
    pagination = raw.pagination ?? { limit: raw.items.length, hasNext: false, hasPrev: false };
  }

  return {
    items: items.map(normalizeProperty),
    pagination,
  };
}

class RealtorService {
  /** GET /realtor/listings — get realtor's own listings */
  async getMyListings(params?: Record<string, unknown>): Promise<PaginatedResponse<Property>> {
    const res = await api.get<any>('/realtor/listings', params);
    return normalizePaginated(res.data);
  }

  /** GET /realtor/listings/stats — listing counts + views */
  async getListingStats(): Promise<ListingStats> {
    const res = await api.get<ListingStats>('/realtor/listings/stats');
    return res.data!;
  }

  /** POST /realtor/listings — create new listing */
  async createListing(payload: CreateListingRequest): Promise<Property> {
    const res = await api.post<any>('/realtor/listings', payload);
    return normalizeProperty(res.data);
  }

  /** PATCH /realtor/listings/:id — update listing */
  async updateListing(id: string, payload: UpdateListingRequest): Promise<Property> {
    const res = await api.patch<any>(`/realtor/listings/${id}`, payload);
    return normalizeProperty(res.data);
  }

  /** DELETE /realtor/listings/:id — delete listing */
  async deleteListing(id: string): Promise<void> {
    await api.delete(`/realtor/listings/${id}`);
  }

  /** POST /uploads/direct — upload a property image */
  async uploadImage(formData: FormData): Promise<string> {
    const res = await api.upload<{ url: string; publicUrl?: string }>(
      '/uploads/direct',
      formData,
    );
    return res.data!.publicUrl || res.data!.url;
  }

  /** GET /realtor/activity-feed — real-time activity feed */
  async getActivityFeed(limit = 10): Promise<ActivityFeedResponse> {
    const res = await api.get<ActivityFeedResponse>('/realtor/activity-feed', { limit });
    return res.data ?? { items: [], total: 0 };
  }

  /** GET /realtor/listings/analytics — per-listing performance */
  async getListingAnalytics(): Promise<ListingAnalyticsResponse> {
    const res = await api.get<ListingAnalyticsResponse>('/realtor/listings/analytics');
    return res.data ?? { listings: [], summary: { totalListings: 0, totalViews: 0, totalFavorites: 0, totalEnquiries: 0 } };
  }

  /** GET /realtor/goals — sales goals tracker */
  async getGoals(): Promise<GoalsResponse> {
    const res = await api.get<GoalsResponse>('/realtor/goals');
    return res.data!;
  }

  /** GET /realtor/schedule — upcoming appointments & follow-ups */
  async getSchedule(): Promise<ScheduleResponse> {
    const res = await api.get<ScheduleResponse>('/realtor/schedule');
    return res.data ?? { items: [], total: 0, pendingApplications: 0, unreadInquiries: 0 };
  }

  // ── Installment Requests ──────────────────────────────────────────────────

  /** GET /realtor/installment-requests — list payment plan enrollments for realtor's apps */
  async getInstallmentRequests(
    status?: string,
    page = 1,
    limit = 20,
  ): Promise<InstallmentRequestsResponse> {
    const params: Record<string, unknown> = { page, limit };
    if (status) params.status = status;
    const res = await api.get<any>('/realtor/installment-requests', params);

    // The interceptor unwraps axios response.data → ApiResponse<T>
    // res.data is the payload inside { success, data: <payload> }
    // But some endpoints skip the envelope, so res itself IS the payload
    const envelope = res as any;
    const inner = envelope?.data; // payload inside ApiResponse envelope

    if (__DEV__) {
      console.log('[Realtor] installment-requests envelope keys:', Object.keys(envelope ?? {}));
      console.log('[Realtor] installment-requests inner (res.data):', JSON.stringify(inner)?.slice(0, 500));
      console.log('[Realtor] installment-requests full res:', JSON.stringify(envelope)?.slice(0, 800));
    }

    // Try inner first (standard envelope), then envelope itself (no wrapper)
    const candidates = [inner, envelope];
    for (const raw of candidates) {
      if (!raw) continue;

      // Shape: { enrollments: [...], summary?, pagination? }
      if (raw.enrollments && Array.isArray(raw.enrollments)) {
        return {
          items: raw.enrollments,
          total: raw.pagination?.total ?? raw.enrollments.length,
          pending: raw.summary?.active ?? raw.summary?.pending ?? raw.enrollments.filter((r: any) => r.status === 'PENDING' || r.status === 'active').length,
        };
      }
      // Shape: plain array
      if (Array.isArray(raw)) {
        return { items: raw, total: raw.length, pending: raw.filter((r: any) => r.status === 'PENDING').length };
      }
      // Shape: { items: [...] }
      if (raw.items && Array.isArray(raw.items)) {
        return { items: raw.items, total: raw.total ?? raw.items.length, pending: raw.pending ?? 0 };
      }
      // Shape: { requests: [...] }
      if (raw.requests && Array.isArray(raw.requests)) {
        return { items: raw.requests, total: raw.total ?? raw.requests.length, pending: raw.requests.filter((r: any) => r.status === 'PENDING').length };
      }
    }

    if (__DEV__) console.warn('[Realtor] installment-requests: no recognized shape — returning empty');
    return { items: [], total: 0, pending: 0 };
  }

  /** GET /realtor/installment-requests/:id — get single request details */
  async getInstallmentRequest(id: string): Promise<InstallmentRequest> {
    const res = await api.get<InstallmentRequest>(`/realtor/installment-requests/${id}`);
    return res.data!;
  }

  /** POST /realtor/installment-requests/:id/approve — approve and auto-generate agreement */
  async approveInstallmentRequest(id: string): Promise<InstallmentRequest> {
    const res = await api.post<InstallmentRequest>(`/realtor/installment-requests/${id}/approve`);
    return res.data!;
  }

  /** POST /realtor/installment-requests/:id/reject — reject with reason */
  async rejectInstallmentRequest(id: string, reason: string): Promise<InstallmentRequest> {
    const res = await api.post<InstallmentRequest>(`/realtor/installment-requests/${id}/reject`, { reason });
    return res.data!;
  }
}

export const realtorService = new RealtorService();
export default realtorService;
