const API_BASE = '/api/v1';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  // Market endpoints
  getPrice: () => fetchAPI<{
    symbol: string;
    price: number;
    priceChange24h: number;
    priceChangePercent24h: number;
    timestamp: number;
  }>('/market/price'),

  getCandles: (timeframe: string, limit = 500) => fetchAPI<{
    symbol: string;
    timeframe: string;
    candles: Array<{
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
      ema20?: number;
      ema50?: number;
      vwap?: number;
    }>;
    count: number;
  }>(`/market/candles?timeframe=${timeframe}&limit=${limit}`),

  getIndicators: () => fetchAPI<{
    symbol: string;
    indicators: {
      ema20: number;
      ema50: number;
      vwap: number;
      atr: number;
      bbWidth: number;
      volumeDelta: number;
      adx: number;
      chopIndex: number;
    };
    timestamp: number;
  }>('/market/indicators'),

  getVolatility: () => fetchAPI<{
    state: 'HIGH' | 'LOW';
    isLow: boolean;
    details: {
      adx: number;
      chopIndex: number;
      atr: number;
      bbWidth: number;
    };
    timestamp: number;
  }>('/market/volatility'),

  // Health check
  getHealth: () => fetchAPI<{
    status: string;
    timestamp: number;
    uptime: number;
  }>('/health'),

  // Account endpoints
  getBalance: () => fetchAPI<{
    balances: {
      bnb: {
        free: number;
        locked: number;
        total: number;
        valueUsdt: number;
      };
      usdt: {
        free: number;
        locked: number;
        total: number;
      };
    };
    totalValueUsdt: number;
    currentBnbPrice: number;
    permissions: {
      canTrade: boolean;
      canWithdraw: boolean;
      canDeposit: boolean;
    };
    isTestnet: boolean;
    timestamp: number;
  }>('/account/balance'),

  getOpenOrders: () => fetchAPI<{
    orders: Array<{
      orderId: number;
      clientOrderId: string;
      side: string;
      type: string;
      status: string;
      price: number;
      origQty: number;
      executedQty: number;
    }>;
    count: number;
    timestamp: number;
  }>('/account/orders'),
};
