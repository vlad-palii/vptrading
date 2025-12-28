import { Router, Request, Response } from 'express';
import { appState } from '../../state/appState.js';
import { binanceClient } from '../../services/binance/client.js';
import { TRADING_PAIR, CHART_TIMEFRAMES } from '../../config/constants.js';
import type { Timeframe } from '../../config/constants.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('MarketRoutes');
const router = Router();

/**
 * GET /api/v1/market/price
 * Get current price and 24h stats
 */
router.get('/price', (req: Request, res: Response) => {
  try {
    const priceData = appState.getCurrentPrice();
    const change = appState.getPriceChange24h();

    res.json({
      symbol: TRADING_PAIR.symbol,
      price: priceData,
      priceChange24h: change.change,
      priceChangePercent24h: change.percent,
      timestamp: appState.getLastUpdate(),
    });
  } catch (error) {
    logger.error('Failed to get price', error);
    res.status(500).json({ error: 'Failed to get price' });
  }
});

/**
 * GET /api/v1/market/candles
 * Get historical candles with indicators
 */
router.get('/candles', (req: Request, res: Response): void => {
  try {
    const timeframe = (req.query.timeframe as string) || '5m';
    const limit = parseInt(req.query.limit as string) || 500;

    if (!CHART_TIMEFRAMES.includes(timeframe as any) && timeframe !== '1h') {
      res.status(400).json({
        error: `Invalid timeframe. Allowed: ${CHART_TIMEFRAMES.join(', ')}, 1h`,
      });
      return;
    }

    const candles = appState.getCandles(timeframe as Timeframe);
    const limitedCandles = candles.slice(-limit);

    res.json({
      symbol: TRADING_PAIR.symbol,
      timeframe,
      candles: limitedCandles.map(c => ({
        time: c.openTime / 1000,  // Convert to seconds for TradingView
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
        ema20: c.ema20,
        ema50: c.ema50,
        vwap: c.vwap,
      })),
      count: limitedCandles.length,
    });
  } catch (error) {
    logger.error('Failed to get candles', error);
    res.status(500).json({ error: 'Failed to get candles' });
  }
});

/**
 * GET /api/v1/market/indicators
 * Get current indicator values
 */
router.get('/indicators', (req: Request, res: Response): void => {
  try {
    const indicators = appState.getIndicators();

    if (!indicators) {
      res.status(503).json({
        error: 'Indicators not yet calculated',
        message: 'Waiting for sufficient candle data',
      });
      return;
    }

    res.json({
      symbol: TRADING_PAIR.symbol,
      indicators: {
        ema20: indicators.ema20,
        ema50: indicators.ema50,
        vwap: indicators.vwap,
        atr: indicators.atr,
        bbWidth: indicators.bbWidth,
        volumeDelta: indicators.volumeDelta,
        adx: indicators.adx,
        chopIndex: indicators.chopIndex,
      },
      timestamp: appState.getLastUpdate(),
    });
  } catch (error) {
    logger.error('Failed to get indicators', error);
    res.status(500).json({ error: 'Failed to get indicators' });
  }
});

/**
 * GET /api/v1/market/volatility
 * Get current volatility state
 */
router.get('/volatility', (req: Request, res: Response) => {
  try {
    const state = appState.getVolatilityState();
    const indicators = appState.getIndicators();

    res.json({
      state,
      isLow: state === 'LOW',
      details: {
        adx: indicators?.adx ?? 0,
        chopIndex: indicators?.chopIndex ?? 0,
        atr: indicators?.atr ?? 0,
        bbWidth: indicators?.bbWidth ?? 0,
      },
      timestamp: appState.getLastUpdate(),
    });
  } catch (error) {
    logger.error('Failed to get volatility', error);
    res.status(500).json({ error: 'Failed to get volatility' });
  }
});

/**
 * GET /api/v1/market/ticker
 * Get 24hr ticker directly from Binance
 */
router.get('/ticker', async (req: Request, res: Response) => {
  try {
    const ticker = await binanceClient.get24hrTicker();

    res.json({
      symbol: TRADING_PAIR.symbol,
      ...ticker,
    });
  } catch (error) {
    logger.error('Failed to get ticker', error);
    res.status(500).json({ error: 'Failed to get ticker' });
  }
});

export default router;
