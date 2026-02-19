// ============================================================
// Realtor Listing Service
// Endpoints: GET/POST /realtor/listings, GET /realtor/listings/stats,
//            PATCH/DELETE /realtor/listings/:id, POST /uploads/direct
// ============================================================

import api from './api';
import type {
  Property,
  CreateListingRequest,
  UpdateListingRequest,
  ListingStats,
  PaginatedResponse,
} from '@/types';

class RealtorService {
  /** GET /realtor/listings — get realtor's own listings */
  async getMyListings(params?: Record<string, unknown>): Promise<PaginatedResponse<Property>> {
    const res = await api.get<PaginatedResponse<Property>>('/realtor/listings', params);
    return res.data!;
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
}

export const realtorService = new RealtorService();
export default realtorService;
