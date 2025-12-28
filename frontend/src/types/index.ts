export type AIState = 'BULLISH' | 'BEARISH' | 'NO_TRADE';
export type VolatilityState = 'HIGH' | 'LOW';
export type Timeframe = '5m' | '15m' | '1h';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  ema50?: number;
  vwap?: number;
}

export interface Indicators {
  ema20: number;
  ema50: number;
  vwap: number;
  atr: number;
  bbWidth: number;
  volumeDelta: number;
  adx: number;
  chopIndex: number;
}

export interface Position {
  id: number;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  stopLoss: number;
  takeProfit: number;
  unrealizedPnl: number;
  currentRMultiple: number;
}

export interface DailyStats {
  dailyPnl: number;
  tradeCount: number;
  maxTrades: number;
  isLocked: boolean;
  lockReason?: string;
}

export interface MarketState {
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volatilityState: VolatilityState;
  candles: Map<Timeframe, Candle[]>;
  indicators: Indicators | null;
  isConnected: boolean;
  lastUpdate: number;
}

export interface AIClassification {
  state: AIState;
  confidence: number;
  gatekeeperActive: boolean;
  overrideReason?: string;
}

export interface TradingState {
  isEnabled: boolean;
  isLocked: boolean;
  lockReason?: string;
  position: Position | null;
  selectedRiskPercent: 0.5 | 1 | 2;
}

export interface RiskState {
  dailyPnl: number;
  tradeCount: number;
  maxTrades: number;
  isLocked: boolean;
  lockReason?: string;
}

// WebSocket message types
export type WSMessageType =
  | 'PRICE_UPDATE'
  | 'CANDLE_UPDATE'
  | 'INDICATORS_UPDATE'
  | 'VOLATILITY_UPDATE'
  | 'AI_UPDATE'
  | 'POSITION_UPDATE'
  | 'RISK_UPDATE'
  | 'STATE_UPDATE'
  | 'CONNECTION_STATUS';

export interface WSMessage {
  type: WSMessageType;
  data: unknown;
  timestamp: number;
}
