export * from './ema.js';
export * from './vwap.js';
export * from './atr.js';
export * from './bollingerBands.js';
export * from './volumeDelta.js';

import type { Candle, Indicators } from '../../types/index.js';
import { INDICATOR_PERIODS } from '../../config/constants.js';
import { calculateEMA, calculateEMASlope, calculateEMASpread } from './ema.js';
import { getCurrentVWAP, calculateVWAPDistance } from './vwap.js';
import { calculateATR, calculateNormalizedATR } from './atr.js';
import { calculateBollingerBands, calculateNormalizedBBWidth } from './bollingerBands.js';
import { calculateNormalizedVolumeDelta, calculateVolumeSMARatio } from './volumeDelta.js';

/**
 * Calculate all indicators for a set of candles
 */
export function calculateAllIndicators(candles: Candle[]): Indicators | null {
  if (candles.length < 50) {
    return null;  // Need minimum data for meaningful indicators
  }

  const ema20Values = calculateEMA(candles, INDICATOR_PERIODS.ema.fast);
  const ema50Values = calculateEMA(candles, INDICATOR_PERIODS.ema.slow);
  const atrValues = calculateATR(candles, INDICATOR_PERIODS.atr);
  const bbValues = calculateBollingerBands(
    candles,
    INDICATOR_PERIODS.bollingerBands.period,
    INDICATOR_PERIODS.bollingerBands.stdDev
  );

  const ema20 = ema20Values[ema20Values.length - 1] ?? 0;
  const ema50 = ema50Values[ema50Values.length - 1] ?? 0;
  const atr = atrValues[atrValues.length - 1] ?? 0;
  const vwap = getCurrentVWAP(candles);
  const bb = bbValues[bbValues.length - 1];

  return {
    ema20,
    ema50,
    vwap,
    atr,
    bbWidth: bb?.width ?? 0,
    volumeDelta: calculateNormalizedVolumeDelta(candles, INDICATOR_PERIODS.volumeDelta),
    adx: 0,        // Will be implemented in volatility detector
    chopIndex: 0,  // Will be implemented in volatility detector
  };
}

/**
 * Add indicator values to candles
 */
export function enrichCandlesWithIndicators(
  candles: Candle[]
): Array<Candle & { ema20?: number; ema50?: number; vwap?: number }> {
  if (candles.length === 0) return [];

  const ema20Values = calculateEMA(candles, INDICATOR_PERIODS.ema.fast);
  const ema50Values = calculateEMA(candles, INDICATOR_PERIODS.ema.slow);
  const vwapValues: number[] = [];

  // Calculate VWAP incrementally
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  let currentDay = -1;

  for (const candle of candles) {
    const candleDay = Math.floor(candle.openTime / (24 * 60 * 60 * 1000));
    if (candleDay !== currentDay) {
      cumulativeTPV = 0;
      cumulativeVolume = 0;
      currentDay = candleDay;
    }

    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    cumulativeTPV += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;

    vwapValues.push(cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : typicalPrice);
  }

  return candles.map((candle, i) => ({
    ...candle,
    ema20: ema20Values[i],
    ema50: ema50Values[i],
    vwap: vwapValues[i],
  }));
}
