/**
 * Convert kobo amount to Naira.
 * The API returns all monetary values in kobo (1 Naira = 100 kobo).
 */
export function fromKobo(amountInKobo: number): number {
  return amountInKobo / 100;
}

/**
 * Format a kobo amount as Nigerian Naira currency string.
 * Automatically converts from kobo to Naira.
 *
 * @param amountInKobo - The amount in kobo (smallest currency unit)
 * @param currency - Currency code (default: 'NGN')
 * @param locale - Locale string (default: 'en-NG')
 */
export function formatCurrency(
  amountInKobo: number,
  currency: string = 'NGN',
  locale: string = 'en-NG',
): string {
  const nairaAmount = fromKobo(amountInKobo);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(nairaAmount);
  } catch {
    // Fallback for environments without Intl support
    return `₦${nairaAmount.toLocaleString()}`;
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
 * Works on kobo values — converts to Naira first.
 */
export function formatCompactNumber(numInKobo: number): string {
  const num = fromKobo(numInKobo);
  if (num >= 1_000_000_000) return `₦${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `₦${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `₦${(num / 1_000).toFixed(1)}K`;
  return `₦${num.toString()}`;
}

/**
 * Format a percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
