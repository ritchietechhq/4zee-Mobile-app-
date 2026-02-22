// ============================================================
// Property Types
// Matches: GET /properties/search, /properties/:id, /properties/featured
// ============================================================

export type PropertyType = 'LAND' | 'APARTMENT' | 'DUPLEX' | 'BUNGALOW' | 'TERRACE' | 'COMMERCIAL';

export type PropertyAvailability = 'AVAILABLE' | 'SOLD' | 'RESERVED';

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  price: number; // in Naira
  location: string;
  city: string;
  state: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  bedrooms?: number;
  bathrooms?: number;
  toilets?: number;
  area?: number;
  amenities: string[];
  images: string[];      // Normalised from mediaUrls by the service layer
  mediaUrls?: string[];  // Raw field from the backend
  videoUrl?: string;
  virtualTourUrl?: string;
  availability: PropertyAvailability;
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertySearchFilters {
  q?: string;
  city?: string;
  state?: string;
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  availability?: PropertyAvailability;
  limit?: number;
  cursor?: string;
  page?: number;
  sortBy?: 'price' | 'createdAt' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
}

// ---- Realtor Listing CRUD ----

export interface CreateListingRequest {
  title: string;
  description: string;
  location: string;
  price: number;
  type: PropertyType;
  mediaUrls: string[];
  bedrooms?: number;
  bathrooms?: number;
  size?: number;
  amenities?: string[];
}

export interface UpdateListingRequest extends Partial<CreateListingRequest> {}

export interface ListingStats {
  total: number;
  available: number;
  reserved: number;
  sold: number;
  totalViews: number;
}
