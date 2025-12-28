// Trading pair configuration - BNB/USDT only
export const TRADING_PAIR = {
  symbol: 'BNBUSDT',
  base: 'BNB',
  quote: 'USDT',
  // Binance precision settings for BNB/USDT
  pricePrecision: 2,     // Price decimal places
  quantityPrecision: 3,  // Quantity decimal places
  minNotional: 10,       // Minimum order value in USDT
} as const;

// Supported timeframes
export const TIMEFRAMES = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
} as const;

export type Timeframe = keyof typeof TIMEFRAMES;

// Default timeframes for chart display
export const CHART_TIMEFRAMES: Timeframe[] = ['5m', '15m'];

// Higher timeframe for bias detection
export const HTF_TIMEFRAME: Timeframe = '1h';

// Indicator periods
export const INDICATOR_PERIODS = {
  ema: {
    fast: 20,
    slow: 50,
  },
  atr: 14,
  bollingerBands: {
    period: 20,
    stdDev: 2,
  },
  volumeDelta: 10,
  adx: 14,
  chopIndex: 14,
} as const;

// Gatekeeper thresholds
export const GATEKEEPER_THRESHOLDS = {
  minVolatility: 0.7,    // ATR normalized must be above this
  maxChopIndex: 61.8,    // Chop index must be below this
  minADX: 20,            // ADX must be above this
  minConfidence: 65,     // Model confidence must be above this
} as const;

// Risk management defaults
export const RISK_DEFAULTS = {
  riskPercentPresets: [0.5, 1, 2] as const,
  defaultRiskPercent: 0.75,
  takeProfitMultiplier: {
    min: 1.5,
    max: 2,
    default: 1.5,
  },
  trailingStopActivationR: 1,  // Activate trailing stop after +1R
  maxDailyTrades: 3,
  dailyLossLimit: -50,         // USD
  dailyProfitLock: 100,        // USD
} as const;

// AI states
export const AI_STATES = {
  BULLISH: 'BULLISH',
  BEARISH: 'BEARISH',
  NO_TRADE: 'NO_TRADE',
} as const;

export type AIState = keyof typeof AI_STATES;

// Volatility states
export const VOLATILITY_STATES = {
  HIGH: 'HIGH',
  LOW: 'LOW',
} as const;

export type VolatilityState = keyof typeof VOLATILITY_STATES;

// Order statuses
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  OPEN: 'OPEN',
  FILLED: 'FILLED',
  PARTIALLY_FILLED: 'PARTIALLY_FILLED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  REJECTED: 'REJECTED',
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS;

// Lock reasons
export const LOCK_REASONS = {
  LOSS_LIMIT: 'LOSS_LIMIT',
  PROFIT_LOCK: 'PROFIT_LOCK',
  TRADE_COUNT: 'TRADE_COUNT',
  MANUAL: 'MANUAL',
  LOW_VOLATILITY: 'LOW_VOLATILITY',
  CHOPPY_MARKET: 'CHOPPY_MARKET',
} as const;

export type LockReason = keyof typeof LOCK_REASONS;

// Candle history limits
export const CANDLE_LIMITS = {
  initialLoad: 500,    // Candles to load on startup
  maxStored: 1000,     // Max candles to keep in memory per timeframe
} as const;

// WebSocket reconnection settings
export const WS_RECONNECT = {
  maxAttempts: 10,
  baseDelay: 1000,     // 1 second
  maxDelay: 60000,     // 1 minute
} as const;
