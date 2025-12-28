import type { Candle } from '../../types/market.js';

/**
 * Calculate Exponential Moving Average (EMA)
 *
 * EMA = (Close - Previous EMA) * Multiplier + Previous EMA
 * Multiplier = 2 / (Period + 1)
 */
export function calculateEMA(candles: Candle[], period: number): number[] {
  if (candles.length === 0) return [];
  if (candles.length < period) {
    // Not enough data, return SMA for available data
    const prices = candles.map(c => c.close);
    const sma = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    return candles.map(() => sma);
  }

  const multiplier = 2 / (period + 1);
  const emaValues: number[] = [];

  // Calculate initial SMA for first EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i]!.close;
  }
  let ema = sum / period;

  // Fill initial values with the first EMA
  for (let i = 0; i < period; i++) {
    emaValues.push(ema);
  }

  // Calculate EMA for remaining candles
  for (let i = period; i < candles.length; i++) {
    ema = (candles[i]!.close - ema) * multiplier + ema;
    emaValues.push(ema);
  }

  return emaValues;
}

/**
 * Calculate EMA for a single new candle given previous EMA
 */
export function updateEMA(
  currentClose: number,
  previousEMA: number,
  period: number
): number {
  const multiplier = 2 / (period + 1);
  return (currentClose - previousEMA) * multiplier + previousEMA;
}

/**
 * Calculate EMA slope (rate of change over N bars)
 * Returns percentage change
 */
export function calculateEMASlope(
  emaValues: number[],
  lookback: number = 5
): number {
  if (emaValues.length < lookback + 1) return 0;

  const currentEMA = emaValues[emaValues.length - 1]!;
  const previousEMA = emaValues[emaValues.length - 1 - lookback]!;

  if (previousEMA === 0) return 0;

  return (currentEMA - previousEMA) / previousEMA;
}

/**
 * Calculate EMA spread (distance between fast and slow EMA)
 * Returns percentage spread
 */
export function calculateEMASpread(
  fastEMA: number,
  slowEMA: number
): number {
  if (slowEMA === 0) return 0;
  return (fastEMA - slowEMA) / slowEMA;
}
