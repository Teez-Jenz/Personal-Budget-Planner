import { CurrencyCode, CurrencyConfig } from './types';

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  NGN: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', decimalPlaces: 2 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2 },
  GHS: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', decimalPlaces: 2 },
  KES: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', decimalPlaces: 2 },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimalPlaces: 2 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', decimalPlaces: 2 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimalPlaces: 2 },
};

export const DEFAULT_CURRENCY: CurrencyCode = 'NGN';

/**
 * Safely converts a major currency value (e.g. 1500.50 or "1500.50")
 * to integer minor units (e.g. 150050 kobo) avoiding binary float precision bugs.
 */
export function toMinorUnits(amount: number | string, currency: CurrencyCode = DEFAULT_CURRENCY): number {
  if (typeof amount === 'number') {
    if (isNaN(amount) || !isFinite(amount)) return 0;
    // Format to fixed string first to prevent float issues like 19.99 * 100 = 1998.9999999999998
    amount = amount.toFixed(SUPPORTED_CURRENCIES[currency]?.decimalPlaces ?? 2);
  }

  const clean = amount.trim().replace(/,/g, '');
  if (!clean || isNaN(Number(clean))) return 0;

  const parts = clean.split('.');
  const wholePart = parseInt(parts[0], 10) || 0;
  const isNegative = wholePart < 0 || clean.startsWith('-');

  const decimals = SUPPORTED_CURRENCIES[currency]?.decimalPlaces ?? 2;
  let fractionPartStr = (parts[1] || '').padEnd(decimals, '0').slice(0, decimals);
  const fractionPart = parseInt(fractionPartStr, 10) || 0;

  const multiplier = Math.pow(10, decimals);
  const total = Math.abs(wholePart) * multiplier + fractionPart;

  return isNegative ? -total : total;
}

/**
 * Converts integer minor units (e.g. 150050 kobo) to standard decimal major number (1500.50)
 */
export function fromMinorUnits(minorUnits: number, currency: CurrencyCode = DEFAULT_CURRENCY): number {
  if (isNaN(minorUnits) || !isFinite(minorUnits)) return 0;
  const decimals = SUPPORTED_CURRENCIES[currency]?.decimalPlaces ?? 2;
  const divisor = Math.pow(10, decimals);
  return Number((minorUnits / divisor).toFixed(decimals));
}

/**
 * Formats minor units into an accessible, localized string with symbol.
 * Example: formatCurrency(150050, 'NGN') => "₦1,500.50"
 */
export function formatCurrency(
  minorUnits: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
  showSymbol: boolean = true
): string {
  const cfg = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.NGN;
  const major = fromMinorUnits(minorUnits, currency);

  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: cfg.decimalPlaces,
    maximumFractionDigits: cfg.decimalPlaces,
  }).format(Math.abs(major));

  const sign = minorUnits < 0 ? '-' : '';
  const symbol = showSymbol ? cfg.symbol : '';

  return `${sign}${symbol}${formattedNumber}`;
}

/**
 * Formats a percentage with safe bounds and specified decimal places.
 */
export function formatPercent(percent: number, decimals: number = 0): string {
  if (isNaN(percent) || !isFinite(percent)) return '0%';
  return `${percent.toFixed(decimals)}%`;
}

/**
 * Safe integer additions / subtractions
 */
export function safeAdd(a: number, b: number): number {
  return Math.round(a) + Math.round(b);
}

export function safeSubtract(a: number, b: number): number {
  return Math.round(a) - Math.round(b);
}
