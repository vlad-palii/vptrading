import { WebSocketServer, WebSocket } from 'ws';
import { config } from '../config/index.js';
import { appState } from '../state/appState.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('WebSocketServer');

type MessageType =
  | 'PRICE_UPDATE'
  | 'CANDLE_UPDATE'
  | 'INDICATORS_UPDATE'
  | 'VOLATILITY_UPDATE'
  | 'AI_UPDATE'
  | 'POSITION_UPDATE'
  | 'RISK_UPDATE'
  | 'STATE_UPDATE'
  | 'CONNECTION_STATUS';

interface WSMessage {
  type: MessageType;
  data: unknown;
  timestamp: number;
}

class FrontendWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private pingInterval: NodeJS.Timeout | null = null;

  start(): void {
    this.wss = new WebSocketServer({
      port: config.wsPort,
      path: '/ws',
    });

    this.wss.on('connection', (ws, req) => {
      const clientIp = req.socket.remoteAddress;
      logger.info('Client connected', { ip: clientIp });

      this.clients.add(ws);

      // Send initial state
      this.sendToClient(ws, 'STATE_UPDATE', appState.getFullState());

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          logger.error('Failed to parse client message', error);
        }
      });

      ws.on('close', () => {
        logger.info('Client disconnected', { ip: clientIp });
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket client error', error);
        this.clients.delete(ws);
      });

      ws.on('pong', () => {
        // Client is alive
      });
    });

    this.wss.on('error', (error) => {
      logger.error('WebSocket server error', error);
    });

    // Setup app state listeners
    this.setupStateListeners();

    // Start ping interval to keep connections alive
    this.pingInterval = setInterval(() => {
      this.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      });
    }, 30000);

    logger.info('WebSocket server started', { port: config.wsPort });
  }

  private setupStateListeners(): void {
    appState.on('priceUpdate', (data) => {
      this.broadcast('PRICE_UPDATE', {
        price: data.price,
        priceChange24h: data.priceChange,
        priceChangePercent24h: data.priceChangePercent,
      });
    });

    appState.on('candleUpdate', (timeframe, candle) => {
      this.broadcast('CANDLE_UPDATE', {
        timeframe,
        candle: {
          time: candle.openTime / 1000,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          ema20: candle.ema20,
          ema50: candle.ema50,
          vwap: candle.vwap,
        },
      });
    });

    appState.on('indicatorsUpdate', (indicators) => {
      this.broadcast('INDICATORS_UPDATE', indicators);
    });

    appState.on('volatilityUpdate', (state) => {
      this.broadcast('VOLATILITY_UPDATE', { state });
    });

    appState.on('aiUpdate', (classification) => {
      this.broadcast('AI_UPDATE', {
        state: classification.state,
        confidence: classification.confidence,
        gatekeeperActive: classification.gatekeeperActive,
        overrideReason: classification.overrideReason,
      });
    });

    appState.on('positionUpdate', (position) => {
      this.broadcast('POSITION_UPDATE', { position });
    });

    appState.on('dailyStatsUpdate', (stats) => {
      this.broadcast('RISK_UPDATE', {
        dailyPnl: stats.realizedPnl / 100,  // Convert cents to dollars
        tradeCount: stats.tradeCount,
        maxTrades: stats.maxTradesAllowed,
        isLocked: stats.isLocked,
        lockReason: stats.lockReason,
      });
    });
  }

  private handleClientMessage(ws: WebSocket, data: { type: string; payload?: unknown }): void {
    switch (data.type) {
      case 'PING':
        this.sendToClient(ws, 'CONNECTION_STATUS', { status: 'connected' });
        break;

      case 'GET_STATE':
        this.sendToClient(ws, 'STATE_UPDATE', appState.getFullState());
        break;

      default:
        logger.warn('Unknown client message type', { type: data.type });
    }
  }

  private sendToClient(ws: WebSocket, type: MessageType, data: unknown): void {
    if (ws.readyState === WebSocket.OPEN) {
      const message: WSMessage = {
        type,
        data,
        timestamp: Date.now(),
      };
      ws.send(JSON.stringify(message));
    }
  }

  broadcast(type: MessageType, data: unknown): void {
    const message: WSMessage = {
      type,
      data,
      timestamp: Date.now(),
    };
    const messageStr = JSON.stringify(message);

    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  getClientCount(): number {
    return this.clients.size;
  }

  stop(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    this.clients.forEach((ws) => {
      ws.close();
    });
    this.clients.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    logger.info('WebSocket server stopped');
  }
}

export const frontendWS = new FrontendWebSocketServer();
