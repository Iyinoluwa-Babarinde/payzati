// Payzati FX Engine — Multi-currency conversion with transparent spreads

export interface FXQuote {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  inverseRate: number;
  spread: number;
  effectiveRate: number;
  fromAmount: number;
  toAmount: number;
  timestamp: Date;
}

// Base rates against USD (realistic approximate rates)
const BASE_RATES: Record<string, number> = {
  USD: 1,
  NGN: 1550,
  KES: 154,
  GHS: 15.5,
  ZAR: 18.2,
  EGP: 48.5,
  GBP: 0.79,
  EUR: 0.92,
};

// Small random fluctuation to simulate live rates
function addFluctuation(rate: number): number {
  const fluctuation = (Math.random() - 0.5) * 0.004; // ±0.2%
  return rate * (1 + fluctuation);
}

let rateCache: { rates: Record<string, number>; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getLiveRates(): Record<string, number> {
  const now = Date.now();
  if (rateCache && now - rateCache.timestamp < CACHE_DURATION) {
    return rateCache.rates;
  }
  const rates: Record<string, number> = {};
  for (const [currency, baseRate] of Object.entries(BASE_RATES)) {
    rates[currency] = addFluctuation(baseRate);
  }
  rateCache = { rates, timestamp: now };
  return rates;
}

export function getExchangeRate(from: string, to: string): number {
  const rates = getLiveRates();
  const fromRate = rates[from] || 1;
  const toRate = rates[to] || 1;
  return toRate / fromRate;
}

export function getFXQuote(fromCurrency: string, toCurrency: string, amount: number): FXQuote {
  const rawRate = getExchangeRate(fromCurrency, toCurrency);
  const spread = 0.002; // 0.2% Payzati spread (transparent)
  const effectiveRate = rawRate * (1 + spread);
  const toAmount = amount * effectiveRate;

  return {
    fromCurrency,
    toCurrency,
    rate: Math.round(rawRate * 10000) / 10000,
    inverseRate: Math.round((1 / rawRate) * 10000) / 10000,
    spread,
    effectiveRate: Math.round(effectiveRate * 10000) / 10000,
    fromAmount: amount,
    toAmount: Math.round(toAmount * 100) / 100,
    timestamp: new Date(),
  };
}

export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$', NGN: '₦', KES: 'KSh', GHS: 'GH₵', ZAR: 'R', EGP: 'E£', GBP: '£', EUR: '€',
  };
  const symbol = symbols[currency] || currency;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol}${formatted}`;
}

export const SUPPORTED_CURRENCIES = Object.keys(BASE_RATES);
