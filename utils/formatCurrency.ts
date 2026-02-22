/**
 * Convert kobo amount to Naira.
 * @deprecated The API returns monetary values in Naira, not kobo.
 */
export function fromKobo(amountInKobo: number): number {
  return amountInKobo / 100;
}

/**
 * Format a Naira amount as a Nigerian Naira currency string.
 * The API returns all monetary values in Naira (NOT kobo).
 *
 * @param amount - The amount in Naira
 * @param currency - Currency code (default: 'NGN')
 * @param locale - Locale string (default: 'en-NG')
 */
export function formatCurrency(
  amount: number,
  currency: string = 'NGN',
  locale: string = 'en-NG',
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback for environments without Intl support
    return `₦${amount.toLocaleString()}`;
  }
}

/**
 * Format a raw (already in Naira, not kobo) amount as currency.
 * Use this only when you know the value is already in Naira.
 */
export function formatNaira(
  amount: number,
  currency: string = 'NGN',
  locale: string = 'en-NG',
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₦${amount.toLocaleString()}`;
  }
}

/**
 * Format a compact number (e.g., 1.2M, 500K).
 * Amount is already in Naira.
 */
export function formatCompactNumber(amount: number): string {
  if (amount >= 1_000_000_000) return `₦${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`;
  return `₦${amount.toString()}`;
}

/**
 * Format a percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
