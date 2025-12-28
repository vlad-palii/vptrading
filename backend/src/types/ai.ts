import type { AIState } from '../config/constants.js';

export interface AIFeatures {
  // EMA features
  ema20Slope: number;          // 5-bar rate of change
  ema50Slope: number;
  emaSpread: number;           // (EMA20 - EMA50) / EMA50

  // Volatility features
  atrNormalized: number;       // Current ATR / 50-bar ATR mean
  bbWidthNormalized: number;   // BB width / 50-bar mean
  volatilityExpansion: number; // atrNormalized * bbWidthNormalized

  // Volume features
  volumeDelta: number;         // 10-bar buying vs selling pressure
  volumeSmaRatio: number;      // Current volume / 20-bar SMA

  // VWAP features
  vwapDistance: number;        // (Close - VWAP) / VWAP
  vwapDistanceAtr: number;     // VWAP distance in ATR units

  // Higher timeframe features
  htfEmaBias: number;          // +1 if above EMA20, -1 if below
  htfTrend: number;            // Trend strength -1 to +1

  // Chop detection
  adx: number;
  chopIndex: number;
}

export interface AIClassification {
  state: AIState;
  confidence: number;          // 0-100
  features: AIFeatures;
  gatekeeperActive: boolean;
  overrideReason?: string;
  timestamp: number;
}

export interface AIStateHistory {
  id: number;
  timestamp: number;
  state: AIState;
  confidence: number;
  features: AIFeatures;
  gatekeeperOverride: boolean;
  overrideReason?: string;
}

export interface GatekeeperResult {
  shouldBlock: boolean;
  overrideToNoTrade: boolean;
  reason?: string;
}

export interface ModelPrediction {
  state: AIState;
  confidence: number;
  probabilities: {
    bullish: number;
    bearish: number;
    noTrade: number;
  };
}
