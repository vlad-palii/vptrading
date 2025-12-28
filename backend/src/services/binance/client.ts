import { MainClient } from 'binance';
import { config } from '../../config/index.js';
import { TRADING_PAIR } from '../../config/constants.js';
import { createLogger } from '../../utils/logger.js';
import type { AccountBalance, AccountInfo } from '../../types/trading.js';
import type { Candle } from '../../types/market.js';

const logger = createLogger('BinanceClient');

export class BinanceClient {
  // Public client - always uses production for market data
  private publicClient: MainClient;
  // Trading client - uses testnet or production based on config
  private tradingClient: MainClient;

  constructor() {
    // Public market data - always use production (no API key needed)
    this.publicClient = new MainClient({});

    // Trading operations - use testnet if configured
    this.tradingClient = new MainClient({
      api_key: config.binance.apiKey,
      api_secret: config.binance.apiSecret,
      baseUrl: config.binance.testnet
        ? 'https://testnet.binance.vision'
        : undefined,
    });

    logger.info('Binance REST clients initialized', {
      marketData: 'production',
      trading: config.binance.testnet ? 'testnet' : 'production',
      symbol: TRADING_PAIR.symbol,
    });
  }

  // ==================== Public Market Data (Production) ====================

  async getCurrentPrice(): Promise<number> {
    try {
      const ticker = await this.publicClient.getSymbolPriceTicker({
        symbol: TRADING_PAIR.symbol,
      });

      if (Array.isArray(ticker)) {
        throw new Error('Unexpected array response');
      }

      return parseFloat(String(ticker.price));
    } catch (error) {
      logger.error('Failed to get current price', error);
      throw error;
    }
  }

  async get24hrTicker(): Promise<{
    price: number;
    priceChange: number;
    priceChangePercent: number;
    high: number;
    low: number;
    volume: number;
    quoteVolume: number;
  }> {
    try {
      const ticker = await this.publicClient.get24hrChangeStatististics({
        symbol: TRADING_PAIR.symbol,
        type: 'FULL',
      });

      if (Array.isArray(ticker)) {
        throw new Error('Unexpected array response');
      }

      // Type assertion for full ticker response
      const fullTicker = ticker as {
        lastPrice: string | number;
        priceChange: string | number;
        priceChangePercent: string | number;
        highPrice: string | number;
        lowPrice: string | number;
        volume: string | number;
        quoteVolume: string | number;
      };

      return {
        price: parseFloat(String(fullTicker.lastPrice)),
        priceChange: parseFloat(String(fullTicker.priceChange)),
        priceChangePercent: parseFloat(String(fullTicker.priceChangePercent)),
        high: parseFloat(String(fullTicker.highPrice)),
        low: parseFloat(String(fullTicker.lowPrice)),
        volume: parseFloat(String(fullTicker.volume)),
        quoteVolume: parseFloat(String(fullTicker.quoteVolume)),
      };
    } catch (error) {
      logger.error('Failed to get 24hr ticker', error);
      throw error;
    }
  }

  async getKlines(
    interval: string,
    limit: number = 500
  ): Promise<Candle[]> {
    try {
      const klines = await this.publicClient.getKlines({
        symbol: TRADING_PAIR.symbol,
        interval: interval as '1m' | '5m' | '15m' | '1h' | '4h' | '1d',
        limit,
      });

      return klines.map((k) => ({
        openTime: k[0] as number,
        open: parseFloat(k[1] as string),
        high: parseFloat(k[2] as string),
        low: parseFloat(k[3] as string),
        close: parseFloat(k[4] as string),
        volume: parseFloat(k[5] as string),
        closeTime: k[6] as number,
        quoteVolume: parseFloat(k[7] as string),
        tradeCount: k[8] as number,
        isClosed: true,
      }));
    } catch (error) {
      logger.error('Failed to get klines', error);
      throw error;
    }
  }

  // ==================== Authenticated Trading (Testnet/Production) ====================

  async getAccountInfo(): Promise<AccountInfo> {
    try {
      const account = await this.tradingClient.getAccountInformation();

      const findBalance = (asset: string): AccountBalance => {
        const balance = account.balances.find(b => b.asset === asset);
        const free = parseFloat(String(balance?.free ?? '0'));
        const locked = parseFloat(String(balance?.locked ?? '0'));
        return {
          asset,
          free,
          locked,
          total: free + locked,
        };
      };

      return {
        balances: {
          bnb: findBalance('BNB'),
          usdt: findBalance('USDT'),
        },
        canTrade: account.canTrade,
        canWithdraw: account.canWithdraw,
        canDeposit: account.canDeposit,
      };
    } catch (error) {
      logger.error('Failed to get account info', error);
      throw error;
    }
  }

  async placeMarketOrder(
    side: 'BUY' | 'SELL',
    quantity: number
  ): Promise<{
    orderId: number;
    clientOrderId: string;
    executedQty: number;
    cummulativeQuoteQty: number;
    status: string;
    fills: Array<{ price: number; qty: number; commission: number }>;
  }> {
    try {
      const order = await this.tradingClient.submitNewOrder({
        symbol: TRADING_PAIR.symbol,
        side,
        type: 'MARKET',
        quantity: parseFloat(quantity.toFixed(TRADING_PAIR.quantityPrecision)),
      });

      logger.info('Market order placed', {
        orderId: order.orderId,
        side,
        quantity,
        status: order.status,
      });

      return {
        orderId: order.orderId,
        clientOrderId: order.clientOrderId,
        executedQty: parseFloat(String(order.executedQty)),
        cummulativeQuoteQty: parseFloat(String(order.cummulativeQuoteQty)),
        status: order.status,
        fills: (order.fills ?? []).map(f => ({
          price: parseFloat(String(f.price)),
          qty: parseFloat(String(f.qty)),
          commission: parseFloat(String(f.commission)),
        })),
      };
    } catch (error) {
      logger.error('Failed to place market order', error);
      throw error;
    }
  }

  async placeOCOOrder(
    side: 'BUY' | 'SELL',
    quantity: number,
    price: number,
    stopPrice: number,
    stopLimitPrice: number
  ): Promise<{
    orderListId: number;
    orders: Array<{ orderId: number; clientOrderId: string }>;
  }> {
    try {
      const order = await this.tradingClient.submitNewOCO({
        symbol: TRADING_PAIR.symbol,
        side,
        quantity: parseFloat(quantity.toFixed(TRADING_PAIR.quantityPrecision)),
        price: parseFloat(price.toFixed(TRADING_PAIR.pricePrecision)),
        stopPrice: parseFloat(stopPrice.toFixed(TRADING_PAIR.pricePrecision)),
        stopLimitPrice: parseFloat(stopLimitPrice.toFixed(TRADING_PAIR.pricePrecision)),
        stopLimitTimeInForce: 'GTC',
      });

      logger.info('OCO order placed', {
        orderListId: order.orderListId,
        side,
        quantity,
      });

      return {
        orderListId: order.orderListId,
        orders: order.orders.map((o: { orderId: number; clientOrderId: string }) => ({
          orderId: o.orderId,
          clientOrderId: o.clientOrderId,
        })),
      };
    } catch (error) {
      logger.error('Failed to place OCO order', error);
      throw error;
    }
  }

  async cancelOrder(orderId: number): Promise<void> {
    try {
      await this.tradingClient.cancelOrder({
        symbol: TRADING_PAIR.symbol,
        orderId,
      });
      logger.info('Order cancelled', { orderId });
    } catch (error) {
      logger.error('Failed to cancel order', error);
      throw error;
    }
  }

  async getOpenOrders(): Promise<Array<{
    orderId: number;
    clientOrderId: string;
    side: string;
    type: string;
    status: string;
    price: number;
    origQty: number;
    executedQty: number;
  }>> {
    try {
      const orders = await this.tradingClient.getOpenOrders({
        symbol: TRADING_PAIR.symbol,
      });

      return orders.map(o => ({
        orderId: o.orderId,
        clientOrderId: o.clientOrderId,
        side: o.side,
        type: o.type,
        status: o.status,
        price: parseFloat(String(o.price)),
        origQty: parseFloat(String(o.origQty)),
        executedQty: parseFloat(String(o.executedQty)),
      }));
    } catch (error) {
      logger.error('Failed to get open orders', error);
      throw error;
    }
  }

  getPublicClient(): MainClient {
    return this.publicClient;
  }

  getTradingClient(): MainClient {
    return this.tradingClient;
  }
}

export const binanceClient = new BinanceClient();
