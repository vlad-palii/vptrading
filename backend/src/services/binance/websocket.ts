import { WebsocketClient, WsFormattedMessage } from 'binance';
import { EventEmitter } from 'events';
import { TRADING_PAIR, CHART_TIMEFRAMES, HTF_TIMEFRAME } from '../../config/constants.js';
import { createLogger } from '../../utils/logger.js';
import type { Candle, PriceUpdate } from '../../types/market.js';

const logger = createLogger('BinanceWebSocket');

interface BinanceWebSocketEvents {
  price: (data: PriceUpdate) => void;
  candle: (timeframe: string, candle: Candle) => void;
  connected: () => void;
  disconnected: () => void;
  reconnecting: () => void;
  error: (error: Error) => void;
}

export class BinanceWebSocket extends EventEmitter {
  private wsClient: WebsocketClient;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;

  constructor() {
    super();

    // Always use production WebSocket for market data streams
    // They are public and don't require authentication
    // Testnet is only used for REST API (orders, account info)
    this.wsClient = new WebsocketClient({
      beautify: true,
      // No wsUrl = uses production wss://stream.binance.com:9443
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.wsClient.on('open', (data) => {
      logger.info('WebSocket connection opened', { wsKey: data.wsKey });
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.wsClient.on('formattedMessage', (data: WsFormattedMessage) => {
      this.handleMessage(data);
    });

    this.wsClient.on('error', (error) => {
      logger.error('WebSocket error', error);
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
    });

    this.wsClient.on('reconnecting', (data) => {
      this.reconnectAttempts++;
      logger.warn('WebSocket reconnecting', {
        wsKey: data?.wsKey,
        attempt: this.reconnectAttempts,
      });
      this.isConnected = false;
      this.emit('reconnecting');
    });

    this.wsClient.on('reconnected', (data) => {
      logger.info('WebSocket reconnected', { wsKey: data?.wsKey });
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.wsClient.on('close', (data) => {
      logger.warn('WebSocket closed', { wsKey: data?.wsKey });
      this.isConnected = false;
      this.emit('disconnected');
    });
  }

  private handleMessage(data: WsFormattedMessage): void {
    // Handle 24hr ticker updates
    if ('eventType' in data && data.eventType === '24hrTicker') {
      // Use type assertion with unknown first for safety
      const tickerData = data as unknown as {
        eventType: string;
        eventTime: number;
        symbol: string;
        priceChange: string | number;
        priceChangePercent: string | number;
        lastPrice: string | number;
        highPrice: string | number;
        lowPrice: string | number;
        volume: string | number;
        quoteVolume: string | number;
      };

      if (tickerData.symbol === TRADING_PAIR.symbol) {
        const priceUpdate: PriceUpdate = {
          symbol: tickerData.symbol,
          price: parseFloat(String(tickerData.lastPrice)),
          priceChange: parseFloat(String(tickerData.priceChange)),
          priceChangePercent: parseFloat(String(tickerData.priceChangePercent)),
          high24h: parseFloat(String(tickerData.highPrice)),
          low24h: parseFloat(String(tickerData.lowPrice)),
          volume24h: parseFloat(String(tickerData.volume)),
          quoteVolume24h: parseFloat(String(tickerData.quoteVolume)),
          timestamp: tickerData.eventTime,
        };
        this.emit('price', priceUpdate);
      }
    }

    // Handle kline/candlestick updates
    if ('eventType' in data && data.eventType === 'kline') {
      // Use type assertion with unknown first for safety
      const klineData = data as unknown as {
        eventType: string;
        eventTime: number;
        symbol: string;
        kline: {
          startTime: number;
          endTime: number;
          interval: string;
          open: string | number;
          close: string | number;
          high: string | number;
          low: string | number;
          volume: string | number;
          quoteVolume: string | number;
          trades: number;
          final: boolean;
        };
      };

      if (klineData.symbol === TRADING_PAIR.symbol) {
        const candle: Candle = {
          openTime: klineData.kline.startTime,
          closeTime: klineData.kline.endTime,
          open: parseFloat(String(klineData.kline.open)),
          high: parseFloat(String(klineData.kline.high)),
          low: parseFloat(String(klineData.kline.low)),
          close: parseFloat(String(klineData.kline.close)),
          volume: parseFloat(String(klineData.kline.volume)),
          quoteVolume: parseFloat(String(klineData.kline.quoteVolume)),
          tradeCount: klineData.kline.trades,
          isClosed: klineData.kline.final,
        };
        this.emit('candle', klineData.kline.interval, candle);
      }
    }
  }

  connect(): void {
    logger.info('Connecting to Binance WebSocket streams...');

    // Subscribe to 24hr ticker for real-time price
    this.wsClient.subscribeSymbol24hrTicker(TRADING_PAIR.symbol, 'spot');

    // Subscribe to klines for chart timeframes
    for (const timeframe of CHART_TIMEFRAMES) {
      this.wsClient.subscribeKlines(TRADING_PAIR.symbol, timeframe, 'spot');
      logger.info(`Subscribed to ${timeframe} klines`);
    }

    // Subscribe to higher timeframe for bias detection
    this.wsClient.subscribeKlines(TRADING_PAIR.symbol, HTF_TIMEFRAME, 'spot');
    logger.info(`Subscribed to ${HTF_TIMEFRAME} klines (HTF)`);
  }

  disconnect(): void {
    logger.info('Disconnecting from Binance WebSocket...');
    this.wsClient.closeAll();
    this.isConnected = false;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  // Type-safe event emitter methods
  override on<K extends keyof BinanceWebSocketEvents>(
    event: K,
    listener: BinanceWebSocketEvents[K]
  ): this {
    return super.on(event, listener);
  }

  override emit<K extends keyof BinanceWebSocketEvents>(
    event: K,
    ...args: Parameters<BinanceWebSocketEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }
}

export const binanceWebSocket = new BinanceWebSocket();
