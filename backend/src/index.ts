import { config } from './config/index.js';
import { createApp } from './app.js';
import { initDatabase, closeDatabase } from './database/index.js';
import { binanceClient } from './services/binance/client.js';
import { binanceWebSocket } from './services/binance/websocket.js';
import { frontendWS } from './websocket/server.js';
import { appState } from './state/appState.js';
import { CHART_TIMEFRAMES, HTF_TIMEFRAME, CANDLE_LIMITS } from './config/constants.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger('Main');

async function loadInitialData() {
  logger.info('Loading initial candle data...');

  // Load historical candles for each timeframe
  for (const timeframe of [...CHART_TIMEFRAMES, HTF_TIMEFRAME]) {
    try {
      const candles = await binanceClient.getKlines(timeframe, CANDLE_LIMITS.initialLoad);
      appState.setCandles(timeframe, candles);
      logger.info(`Loaded ${candles.length} ${timeframe} candles`);
    } catch (error) {
      logger.error(`Failed to load ${timeframe} candles`, error);
    }
  }

  // Get initial price
  try {
    const ticker = await binanceClient.get24hrTicker();
    appState.updatePrice({
      symbol: 'BNBUSDT',
      price: ticker.price,
      priceChange: ticker.priceChange,
      priceChangePercent: ticker.priceChangePercent,
      high24h: ticker.high,
      low24h: ticker.low,
      volume24h: ticker.volume,
      quoteVolume24h: ticker.quoteVolume,
      timestamp: Date.now(),
    });
    logger.info(`Initial price: $${ticker.price.toFixed(2)}`);
  } catch (error) {
    logger.error('Failed to get initial price', error);
  }
}

async function main() {
  logger.info('Starting BNB/USDT Trading Application...');
  logger.info('Environment:', { env: config.env, testnet: config.binance.testnet });

  // Initialize database
  try {
    initDatabase();
    logger.info('Database initialized');
  } catch (error) {
    logger.error('Failed to initialize database', error);
    process.exit(1);
  }

  // Load initial market data
  await loadInitialData();

  // Setup Binance WebSocket event handlers
  binanceWebSocket.on('price', (data) => {
    appState.updatePrice(data);
  });

  binanceWebSocket.on('candle', (timeframe, candle) => {
    appState.updateCandle(timeframe, candle);
  });

  binanceWebSocket.on('connected', () => {
    appState.setConnectionStatus(true);
    logger.info('Binance WebSocket connected');
  });

  binanceWebSocket.on('disconnected', () => {
    appState.setConnectionStatus(false);
    logger.warn('Binance WebSocket disconnected');
  });

  binanceWebSocket.on('reconnecting', () => {
    logger.info('Binance WebSocket reconnecting...');
  });

  binanceWebSocket.on('error', (error) => {
    logger.error('Binance WebSocket error', error);
  });

  // Connect to Binance WebSocket
  binanceWebSocket.connect();

  // Start frontend WebSocket server
  frontendWS.start();

  // Start HTTP server
  const app = createApp();
  const server = app.listen(config.port, () => {
    logger.info(`HTTP server listening on port ${config.port}`);
    logger.info(`WebSocket server listening on port ${config.wsPort}`);
    logger.info('Application ready');
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);

    server.close(() => {
      logger.info('HTTP server closed');
    });

    frontendWS.stop();
    binanceWebSocket.disconnect();
    closeDatabase();

    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', reason);
  });
}

main().catch((error) => {
  logger.error('Fatal error', error);
  process.exit(1);
});
