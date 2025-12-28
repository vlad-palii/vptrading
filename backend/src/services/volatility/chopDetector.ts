import type { Candle } from '../../types/market.js';
import { GATEKEEPER_THRESHOLDS } from '../../config/constants.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('ChopDetector');

export interface ChopAnalysis {
  isChoppy: boolean;
  adx: number;
  chopIndex: number;
  trendStrength: number;  // 0 = no trend, 1 = strong trend
  details: string;
}

/**
 * Calculate Average Directional Index (ADX)
 *
 * ADX measures trend strength (not direction)
 * ADX < 20 = Weak/no trend (choppy)
 * ADX 20-40 = Trending
 * ADX > 40 = Strong trend
 */
export function calculateADX(candles: Candle[], period: number = 14): number[] {
  if (candles.length < period + 1) {
    return candles.map(() => 0);
  }

  const adxValues: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  // Calculate DM and TR
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      plusDM.push(0);
      minusDM.push(0);
      tr.push(candles[i]!.high - candles[i]!.low);
    } else {
      const high = candles[i]!.high;
      const low = candles[i]!.low;
      const prevHigh = candles[i - 1]!.high;
      const prevLow = candles[i - 1]!.low;
      const prevClose = candles[i - 1]!.close;

      // Directional Movement
      const upMove = high - prevHigh;
      const downMove = prevLow - low;

      plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
      minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);

      // True Range
      tr.push(Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      ));
    }
  }

  // Smoothed values using Wilder's smoothing
  const smoothedPlusDM: number[] = [];
  const smoothedMinusDM: number[] = [];
  const smoothedTR: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period) {
      // Initial sum
      const pSum = plusDM.slice(0, i + 1).reduce((a, b) => a + b, 0);
      const mSum = minusDM.slice(0, i + 1).reduce((a, b) => a + b, 0);
      const tSum = tr.slice(0, i + 1).reduce((a, b) => a + b, 0);

      smoothedPlusDM.push(pSum);
      smoothedMinusDM.push(mSum);
      smoothedTR.push(tSum);
      adxValues.push(0);
    } else if (i === period) {
      // First smoothed value is sum of first N values
      const pSum = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
      const mSum = minusDM.slice(0, period).reduce((a, b) => a + b, 0);
      const tSum = tr.slice(0, period).reduce((a, b) => a + b, 0);

      smoothedPlusDM.push(pSum);
      smoothedMinusDM.push(mSum);
      smoothedTR.push(tSum);
      adxValues.push(0);
    } else {
      // Wilder's smoothing
      const pSmooth = smoothedPlusDM[i - 1]! - (smoothedPlusDM[i - 1]! / period) + plusDM[i]!;
      const mSmooth = smoothedMinusDM[i - 1]! - (smoothedMinusDM[i - 1]! / period) + minusDM[i]!;
      const tSmooth = smoothedTR[i - 1]! - (smoothedTR[i - 1]! / period) + tr[i]!;

      smoothedPlusDM.push(pSmooth);
      smoothedMinusDM.push(mSmooth);
      smoothedTR.push(tSmooth);

      // Calculate +DI and -DI
      const plusDI = tSmooth > 0 ? (pSmooth / tSmooth) * 100 : 0;
      const minusDI = tSmooth > 0 ? (mSmooth / tSmooth) * 100 : 0;

      // Calculate DX
      const diSum = plusDI + minusDI;
      const dx = diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;

      // ADX is smoothed DX
      if (i < period * 2) {
        adxValues.push(dx);
      } else {
        const prevADX = adxValues[i - 1] ?? dx;
        const adx = ((prevADX * (period - 1)) + dx) / period;
        adxValues.push(adx);
      }
    }
  }

  return adxValues;
}

/**
 * Calculate Choppiness Index
 *
 * Measures if market is trending or ranging
 * Values 0-38.2 = Trending
 * Values 38.2-61.8 = Transitional
 * Values 61.8-100 = Ranging/Choppy
 */
export function calculateChopIndex(candles: Candle[], period: number = 14): number[] {
  if (candles.length < period + 1) {
    return candles.map(() => 50); // Neutral value
  }

  const chopValues: number[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i < period) {
      chopValues.push(50); // Not enough data
    } else {
      const slice = candles.slice(i - period + 1, i + 1);

      // Sum of True Ranges
      let sumTR = 0;
      for (let j = 1; j < slice.length; j++) {
        const tr = Math.max(
          slice[j]!.high - slice[j]!.low,
          Math.abs(slice[j]!.high - slice[j - 1]!.close),
          Math.abs(slice[j]!.low - slice[j - 1]!.close)
        );
        sumTR += tr;
      }

      // Highest high and lowest low in period
      const highestHigh = Math.max(...slice.map(c => c.high));
      const lowestLow = Math.min(...slice.map(c => c.low));
      const range = highestHigh - lowestLow;

      if (range === 0) {
        chopValues.push(100); // Completely flat = max chop
      } else {
        // Choppiness Index formula
        const chop = 100 * Math.log10(sumTR / range) / Math.log10(period);
        chopValues.push(Math.min(100, Math.max(0, chop)));
      }
    }
  }

  return chopValues;
}

/**
 * Analyze if market is in choppy/ranging conditions
 */
export function analyzeChoppiness(candles: Candle[]): ChopAnalysis {
  if (candles.length < 30) {
    return {
      isChoppy: true,
      adx: 0,
      chopIndex: 100,
      trendStrength: 0,
      details: 'Insufficient data for chop analysis',
    };
  }

  const adxValues = calculateADX(candles, 14);
  const chopValues = calculateChopIndex(candles, 14);

  const adx = adxValues[adxValues.length - 1] ?? 0;
  const chopIndex = chopValues[chopValues.length - 1] ?? 100;

  // Market is choppy if:
  // - ADX is below threshold (weak trend)
  // - Chop Index is above threshold (ranging)
  const isChoppy = adx < GATEKEEPER_THRESHOLDS.minADX ||
                   chopIndex > GATEKEEPER_THRESHOLDS.maxChopIndex;

  // Trend strength: 0 = no trend, 1 = strong trend
  // Based on inverted chop index and ADX
  const chopStrength = Math.max(0, 1 - (chopIndex / 100));
  const adxStrength = Math.min(1, adx / 50);
  const trendStrength = (chopStrength + adxStrength) / 2;

  const details = isChoppy
    ? `Choppy market: ADX=${adx.toFixed(1)}, Chop=${chopIndex.toFixed(1)}`
    : `Trending market: ADX=${adx.toFixed(1)}, Chop=${chopIndex.toFixed(1)}`;

  logger.debug('Chop analysis', {
    isChoppy,
    adx,
    chopIndex,
    trendStrength,
  });

  return {
    isChoppy,
    adx,
    chopIndex,
    trendStrength,
    details,
  };
}

/**
 * Quick check if market is too choppy for trading
 */
export function isMarketTooChoppy(candles: Candle[]): boolean {
  const analysis = analyzeChoppiness(candles);
  return analysis.isChoppy;
}
