// ============================================================
// Favorites Service (CLIENT role required)
// Endpoints: GET /properties/favorites,
//            POST /properties/favorites/:propertyId,
//            DELETE /properties/favorites/:propertyId,
//            GET /properties/favorites/:propertyId/check
// ============================================================

import api from './api';
import type { Property } from '@/types';

class FavoritesService {
  /** GET /properties/favorites — list saved properties */
  async list(): Promise<Property[]> {
    const res = await api.get<Property[]>('/properties/favorites');
    return res.data ?? [];
  }

  /** POST /properties/favorites/:propertyId — add to favorites */
  async add(propertyId: string): Promise<void> {
    await api.post(`/properties/favorites/${propertyId}`);
  }

  /** DELETE /properties/favorites/:propertyId — remove from favorites */
  async remove(propertyId: string): Promise<void> {
    await api.delete(`/properties/favorites/${propertyId}`);
  }

  /** GET /properties/favorites/:propertyId/check — check if favorited */
  async check(propertyId: string): Promise<boolean> {
    const res = await api.get<{ isFavorite: boolean }>(
      `/properties/favorites/${propertyId}/check`,
    );
    return res.data?.isFavorite ?? false;
  }
}

export const favoritesService = new FavoritesService();
export default favoritesService;
