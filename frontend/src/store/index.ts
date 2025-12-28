import { create } from 'zustand';
import type {
  Candle,
  Indicators,
  Position,
  AIState,
  VolatilityState,
  Timeframe,
} from '../types';

interface AppState {
  // Market state
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  volatilityState: VolatilityState;
  candles5m: Candle[];
  candles15m: Candle[];
  candles1h: Candle[];
  indicators: Indicators | null;

  // AI state
  aiState: AIState;
  aiConfidence: number;
  gatekeeperActive: boolean;
  overrideReason: string | null;

  // Trading state
  isEnabled: boolean;
  isLocked: boolean;
  lockReason: string | null;
  position: Position | null;
  selectedRiskPercent: 0.5 | 1 | 2;

  // Risk state
  dailyPnl: number;
  tradeCount: number;
  maxTrades: number;

  // Connection state
  isConnected: boolean;
  isReconnecting: boolean;
  lastUpdate: number;

  // Chart state
  selectedTimeframe: Timeframe;

  // Actions
  setPrice: (price: number, change: number, changePercent: number) => void;
  setVolatilityState: (state: VolatilityState) => void;
  setCandles: (timeframe: Timeframe, candles: Candle[]) => void;
  updateCandle: (timeframe: Timeframe, candle: Candle) => void;
  setIndicators: (indicators: Indicators) => void;
  setAIState: (state: AIState, confidence: number, gatekeeperActive: boolean, reason?: string) => void;
  setLocked: (locked: boolean, reason?: string) => void;
  setPosition: (position: Position | null) => void;
  setSelectedRiskPercent: (percent: 0.5 | 1 | 2) => void;
  setRiskStats: (pnl: number, tradeCount: number, maxTrades: number) => void;
  setConnected: (connected: boolean) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setLastUpdate: (timestamp: number) => void;
  setSelectedTimeframe: (timeframe: Timeframe) => void;
}

export const useStore = create<AppState>((set, get) => ({
  // Market state
  price: 0,
  priceChange24h: 0,
  priceChangePercent24h: 0,
  volatilityState: 'LOW',
  candles5m: [],
  candles15m: [],
  candles1h: [],
  indicators: null,

  // AI state
  aiState: 'NO_TRADE',
  aiConfidence: 0,
  gatekeeperActive: true,
  overrideReason: 'Initializing...',

  // Trading state
  isEnabled: true,
  isLocked: false,
  lockReason: null,
  position: null,
  selectedRiskPercent: 1,

  // Risk state
  dailyPnl: 0,
  tradeCount: 0,
  maxTrades: 3,

  // Connection state
  isConnected: false,
  isReconnecting: false,
  lastUpdate: 0,

  // Chart state
  selectedTimeframe: '5m',

  // Actions
  setPrice: (price, change, changePercent) =>
    set({ price, priceChange24h: change, priceChangePercent24h: changePercent }),

  setVolatilityState: (volatilityState) => set({ volatilityState }),

  setCandles: (timeframe, candles) => {
    switch (timeframe) {
      case '5m':
        set({ candles5m: candles });
        break;
      case '15m':
        set({ candles15m: candles });
        break;
      case '1h':
        set({ candles1h: candles });
        break;
    }
  },

  updateCandle: (timeframe, candle) => {
    const state = get();
    let currentCandles: Candle[];

    switch (timeframe) {
      case '5m':
        currentCandles = state.candles5m;
        break;
      case '15m':
        currentCandles = state.candles15m;
        break;
      case '1h':
        currentCandles = state.candles1h;
        break;
      default:
        return;
    }

    // Find and update or add
    const existingIndex = currentCandles.findIndex((c) => c.time === candle.time);
    let newCandles: Candle[];

    if (existingIndex >= 0) {
      newCandles = [...currentCandles];
      newCandles[existingIndex] = candle;
    } else {
      newCandles = [...currentCandles, candle];
      // Keep max 1000 candles
      if (newCandles.length > 1000) {
        newCandles = newCandles.slice(-1000);
      }
    }

    switch (timeframe) {
      case '5m':
        set({ candles5m: newCandles });
        break;
      case '15m':
        set({ candles15m: newCandles });
        break;
      case '1h':
        set({ candles1h: newCandles });
        break;
    }
  },

  setIndicators: (indicators) => set({ indicators }),

  setAIState: (aiState, aiConfidence, gatekeeperActive, reason) =>
    set({
      aiState,
      aiConfidence,
      gatekeeperActive,
      overrideReason: reason ?? null,
    }),

  setLocked: (isLocked, reason) =>
    set({ isLocked, lockReason: reason ?? null }),

  setPosition: (position) => set({ position }),

  setSelectedRiskPercent: (selectedRiskPercent) => set({ selectedRiskPercent }),

  setRiskStats: (dailyPnl, tradeCount, maxTrades) =>
    set({ dailyPnl, tradeCount, maxTrades }),

  setConnected: (isConnected) => set({ isConnected, isReconnecting: false }),

  setReconnecting: (isReconnecting) => set({ isReconnecting }),

  setLastUpdate: (lastUpdate) => set({ lastUpdate }),

  setSelectedTimeframe: (selectedTimeframe) => set({ selectedTimeframe }),
}));

// Helper function to get candles by timeframe
export function getCandlesByTimeframe(state: AppState, timeframe: Timeframe): Candle[] {
  switch (timeframe) {
    case '5m':
      return state.candles5m;
    case '15m':
      return state.candles15m;
    case '1h':
      return state.candles1h;
    default:
      return [];
  }
}
