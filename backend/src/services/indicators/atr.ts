import type { Candle } from '../../types/market.js';

/**
 * Calculate True Range for a single candle
 *
 * True Range = max(
 *   High - Low,
 *   |High - Previous Close|,
 *   |Low - Previous Close|
 * )
 */
export function calculateTrueRange(
  high: number,
  low: number,
  previousClose: number
): number {
  const highLow = high - low;
  const highPrevClose = Math.abs(high - previousClose);
  const lowPrevClose = Math.abs(low - previousClose);

  return Math.max(highLow, highPrevClose, lowPrevClose);
}

/**
 * Calculate Average True Range (ATR)
 *
 * Uses Wilder's smoothing method (similar to EMA)
 * First ATR = Simple average of first N true ranges
 * Subsequent ATR = ((Previous ATR * (N-1)) + Current TR) / N
 */
export function calculateATR(candles: Candle[], period: number = 14): number[] {
  if (candles.length < 2) return [];

  const atrValues: number[] = [];
  const trueRanges: number[] = [];

  // Calculate all true ranges
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      // First candle: TR = High - Low
      trueRanges.push(candles[i]!.high - candles[i]!.low);
    } else {
      const tr = calculateTrueRange(
        candles[i]!.high,
        candles[i]!.low,
        candles[i - 1]!.close
      );
      trueRanges.push(tr);
    }
  }

  // Calculate ATR using Wilder's smoothing
  if (trueRanges.length < period) {
    // Not enough data, return simple average of available TRs
    const avg = trueRanges.reduce((sum, tr) => sum + tr, 0) / trueRanges.length;
    return trueRanges.map(() => avg);
  }

  // First ATR is SMA of first N true ranges
  let atr = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;

  // Fill initial values
  for (let i = 0; i < period; i++) {
    atrValues.push(atr);
  }

  // Calculate subsequent ATRs using Wilder's smoothing
  for (let i = period; i < trueRanges.length; i++) {
    atr = ((atr * (period - 1)) + trueRanges[i]!) / period;
    atrValues.push(atr);
  }

  return atrValues;
}

/**
 * Get current ATR value
 */
export function getCurrentATR(candles: Candle[], period: number = 14): number {
  const atrValues = calculateATR(candles, period);
  return atrValues[atrValues.length - 1] ?? 0;
}

/**
 * Calculate normalized ATR (current ATR / mean ATR over lookback period)
 * Values > 1 indicate above-average volatility
 * Values < 1 indicate below-average volatility
 */
export function calculateNormalizedATR(
  atrValues: number[],
  lookback: number = 50
): number {
  if (atrValues.length === 0) return 1;

  const currentATR = atrValues[atrValues.length - 1]!;
  const startIndex = Math.max(0, atrValues.length - lookback);
  const lookbackATRs = atrValues.slice(startIndex);

  if (lookbackATRs.length === 0) return 1;

  const meanATR = lookbackATRs.reduce((sum, atr) => sum + atr, 0) / lookbackATRs.length;

  if (meanATR === 0) return 1;

  return currentATR / meanATR;
}

/**
 * Calculate ATR as percentage of price
 */
export function calculateATRPercent(atr: number, price: number): number {
  if (price === 0) return 0;
  return (atr / price) * 100;
}
