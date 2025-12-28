import { useEffect, useCallback } from 'react';
import { wsService } from '../services/websocket';
import { useStore } from '../store';
import type { WSMessage, Timeframe, Candle, Indicators } from '../types';

export function useWebSocket() {
  const setPrice = useStore((s) => s.setPrice);
  const setVolatilityState = useStore((s) => s.setVolatilityState);
  const updateCandle = useStore((s) => s.updateCandle);
  const setIndicators = useStore((s) => s.setIndicators);
  const setAIState = useStore((s) => s.setAIState);
  const setPosition = useStore((s) => s.setPosition);
  const setRiskStats = useStore((s) => s.setRiskStats);
  const setLocked = useStore((s) => s.setLocked);
  const setConnected = useStore((s) => s.setConnected);
  const setReconnecting = useStore((s) => s.setReconnecting);
  const setLastUpdate = useStore((s) => s.setLastUpdate);

  const handleMessage = useCallback(
    (message: WSMessage) => {
      setLastUpdate(message.timestamp);

      switch (message.type) {
        case 'PRICE_UPDATE': {
          const data = message.data as {
            price: number;
            priceChange24h: number;
            priceChangePercent24h: number;
          };
          setPrice(data.price, data.priceChange24h, data.priceChangePercent24h);
          break;
        }

        case 'CANDLE_UPDATE': {
          const data = message.data as {
            timeframe: Timeframe;
            candle: Candle;
          };
          updateCandle(data.timeframe, data.candle);
          break;
        }

        case 'INDICATORS_UPDATE': {
          const data = message.data as Indicators;
          setIndicators(data);
          break;
        }

        case 'VOLATILITY_UPDATE': {
          const data = message.data as { state: 'HIGH' | 'LOW' };
          setVolatilityState(data.state);
          break;
        }

        case 'AI_UPDATE': {
          const data = message.data as {
            state: 'BULLISH' | 'BEARISH' | 'NO_TRADE';
            confidence: number;
            gatekeeperActive: boolean;
            overrideReason?: string;
          };
          setAIState(
            data.state,
            data.confidence,
            data.gatekeeperActive,
            data.overrideReason
          );
          break;
        }

        case 'POSITION_UPDATE': {
          const data = message.data as { position: any };
          setPosition(data.position);
          break;
        }

        case 'RISK_UPDATE': {
          const data = message.data as {
            dailyPnl: number;
            tradeCount: number;
            maxTrades: number;
            isLocked: boolean;
            lockReason?: string;
          };
          setRiskStats(data.dailyPnl, data.tradeCount, data.maxTrades);
          setLocked(data.isLocked, data.lockReason);
          break;
        }

        case 'STATE_UPDATE': {
          const data = message.data as {
            price: { current: number; change24h: number; changePercent24h: number };
            volatility: 'HIGH' | 'LOW';
            indicators: Indicators | null;
            ai: {
              state: 'BULLISH' | 'BEARISH' | 'NO_TRADE';
              confidence: number;
              gatekeeperActive: boolean;
              reason: string | null;
            };
            position: any;
            dailyStats: any;
            isLocked: boolean;
            lockReason: string | null;
          };

          setPrice(
            data.price.current,
            data.price.change24h,
            data.price.changePercent24h
          );
          setVolatilityState(data.volatility);
          if (data.indicators) {
            setIndicators(data.indicators);
          }
          setAIState(
            data.ai.state,
            data.ai.confidence,
            data.ai.gatekeeperActive,
            data.ai.reason ?? undefined
          );
          setPosition(data.position);
          if (data.dailyStats) {
            setRiskStats(
              data.dailyStats.realizedPnl / 100,
              data.dailyStats.tradeCount,
              data.dailyStats.maxTradesAllowed
            );
          }
          setLocked(data.isLocked, data.lockReason ?? undefined);
          break;
        }

        case 'CONNECTION_STATUS': {
          const data = message.data as { status: string };
          if (data.status === 'connected') {
            setConnected(true);
          } else if (data.status === 'disconnected') {
            setConnected(false);
          } else if (data.status === 'reconnecting') {
            setReconnecting(true);
          }
          break;
        }
      }
    },
    [
      setPrice,
      setVolatilityState,
      updateCandle,
      setIndicators,
      setAIState,
      setPosition,
      setRiskStats,
      setLocked,
      setConnected,
      setReconnecting,
      setLastUpdate,
    ]
  );

  useEffect(() => {
    // Connect to WebSocket
    wsService.connect();

    // Subscribe to messages
    const unsubscribe = wsService.subscribe(handleMessage);

    // Cleanup on unmount
    return () => {
      unsubscribe();
      wsService.disconnect();
    };
  }, [handleMessage]);

  return {
    isConnected: wsService.isConnected(),
    send: wsService.send.bind(wsService),
  };
}
