const PHP_FORMATTER = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PHP_COMPACT = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Full peso format: ₱1,234.56 */
export function formatPeso(amount: number): string {
  return PHP_FORMATTER.format(amount);
}

/** Compact peso format: ₱1.2K */
export function formatPesoCompact(amount: number): string {
  return PHP_COMPACT.format(amount);
}

/** Parse a peso string to number */
export function parsePeso(value: string): number {
  const cleaned = value.replace(/[₱,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

/** Format a number with commas (no currency symbol) */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

/** Percentage of value/total, 0-100 */
export function calcPercent(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.max(0, (value / total) * 100));
}
