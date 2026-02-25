// ============================================================
// Favourites Service (CLIENT role required)
// Endpoints: GET  /properties/favorites
//            POST /properties/favorites/:propertyId
//            DELETE /properties/favorites/:propertyId
//            POST /properties/favorites/:propertyId/toggle  ⭐
//            GET  /properties/favorites/:propertyId/check
// ============================================================

import api from './api';
import type { Property } from '@/types';

interface ToggleResult {
  isFavorite: boolean;
  action: 'added' | 'removed';
}

interface AddResult {
  alreadySaved: boolean;
}

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

class FavouritesService {
  /** GET /properties/favorites — list favourites */
  async list(): Promise<Property[]> {
    const res = await api.get<any>('/properties/favorites');
    const data = res.data;

    let items: any[] = [];

    // Backend returns { favorites: [...], total: number }
    if (data?.favorites && Array.isArray(data.favorites)) {
      items = data.favorites;
    }
    // Fallback: plain array response
    else if (Array.isArray(data)) {
      items = data;
    }
    // Fallback: { items: [...] } shape
    else if (data?.items && Array.isArray(data.items)) {
      items = data.items;
    }

    // Normalise each property (mediaUrls → images)
    return items.map(normalizeProperty);
  }

  /** POST /properties/favorites/:propertyId — add to favourites (idempotent) */
  async add(propertyId: string): Promise<AddResult> {
    const res = await api.post<any>(`/properties/favorites/${propertyId}`);
    return { alreadySaved: res.data?.alreadySaved ?? false };
  }

  /** DELETE /properties/favorites/:propertyId — remove from favourites */
  async remove(propertyId: string): Promise<void> {
    await api.delete(`/properties/favorites/${propertyId}`);
  }

  /** POST /properties/favorites/:propertyId/toggle — toggle favourite state ⭐ */
  async toggle(propertyId: string): Promise<ToggleResult> {
    const res = await api.post<any>(`/properties/favorites/${propertyId}/toggle`);
    return {
      isFavorite: res.data?.isFavorite ?? false,
      action: res.data?.action ?? 'added',
    };
  }

  /** GET /properties/favorites/:propertyId/check — check if favourited */
  async check(propertyId: string): Promise<boolean> {
    try {
      const res = await api.get<any>(
        `/properties/favorites/${propertyId}/check`,
      );
      return res.data?.isFavorite ?? res.data?.isFavourite ?? false;
    } catch {
      return false;
    }
  }
}

export const favoritesService = new FavouritesService();
export default favoritesService;
