import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useStore } from '../store';
import type { Timeframe } from '../types';

export function useChartData(timeframe: Timeframe) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const setCandles = useStore((s) => s.setCandles);

  // Get candles based on timeframe using individual selectors
  const candles5m = useStore((s) => s.candles5m);
  const candles15m = useStore((s) => s.candles15m);
  const candles1h = useStore((s) => s.candles1h);
  const candles = timeframe === '5m' ? candles5m : timeframe === '15m' ? candles15m : candles1h;

  useEffect(() => {
    let isMounted = true;

    async function loadCandles() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.getCandles(timeframe, 500);

        if (isMounted) {
          setCandles(timeframe, response.candles);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load candles');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCandles();

    return () => {
      isMounted = false;
    };
  }, [timeframe, setCandles]);

  return { candles, isLoading, error };
}
