// ============================================================
// Shared KYC Status Normaliser
//
// The backend uses exactly four status values (Prisma enum KycStatus):
//   NOT_SUBMITTED | PENDING | APPROVED | REJECTED
//
// This helper is a safety net that ensures unknown/null values are
// handled gracefully.  It also provides normaliseStatusCounts() for
// aggregating stats.
// ============================================================

/** Canonical statuses the backend and frontend both use */
export type CanonicalKYCStatus =
  | 'NOT_SUBMITTED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

/**
 * Normalise a backend KYC status string to a canonical value.
 *
 * The backend already uses canonical values, so this is mainly a
 * null-safety wrapper.  Unknown strings default to PENDING.
 */
export const normaliseKYCStatus = (raw?: string | null): CanonicalKYCStatus => {
  if (!raw) return 'NOT_SUBMITTED';

  const upper = raw.toUpperCase().trim();

  switch (upper) {
    case 'NOT_SUBMITTED':
      return 'NOT_SUBMITTED';
    case 'PENDING':
      return 'PENDING';
    case 'APPROVED':
      return 'APPROVED';
    case 'REJECTED':
      return 'REJECTED';
    default:
      // Unknown value — treat as PENDING (safe default)
      return 'PENDING';
  }
};

/**
 * Merge a `Record<string, number>` keyed by raw backend statuses
 * into a record keyed by canonical statuses.
 *
 * e.g. `{ SUBMITTED: 3, PENDING: 2, VERIFIED: 1 }`
 *   → `{ PENDING: 5, APPROVED: 1 }`
 */
export const normaliseStatusCounts = (
  raw?: Record<string, number>,
): Record<string, number> => {
  if (!raw) return {};
  const out: Record<string, number> = {};
  for (const [key, count] of Object.entries(raw)) {
    const canonical = normaliseKYCStatus(key);
    out[canonical] = (out[canonical] ?? 0) + count;
  }
  return out;
};
