/**
 * Format a number as currency.
 * @param amount - The numeric amount
 * @param currency - Currency code (default: 'NGN')
 * @param locale - Locale string (default: 'en-NG')
 */
export function formatCurrency(
  amount: number,
  currency: string = 'NGN',
  locale: string = 'en-NG'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback for environments without Intl support
    return `${currency} ${amount.toLocaleString()}`;
  }
}

/**
 * Format a compact number (e.g., 1.2M, 500K)
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

/**
 * Format a percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
