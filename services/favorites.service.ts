// ============================================================
// Favourites Service (CLIENT role required)
// Endpoints: GET    /properties/favorites
//            POST   /properties/favorites/:propertyId
//            DELETE /properties/favorites/:propertyId
//            POST   /properties/favorites/:propertyId/toggle
//            GET    /properties/favorites/:propertyId/check
// ============================================================

import api from './api';
import type { Property } from '@/types';

interface ToggleResult {
  isFavorite: boolean;
  action: 'added' | 'removed';
}

/**
 * Normalise a single property from the backend.
 * Maps `mediaUrls` → `images` so all UI components can use `property.images`.
 */
function normalizeProperty(raw: any): Property {
  if (!raw) return raw;
  // If this is a favourite record with a nested `property`, unwrap it
  const prop = raw.property ?? raw;
  return {
    ...prop,
    images: prop.images?.length ? prop.images : (prop.mediaUrls ?? []),
    amenities: prop.amenities ?? [],
  };
}

class FavouritesService {
  /** GET /properties/favorites — list favourites */
  async list(): Promise<Property[]> {
    let res: any;
    try {
      res = await api.get<any>('/properties/favorites');
    } catch (err: any) {
      // Backend may return RESOURCE_NOT_FOUND if a favourited property was
      // deleted. Try to extract partial data from the error, otherwise
      // re-throw so the UI can show a meaningful error message.
      if (__DEV__) console.warn('[Favourites] list API error:', err?.error?.code, err?.error?.message);

      // If the error envelope still contains some data, try to use it
      const errData = err?.data;
      if (errData) {
        const partial =
          errData.favorites ?? errData.items ?? (Array.isArray(errData) ? errData : null);
        if (partial && Array.isArray(partial)) {
          return partial.map(normalizeProperty).filter(Boolean);
        }
      }
      throw err;
    }

    const data = res.data;

    if (__DEV__) console.log('[Favourites] raw response:', JSON.stringify(res).slice(0, 500));

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
    // Fallback: maybe res itself is the array (interceptor already unwrapped)
    else if (Array.isArray(res)) {
      items = res as any[];
    }

    if (__DEV__) console.log('[Favourites] parsed items count:', items.length, 'first item keys:', items[0] ? Object.keys(items[0]) : 'none');

    // Normalise each property (unwrap nested .property + mediaUrls → images)
    return items.map(normalizeProperty).filter(Boolean);
  }

  /** POST /properties/favorites/:propertyId — add to favourites (idempotent) */
  async add(propertyId: string): Promise<void> {
    await api.post(`/properties/favorites/${propertyId}`);
  }

  /** DELETE /properties/favorites/:propertyId — remove from favourites */
  async remove(propertyId: string): Promise<void> {
    await api.delete(`/properties/favorites/${propertyId}`);
  }

  /** POST /properties/favorites/:propertyId/toggle — toggle favourite state */
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
