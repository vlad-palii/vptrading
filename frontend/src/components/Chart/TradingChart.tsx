import { useEffect, useRef, useCallback } from 'react';
import {
  createChart,
  ColorType,
  CrosshairMode,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  HistogramData,
  Time,
} from 'lightweight-charts';
import { useChartData } from '../../hooks/useChartData';
import { useStore } from '../../store';
import { ChartControls } from './ChartControls';
import styles from './TradingChart.module.css';

export function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const vwapSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  // Track if initial data has been loaded (for fitContent)
  const isInitialLoadRef = useRef(true);
  // Track the last candle count to detect new candles vs updates
  const lastCandleCountRef = useRef(0);

  const timeframe = useStore((s) => s.selectedTimeframe);
  const { candles, isLoading, error } = useChartData(timeframe);

  // Get realtime candles based on selected timeframe
  const candles5m = useStore((s) => s.candles5m);
  const candles15m = useStore((s) => s.candles15m);
  const candles1h = useStore((s) => s.candles1h);
  const realtimeCandles = timeframe === '5m' ? candles5m : timeframe === '15m' ? candles15m : candles1h;

  // Reset refs when timeframe changes to trigger fitContent
  useEffect(() => {
    isInitialLoadRef.current = true;
    lastCandleCountRef.current = 0;
  }, [timeframe]);

  // Create chart on mount
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#a0a0a0',
      },
      grid: {
        vertLines: { color: '#1e1e1e' },
        horzLines: { color: '#1e1e1e' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: '#404040',
          width: 1,
          style: 2,
          labelBackgroundColor: '#2a2a2a',
        },
        horzLine: {
          color: '#404040',
          width: 1,
          style: 2,
          labelBackgroundColor: '#2a2a2a',
        },
      },
      rightPriceScale: {
        borderColor: '#2a2a2a',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: '#2a2a2a',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    });

    // Candlestick series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    // EMA 20 line
    const ema20Series = chart.addLineSeries({
      color: '#3b82f6',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    // EMA 50 line
    const ema50Series = chart.addLineSeries({
      color: '#f59e0b',
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    // VWAP line
    const vwapSeries = chart.addLineSeries({
      color: '#a855f7',
      lineWidth: 1,
      lineStyle: 2, // Dashed
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    // Volume histogram
    const volumeSeries = chart.addHistogramSeries({
      color: '#404040',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    ema20SeriesRef.current = ema20Series;
    ema50SeriesRef.current = ema50Series;
    vwapSeriesRef.current = vwapSeries;
    volumeSeriesRef.current = volumeSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      ema20SeriesRef.current = null;
      ema50SeriesRef.current = null;
      vwapSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  // Update chart data when candles change
  useEffect(() => {
    const dataToUse = realtimeCandles.length > 0 ? realtimeCandles : candles;

    if (!dataToUse.length) return;

    const currentCandleCount = dataToUse.length;
    const isNewData = lastCandleCountRef.current === 0;
    const hasNewCandle = currentCandleCount > lastCandleCountRef.current;

    // Convert candles to chart data format
    const candleData: CandlestickData<Time>[] = dataToUse.map((c) => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const ema20Data: LineData<Time>[] = dataToUse
      .filter((c) => c.ema20 !== undefined)
      .map((c) => ({
        time: c.time as Time,
        value: c.ema20!,
      }));

    const ema50Data: LineData<Time>[] = dataToUse
      .filter((c) => c.ema50 !== undefined)
      .map((c) => ({
        time: c.time as Time,
        value: c.ema50!,
      }));

    const vwapData: LineData<Time>[] = dataToUse
      .filter((c) => c.vwap !== undefined)
      .map((c) => ({
        time: c.time as Time,
        value: c.vwap!,
      }));

    const volumeData: HistogramData<Time>[] = dataToUse.map((c) => ({
      time: c.time as Time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)',
    }));

    // For initial load or when timeframe changes, set all data
    if (isNewData || isInitialLoadRef.current) {
      candleSeriesRef.current?.setData(candleData);
      ema20SeriesRef.current?.setData(ema20Data);
      ema50SeriesRef.current?.setData(ema50Data);
      vwapSeriesRef.current?.setData(vwapData);
      volumeSeriesRef.current?.setData(volumeData);

      // Only fit content on very first load
      if (isInitialLoadRef.current) {
        chartRef.current?.timeScale().fitContent();
        isInitialLoadRef.current = false;
      }
    } else {
      // For real-time updates, only update the last candle
      const lastCandle = candleData[candleData.length - 1];
      const lastEma20 = ema20Data[ema20Data.length - 1];
      const lastEma50 = ema50Data[ema50Data.length - 1];
      const lastVwap = vwapData[vwapData.length - 1];
      const lastVolume = volumeData[volumeData.length - 1];

      if (lastCandle) candleSeriesRef.current?.update(lastCandle);
      if (lastEma20) ema20SeriesRef.current?.update(lastEma20);
      if (lastEma50) ema50SeriesRef.current?.update(lastEma50);
      if (lastVwap) vwapSeriesRef.current?.update(lastVwap);
      if (lastVolume) volumeSeriesRef.current?.update(lastVolume);

      // If a new candle was added (not just updated), we might need to add it
      if (hasNewCandle && candleData.length > 1) {
        // Set all data when new candle appears to ensure it's added
        candleSeriesRef.current?.setData(candleData);
        ema20SeriesRef.current?.setData(ema20Data);
        ema50SeriesRef.current?.setData(ema50Data);
        vwapSeriesRef.current?.setData(vwapData);
        volumeSeriesRef.current?.setData(volumeData);
      }
    }

    lastCandleCountRef.current = currentCandleCount;
  }, [candles, realtimeCandles]);

  return (
    <div className={styles.container}>
      <ChartControls />
      <div className={styles.chartWrapper}>
        {isLoading && <div className={styles.loading}>Loading chart data...</div>}
        {error && <div className={styles.error}>{error}</div>}
        <div ref={chartContainerRef} className={styles.chart} />
      </div>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: '#3b82f6' }} />
          EMA 20
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: '#f59e0b' }} />
          EMA 50
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ backgroundColor: '#a855f7' }} />
          VWAP
        </span>
      </div>
    </div>
  );
}
