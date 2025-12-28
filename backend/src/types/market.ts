import type { Timeframe, VolatilityState } from '../config/constants.js';

export interface Candle {
  openTime: number;      // Unix timestamp ms
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;        // Base asset volume
  quoteVolume: number;   // Quote asset volume
  tradeCount: number;
  isClosed: boolean;
}

export interface CandleWithIndicators extends Candle {
  ema20?: number;
  ema50?: number;
  vwap?: number;
  atr?: number;
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

export interface PriceUpdate {
  symbol: string;
  price: number;
  priceChange: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  timestamp: number;
}

export interface MarketState {
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volatilityState: VolatilityState;
  candles: Map<Timeframe, CandleWithIndicators[]>;
  indicators: Indicators;
  lastUpdate: number;
}

export interface KlineData {
  eventType: string;
  eventTime: number;
  symbol: string;
  kline: {
    startTime: number;
    closeTime: number;
    symbol: string;
    interval: string;
    firstTradeId: number;
    lastTradeId: number;
    open: string;
    close: string;
    high: string;
    low: string;
    volume: string;
    trades: number;
    isFinal: boolean;
    quoteVolume: string;
    buyVolume: string;
    quoteBuyVolume: string;
  };
}
