import type { Candle } from '../../types/market.js';

/**
 * Estimate buying vs selling volume for a single candle
 *
 * Uses price position within the candle to estimate
 * If close > open: More buying pressure
 * If close < open: More selling pressure
 *
 * Buy Volume ≈ Volume * (Close - Low) / (High - Low)
 * Sell Volume ≈ Volume * (High - Close) / (High - Low)
 */
export function estimateBuySellVolume(candle: Candle): {
  buyVolume: number;
  sellVolume: number;
  delta: number;
} {
  const range = candle.high - candle.low;

  if (range === 0) {
    // Flat candle, split volume evenly
    return {
      buyVolume: candle.volume / 2,
      sellVolume: candle.volume / 2,
      delta: 0,
    };
  }

  const buyRatio = (candle.close - candle.low) / range;
  const sellRatio = (candle.high - candle.close) / range;

  const buyVolume = candle.volume * buyRatio;
  const sellVolume = candle.volume * sellRatio;

  return {
    buyVolume,
    sellVolume,
    delta: buyVolume - sellVolume,
  };
}

/**
 * Calculate cumulative volume delta over N periods
 * Positive = More buying pressure
 * Negative = More selling pressure
 */
export function calculateVolumeDelta(
  candles: Candle[],
  period: number = 10
): number {
  if (candles.length === 0) return 0;

  const slice = candles.slice(-period);
  let cumulativeDelta = 0;

  for (const candle of slice) {
    const { delta } = estimateBuySellVolume(candle);
    cumulativeDelta += delta;
  }

  return cumulativeDelta;
}

/**
 * Calculate normalized volume delta
 * Returns value between -1 and 1
 * -1 = All selling
 * +1 = All buying
 * 0 = Balanced
 */
export function calculateNormalizedVolumeDelta(
  candles: Candle[],
  period: number = 10
): number {
  if (candles.length === 0) return 0;

  const slice = candles.slice(-period);
  let totalBuyVolume = 0;
  let totalSellVolume = 0;

  for (const candle of slice) {
    const { buyVolume, sellVolume } = estimateBuySellVolume(candle);
    totalBuyVolume += buyVolume;
    totalSellVolume += sellVolume;
  }

  const totalVolume = totalBuyVolume + totalSellVolume;

  if (totalVolume === 0) return 0;

  // Normalize to -1 to +1 range
  return (totalBuyVolume - totalSellVolume) / totalVolume;
}

/**
 * Calculate volume SMA ratio
 * Returns current volume / average volume
 * Values > 1 indicate above-average volume
 */
export function calculateVolumeSMARatio(
  candles: Candle[],
  period: number = 20
): number {
  if (candles.length === 0) return 1;

  const currentVolume = candles[candles.length - 1]!.volume;
  const slice = candles.slice(-period);
  const avgVolume = slice.reduce((sum, c) => sum + c.volume, 0) / slice.length;

  if (avgVolume === 0) return 1;

  return currentVolume / avgVolume;
}

/**
 * Detect volume spike
 * Returns true if current volume is significantly above average
 */
export function detectVolumeSpike(
  candles: Candle[],
  period: number = 20,
  spikeThreshold: number = 2
): boolean {
  return calculateVolumeSMARatio(candles, period) > spikeThreshold;
}
