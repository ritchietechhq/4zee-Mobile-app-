// ============================================================
// Application Types
// Matches: POST /applications, GET /applications/me, GET /applications/:id
// ============================================================

import type { Property } from './property';

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ApplicationPaymentStatus = 'UNPAID' | 'PAID';

export interface ApplicationProperty {
  id: string;
  title: string;
  price: number;
  type?: string;
  location?: string;
  images?: string[];
  availability?: string;
}

export interface ApplicationUser {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface ApplicationClient {
  id: string;
  user: ApplicationUser;
}

export interface ApplicationRealtor {
  id: string;
  user: ApplicationUser;
}

export interface Application {
  id: string;
  status: ApplicationStatus;
  paymentStatus: ApplicationPaymentStatus;
  propertyId: string;
  clientId: string;
  realtorId?: string;
  property: ApplicationProperty;
  client?: ApplicationClient;
  realtor?: ApplicationRealtor;
  payment?: import('./payment').Payment | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationRequest {
  propertyId: string;
  realtorId?: string;
}
