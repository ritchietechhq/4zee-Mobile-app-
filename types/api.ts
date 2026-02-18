// ============================================================
// API Response Envelope & Shared Types
// Matches: docs/FRONTEND_API_DOCUMENTATION.md & MOBILE_API_CONTRACT.md
// ============================================================

/** Stable error codes returned by the backend */
export type ApiErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_TOKEN_INVALID'
  | 'AUTH_REFRESH_TOKEN_EXPIRED'
  | 'AUTH_ACCOUNT_LOCKED'
  | 'AUTH_2FA_REQUIRED'
  | 'AUTH_2FA_INVALID'
  | 'AUTH_FORBIDDEN'
  | 'VALIDATION_FAILED'
  | 'RESOURCE_NOT_FOUND'
  | 'RESOURCE_ALREADY_EXISTS'
  | 'RESOURCE_CONFLICT'
  | 'BUSINESS_OPERATION_FAILED'
  | 'BUSINESS_PAYMENT_FAILED'
  | 'BUSINESS_KYC_REQUIRED'
  | 'BUSINESS_INSUFFICIENT_BALANCE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'IDEMPOTENCY_KEY_INVALID'
  | 'IDEMPOTENCY_KEY_REUSED'
  | 'SERVER_INTERNAL_ERROR';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

export interface PaginationMeta {
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
  total?: number;
  page?: number;
  totalPages?: number;
}

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  version: string;
  pagination?: PaginationMeta;
}

/** Standard API response envelope — ALL responses follow this shape */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta: ApiMeta;
}

/** Cursor-paginated list shape (inside `data`) */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}
