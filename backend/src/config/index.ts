import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

// Load .env from project root (trading directory)
// Try multiple paths to handle different working directories
dotenvConfig({ path: resolve(process.cwd(), '.env') });
dotenvConfig({ path: resolve(process.cwd(), '../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  wsPort: parseInt(process.env.WS_PORT || '3002', 10),

  binance: {
    apiKey: process.env.BINANCE_API_KEY || '',
    apiSecret: process.env.BINANCE_API_SECRET || '',
    testnet: process.env.BINANCE_TESTNET === 'true',
  },

  database: {
    path: process.env.DATABASE_PATH || './data/trading.db',
  },

  trading: {
    defaultRiskPercent: parseFloat(process.env.DEFAULT_RISK_PERCENT || '0.75'),
    maxDailyTrades: parseInt(process.env.MAX_DAILY_TRADES || '3', 10),
    dailyLossLimit: parseFloat(process.env.DAILY_LOSS_LIMIT || '-50'),
    dailyProfitLock: parseFloat(process.env.DAILY_PROFIT_LOCK || '100'),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
} as const;

export type Config = typeof config;
