import type { Candle } from '../../types/market.js';
import type { VolatilityState } from '../../config/constants.js';
import { GATEKEEPER_THRESHOLDS } from '../../config/constants.js';
import { calculateATR, calculateNormalizedATR } from '../indicators/atr.js';
import { calculateBollingerBands, calculateNormalizedBBWidth } from '../indicators/bollingerBands.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('VolatilityDetector');

export interface VolatilityAnalysis {
  state: VolatilityState;
  atrNormalized: number;
  bbWidthNormalized: number;
  volatilityScore: number;  // Combined score 0-1
  isLow: boolean;
  details: string;
}

/**
 * Analyze current volatility conditions
 *
 * HIGH volatility = Good for trading (clear moves)
 * LOW volatility = Bad for trading (choppy, no direction)
 */
export function analyzeVolatility(candles: Candle[]): VolatilityAnalysis {
  if (candles.length < 50) {
    return {
      state: 'LOW',
      atrNormalized: 0,
      bbWidthNormalized: 0,
      volatilityScore: 0,
      isLow: true,
      details: 'Insufficient data for volatility analysis',
    };
  }

  // Calculate ATR-based volatility
  const atrValues = calculateATR(candles, 14);
  const atrNormalized = calculateNormalizedATR(atrValues, 50);

  // Calculate Bollinger Band width-based volatility
  const bbValues = calculateBollingerBands(candles, 20, 2);
  const bbWidthNormalized = calculateNormalizedBBWidth(bbValues, 50);

  // Combined volatility score (geometric mean for balanced weighting)
  const volatilityScore = Math.sqrt(atrNormalized * bbWidthNormalized);

  // Determine volatility state
  const isLow = atrNormalized < GATEKEEPER_THRESHOLDS.minVolatility;
  const state: VolatilityState = isLow ? 'LOW' : 'HIGH';

  const details = isLow
    ? `Low volatility: ATR=${atrNormalized.toFixed(2)}x, BB=${bbWidthNormalized.toFixed(2)}x`
    : `Normal/High volatility: ATR=${atrNormalized.toFixed(2)}x, BB=${bbWidthNormalized.toFixed(2)}x`;

  logger.debug('Volatility analysis', {
    state,
    atrNormalized,
    bbWidthNormalized,
    volatilityScore,
  });

  return {
    state,
    atrNormalized,
    bbWidthNormalized,
    volatilityScore,
    isLow,
    details,
  };
}

/**
 * Quick check if volatility is below trading threshold
 */
export function isVolatilityTooLow(candles: Candle[]): boolean {
  const analysis = analyzeVolatility(candles);
  return analysis.isLow;
}

/**
 * Calculate volatility expansion factor
 * Used as feature for AI model
 */
export function calculateVolatilityExpansion(
  atrNormalized: number,
  bbWidthNormalized: number
): number {
  return atrNormalized * bbWidthNormalized;
}
