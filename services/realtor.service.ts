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
} from '@/types';

/** Normalise backend response: handles both plain array and { items, pagination } */
function normalizePaginated<T>(raw: any): PaginatedResponse<T> {
  if (Array.isArray(raw)) {
    return {
      items: raw,
      pagination: { limit: raw.length, hasNext: false, hasPrev: false },
    };
  }
  if (raw?.items && Array.isArray(raw.items)) {
    return {
      items: raw.items,
      pagination: raw.pagination ?? { limit: raw.items.length, hasNext: false, hasPrev: false },
    };
  }
  return { items: [], pagination: { limit: 0, hasNext: false, hasPrev: false } };
}

class RealtorService {
  /** GET /realtor/listings — get realtor's own listings */
  async getMyListings(params?: Record<string, unknown>): Promise<PaginatedResponse<Property>> {
    const res = await api.get<any>('/realtor/listings', params);
    return normalizePaginated<Property>(res.data);
  }

  /** GET /realtor/listings/stats — listing counts + views */
  async getListingStats(): Promise<ListingStats> {
    const res = await api.get<ListingStats>('/realtor/listings/stats');
    return res.data!;
  }

  /** POST /realtor/listings — create new listing */
  async createListing(payload: CreateListingRequest): Promise<Property> {
    const res = await api.post<Property>('/realtor/listings', payload);
    return res.data!;
  }

  /** PATCH /realtor/listings/:id — update listing */
  async updateListing(id: string, payload: UpdateListingRequest): Promise<Property> {
    const res = await api.patch<Property>(`/realtor/listings/${id}`, payload);
    return res.data!;
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
}

export const realtorService = new RealtorService();
export default realtorService;
