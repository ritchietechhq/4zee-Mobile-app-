// ============================================================
// Shared KYC Status Normaliser
//
// The backend may return various status strings depending on the
// endpoint and version.  The frontend uses four canonical values:
//   NOT_SUBMITTED | PENDING | APPROVED | REJECTED
//
// This helper maps every known backend variant to the canonical
// value so that the UI, badge colours, tab filters, and stats
// counters all work consistently.
// ============================================================

/** Canonical statuses the frontend recognises */
export type CanonicalKYCStatus =
  | 'NOT_SUBMITTED'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

/**
 * Map any backend KYC status string to a canonical frontend value.
 *
 * Backend variants handled:
 *  - `SUBMITTED`, `IN_REVIEW`, `UNDER_REVIEW`, `REVIEW` → `PENDING`
 *  - `VERIFIED`  → `APPROVED`
 *  - `DENIED`    → `REJECTED`
 *  - `null/undefined/empty` → `NOT_SUBMITTED`
 */
export const normaliseKYCStatus = (raw?: string | null): CanonicalKYCStatus => {
  if (!raw) return 'NOT_SUBMITTED';

  const upper = raw.toUpperCase().trim();

  switch (upper) {
    // ── Already canonical ────────────────────
    case 'NOT_SUBMITTED':
      return 'NOT_SUBMITTED';
    case 'PENDING':
      return 'PENDING';
    case 'APPROVED':
      return 'APPROVED';
    case 'REJECTED':
      return 'REJECTED';

    // ── Variants that map to PENDING ─────────
    case 'SUBMITTED':
    case 'IN_REVIEW':
    case 'UNDER_REVIEW':
    case 'REVIEW':
      return 'PENDING';

    // ── Variants that map to APPROVED ────────
    case 'VERIFIED':
      return 'APPROVED';

    // ── Variants that map to REJECTED ────────
    case 'DENIED':
      return 'REJECTED';

    // ── Unknown → treat as PENDING (safe default) ─
    default:
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
