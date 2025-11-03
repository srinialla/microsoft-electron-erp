import { getGlobalCurrency } from './formatting';

export function formatCurrency(value: number, currency?: string, locale?: string): string {
  // Use provided currency, or fall back to global currency, or default to INR
  const selectedCurrency = currency || getGlobalCurrency() || 'INR';
  const formatLocale = locale || (selectedCurrency === 'INR' ? 'en-IN' : 'en-US');
  return new Intl.NumberFormat(formatLocale, { style: 'currency', currency: selectedCurrency }).format(value);
}

export function formatDate(iso: string | number | Date, locale = 'en-US', options?: Intl.DateTimeFormatOptions): string {
  const date = typeof iso === 'string' || typeof iso === 'number' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(locale, options ?? { year: 'numeric', month: 'short', day: '2-digit' }).format(date);
}
