import type { Candle } from '../../types/market.js';

/**
 * Calculate Volume Weighted Average Price (VWAP)
 *
 * VWAP = Cumulative(Typical Price * Volume) / Cumulative(Volume)
 * Typical Price = (High + Low + Close) / 3
 *
 * VWAP resets at the start of each trading session (daily)
 */
export function calculateVWAP(candles: Candle[]): number[] {
  if (candles.length === 0) return [];

  const vwapValues: number[] = [];
  let cumulativeTPV = 0;  // Cumulative Typical Price * Volume
  let cumulativeVolume = 0;
  let currentDay = -1;

  for (const candle of candles) {
    // Get day from timestamp
    const candleDay = Math.floor(candle.openTime / (24 * 60 * 60 * 1000));

    // Reset VWAP at start of new day
    if (candleDay !== currentDay) {
      cumulativeTPV = 0;
      cumulativeVolume = 0;
      currentDay = candleDay;
    }

    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    cumulativeTPV += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;

    const vwap = cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : typicalPrice;
    vwapValues.push(vwap);
  }

  return vwapValues;
}

/**
 * Calculate current VWAP value (most recent)
 */
export function getCurrentVWAP(candles: Candle[]): number {
  const vwapValues = calculateVWAP(candles);
  return vwapValues[vwapValues.length - 1] ?? 0;
}

/**
 * Calculate distance from VWAP as a percentage
 */
export function calculateVWAPDistance(
  currentPrice: number,
  vwap: number
): number {
  if (vwap === 0) return 0;
  return (currentPrice - vwap) / vwap;
}

/**
 * Calculate VWAP distance in ATR units
 */
export function calculateVWAPDistanceATR(
  currentPrice: number,
  vwap: number,
  atr: number
): number {
  if (atr === 0) return 0;
  return (currentPrice - vwap) / atr;
}

/**
 * Calculate intraday VWAP only (resets provided candles)
 * Use this when you already have only today's candles
 */
export function calculateIntradayVWAP(candles: Candle[]): number {
  if (candles.length === 0) return 0;

  let cumulativeTPV = 0;
  let cumulativeVolume = 0;

  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    cumulativeTPV += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;
  }

  return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : 0;
}
