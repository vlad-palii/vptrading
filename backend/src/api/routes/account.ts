import { Router, Request, Response } from 'express';
import { binanceClient } from '../../services/binance/client.js';
import { appState } from '../../state/appState.js';
import { config } from '../../config/index.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('AccountRoutes');
const router = Router();

/**
 * GET /api/v1/account/balance
 * Get current account balances (BNB and USDT)
 */
router.get('/balance', async (req: Request, res: Response): Promise<void> => {
  try {
    const accountInfo = await binanceClient.getAccountInfo();

    // Get current price - try appState first, fallback to direct API call
    let currentPrice = appState.getCurrentPrice();
    if (!currentPrice || currentPrice === 0) {
      currentPrice = await binanceClient.getCurrentPrice();
    }

    // Calculate total value in USDT
    const bnbValueInUsdt = accountInfo.balances.bnb.total * currentPrice;
    const totalValueUsdt = accountInfo.balances.usdt.total + bnbValueInUsdt;

    res.json({
      balances: {
        bnb: {
          free: accountInfo.balances.bnb.free,
          locked: accountInfo.balances.bnb.locked,
          total: accountInfo.balances.bnb.total,
          valueUsdt: bnbValueInUsdt,
        },
        usdt: {
          free: accountInfo.balances.usdt.free,
          locked: accountInfo.balances.usdt.locked,
          total: accountInfo.balances.usdt.total,
        },
      },
      totalValueUsdt,
      currentBnbPrice: currentPrice,
      permissions: {
        canTrade: accountInfo.canTrade,
        canWithdraw: accountInfo.canWithdraw,
        canDeposit: accountInfo.canDeposit,
      },
      isTestnet: config.binance.testnet,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Failed to get account balance', error);
    res.status(500).json({
      error: 'Failed to get account balance',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/account/info
 * Get full account information
 */
router.get('/info', async (req: Request, res: Response): Promise<void> => {
  try {
    const accountInfo = await binanceClient.getAccountInfo();

    res.json({
      canTrade: accountInfo.canTrade,
      canWithdraw: accountInfo.canWithdraw,
      canDeposit: accountInfo.canDeposit,
      balances: accountInfo.balances,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Failed to get account info', error);
    res.status(500).json({
      error: 'Failed to get account info',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/account/orders
 * Get open orders
 */
router.get('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await binanceClient.getOpenOrders();

    res.json({
      orders,
      count: orders.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Failed to get open orders', error);
    res.status(500).json({
      error: 'Failed to get open orders',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
