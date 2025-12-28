import type { Candle } from '../../types/market.js';

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  width: number;        // (Upper - Lower) / Middle
  percentB: number;     // (Price - Lower) / (Upper - Lower)
}

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(values: number[], period: number): number {
  if (values.length < period) {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
  const slice = values.slice(-period);
  return slice.reduce((sum, v) => sum + v, 0) / period;
}

/**
 * Calculate Standard Deviation
 */
function calculateStdDev(values: number[], period: number): number {
  if (values.length === 0) return 0;

  const slice = values.slice(-period);
  const mean = slice.reduce((sum, v) => sum + v, 0) / slice.length;
  const squaredDiffs = slice.map(v => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / slice.length;

  return Math.sqrt(variance);
}

/**
 * Calculate Bollinger Bands for a series of candles
 */
export function calculateBollingerBands(
  candles: Candle[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBands[] {
  if (candles.length === 0) return [];

  const closes = candles.map(c => c.close);
  const bands: BollingerBands[] = [];

  for (let i = 0; i < candles.length; i++) {
    const slice = closes.slice(0, i + 1);
    const sma = calculateSMA(slice, period);
    const stdDev = calculateStdDev(slice, period);

    const upper = sma + stdDev * stdDevMultiplier;
    const lower = sma - stdDev * stdDevMultiplier;
    const currentPrice = closes[i]!;

    bands.push({
      upper,
      middle: sma,
      lower,
      width: sma > 0 ? (upper - lower) / sma : 0,
      percentB: upper !== lower ? (currentPrice - lower) / (upper - lower) : 0.5,
    });
  }

  return bands;
}

/**
 * Get current Bollinger Bands
 */
export function getCurrentBollingerBands(
  candles: Candle[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBands | null {
  const bands = calculateBollingerBands(candles, period, stdDevMultiplier);
  return bands[bands.length - 1] ?? null;
}

/**
 * Calculate normalized Bollinger Band width
 * Compares current width to historical average
 */
export function calculateNormalizedBBWidth(
  bands: BollingerBands[],
  lookback: number = 50
): number {
  if (bands.length === 0) return 1;

  const currentWidth = bands[bands.length - 1]!.width;
  const startIndex = Math.max(0, bands.length - lookback);
  const lookbackWidths = bands.slice(startIndex).map(b => b.width);

  if (lookbackWidths.length === 0) return 1;

  const meanWidth = lookbackWidths.reduce((sum, w) => sum + w, 0) / lookbackWidths.length;

  if (meanWidth === 0) return 1;

  return currentWidth / meanWidth;
}

/**
 * Detect Bollinger Band squeeze (low volatility)
 * Returns true if current width is below threshold of historical average
 */
export function detectBBSqueeze(
  bands: BollingerBands[],
  lookback: number = 50,
  squeezeThreshold: number = 0.5
): boolean {
  const normalizedWidth = calculateNormalizedBBWidth(bands, lookback);
  return normalizedWidth < squeezeThreshold;
}

/**
 * Detect Bollinger Band expansion (high volatility breakout)
 */
export function detectBBExpansion(
  bands: BollingerBands[],
  lookback: number = 50,
  expansionThreshold: number = 1.5
): boolean {
  const normalizedWidth = calculateNormalizedBBWidth(bands, lookback);
  return normalizedWidth > expansionThreshold;
}
