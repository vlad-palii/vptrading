import { EventEmitter } from 'events';
import type { Candle, CandleWithIndicators, Indicators, PriceUpdate } from '../types/market.js';
import type { Position, DailyStats } from '../types/trading.js';
import type { AIClassification } from '../types/ai.js';
import type { Timeframe, VolatilityState, AIState } from '../config/constants.js';
import { CHART_TIMEFRAMES, HTF_TIMEFRAME, CANDLE_LIMITS } from '../config/constants.js';
import { enrichCandlesWithIndicators, calculateAllIndicators } from '../services/indicators/index.js';
import { analyzeVolatility } from '../services/volatility/detector.js';
import { analyzeChoppiness } from '../services/volatility/chopDetector.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('AppState');

interface AppStateEvents {
  priceUpdate: (price: PriceUpdate) => void;
  candleUpdate: (timeframe: Timeframe, candle: CandleWithIndicators) => void;
  indicatorsUpdate: (indicators: Indicators) => void;
  volatilityUpdate: (state: VolatilityState) => void;
  aiUpdate: (classification: AIClassification) => void;
  positionUpdate: (position: Position | null) => void;
  dailyStatsUpdate: (stats: DailyStats) => void;
  stateChange: () => void;
}

class AppState extends EventEmitter {
  // Market data
  private currentPrice: number = 0;
  private priceChange24h: number = 0;
  private priceChangePercent24h: number = 0;
  private candles: Map<Timeframe, CandleWithIndicators[]> = new Map();
  private indicators: Indicators | null = null;
  private volatilityState: VolatilityState = 'LOW';

  // AI state
  private aiState: AIState = 'NO_TRADE';
  private aiConfidence: number = 0;
  private gatekeeperActive: boolean = true;
  private gatekeeperReason: string | null = 'Initializing...';

  // Trading state
  private currentPosition: Position | null = null;
  private dailyStats: DailyStats | null = null;
  private isLocked: boolean = false;
  private lockReason: string | null = null;

  // Connection state
  private isConnected: boolean = false;
  private lastUpdate: number = 0;

  constructor() {
    super();

    // Initialize candle arrays for each timeframe
    for (const tf of [...CHART_TIMEFRAMES, HTF_TIMEFRAME]) {
      this.candles.set(tf, []);
    }
  }

  // ==================== Getters ====================

  getCurrentPrice(): number {
    return this.currentPrice;
  }

  getPriceChange24h(): { change: number; percent: number } {
    return {
      change: this.priceChange24h,
      percent: this.priceChangePercent24h,
    };
  }

  getCandles(timeframe: Timeframe): CandleWithIndicators[] {
    return this.candles.get(timeframe) ?? [];
  }

  getIndicators(): Indicators | null {
    return this.indicators;
  }

  getVolatilityState(): VolatilityState {
    return this.volatilityState;
  }

  getAIState(): { state: AIState; confidence: number; gatekeeperActive: boolean; reason: string | null } {
    return {
      state: this.aiState,
      confidence: this.aiConfidence,
      gatekeeperActive: this.gatekeeperActive,
      reason: this.gatekeeperReason,
    };
  }

  getCurrentPosition(): Position | null {
    return this.currentPosition;
  }

  getDailyStats(): DailyStats | null {
    return this.dailyStats;
  }

  isTradeAllowed(): boolean {
    return !this.isLocked && !this.gatekeeperActive && this.aiState !== 'NO_TRADE';
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getLastUpdate(): number {
    return this.lastUpdate;
  }

  // ==================== Setters / Updates ====================

  updatePrice(update: PriceUpdate): void {
    this.currentPrice = update.price;
    this.priceChange24h = update.priceChange;
    this.priceChangePercent24h = update.priceChangePercent;
    this.lastUpdate = update.timestamp;
    this.emit('priceUpdate', update);
  }

  updateCandle(timeframe: string, candle: Candle): void {
    const tf = timeframe as Timeframe;
    const candles = this.candles.get(tf);

    if (!candles) {
      logger.warn('Unknown timeframe', { timeframe });
      return;
    }

    // Find and update or add candle
    const existingIndex = candles.findIndex(c => c.openTime === candle.openTime);

    if (existingIndex >= 0) {
      // Update existing candle
      candles[existingIndex] = candle;
    } else {
      // Add new candle
      candles.push(candle);

      // Keep only last N candles
      if (candles.length > CANDLE_LIMITS.maxStored) {
        candles.shift();
      }
    }

    // Recalculate indicators for chart timeframes
    if (CHART_TIMEFRAMES.includes(tf as any)) {
      const enriched = enrichCandlesWithIndicators(candles);
      this.candles.set(tf, enriched);

      // Update main indicators from 5m timeframe
      if (tf === '5m') {
        this.indicators = calculateAllIndicators(candles);
        if (this.indicators) {
          this.emit('indicatorsUpdate', this.indicators);
        }

        // Update volatility analysis
        this.updateVolatilityAnalysis(candles);
      }

      const lastCandle = enriched[enriched.length - 1];
      if (lastCandle) {
        this.emit('candleUpdate', tf, lastCandle);
      }
    }

    this.emit('stateChange');
  }

  setCandles(timeframe: Timeframe, candles: Candle[]): void {
    const enriched = enrichCandlesWithIndicators(candles);
    this.candles.set(timeframe, enriched);

    if (timeframe === '5m') {
      this.indicators = calculateAllIndicators(candles);
      this.updateVolatilityAnalysis(candles);
    }

    logger.info('Candles loaded', { timeframe, count: candles.length });
    this.emit('stateChange');
  }

  private updateVolatilityAnalysis(candles: Candle[]): void {
    const volatility = analyzeVolatility(candles);
    const chop = analyzeChoppiness(candles);

    const previousState = this.volatilityState;
    this.volatilityState = volatility.state;

    // Update gatekeeper based on volatility and chop
    if (volatility.isLow) {
      this.gatekeeperActive = true;
      this.gatekeeperReason = volatility.details;
    } else if (chop.isChoppy) {
      this.gatekeeperActive = true;
      this.gatekeeperReason = chop.details;
    } else {
      this.gatekeeperActive = false;
      this.gatekeeperReason = null;
    }

    if (this.volatilityState !== previousState) {
      logger.info('Volatility state changed', {
        from: previousState,
        to: this.volatilityState,
      });
      this.emit('volatilityUpdate', this.volatilityState);
    }

    // Update indicators with chop values
    if (this.indicators) {
      this.indicators.adx = chop.adx;
      this.indicators.chopIndex = chop.chopIndex;
    }
  }

  updateAIClassification(state: AIState, confidence: number): void {
    this.aiState = state;
    this.aiConfidence = confidence;

    const classification: AIClassification = {
      state,
      confidence,
      features: {
        ema20Slope: 0,
        ema50Slope: 0,
        emaSpread: 0,
        atrNormalized: 0,
        bbWidthNormalized: 0,
        volatilityExpansion: 0,
        volumeDelta: 0,
        volumeSmaRatio: 0,
        vwapDistance: 0,
        vwapDistanceAtr: 0,
        htfEmaBias: 0,
        htfTrend: 0,
        adx: this.indicators?.adx ?? 0,
        chopIndex: this.indicators?.chopIndex ?? 0,
      },
      gatekeeperActive: this.gatekeeperActive,
      overrideReason: this.gatekeeperReason ?? undefined,
      timestamp: Date.now(),
    };

    this.emit('aiUpdate', classification);
    this.emit('stateChange');
  }

  updatePosition(position: Position | null): void {
    this.currentPosition = position;
    this.emit('positionUpdate', position);
    this.emit('stateChange');
  }

  updateDailyStats(stats: DailyStats): void {
    this.dailyStats = stats;
    this.isLocked = stats.isLocked;
    this.lockReason = stats.lockReason ?? null;
    this.emit('dailyStatsUpdate', stats);
    this.emit('stateChange');
  }

  setConnectionStatus(connected: boolean): void {
    this.isConnected = connected;
    this.emit('stateChange');
  }

  // ==================== Full State Export ====================

  getFullState(): {
    price: { current: number; change24h: number; changePercent24h: number };
    volatility: VolatilityState;
    indicators: Indicators | null;
    ai: { state: AIState; confidence: number; gatekeeperActive: boolean; reason: string | null };
    position: Position | null;
    dailyStats: DailyStats | null;
    isLocked: boolean;
    lockReason: string | null;
    isConnected: boolean;
    lastUpdate: number;
  } {
    return {
      price: {
        current: this.currentPrice,
        change24h: this.priceChange24h,
        changePercent24h: this.priceChangePercent24h,
      },
      volatility: this.volatilityState,
      indicators: this.indicators,
      ai: this.getAIState(),
      position: this.currentPosition,
      dailyStats: this.dailyStats,
      isLocked: this.isLocked,
      lockReason: this.lockReason,
      isConnected: this.isConnected,
      lastUpdate: this.lastUpdate,
    };
  }

  // Type-safe event methods
  override on<K extends keyof AppStateEvents>(
    event: K,
    listener: AppStateEvents[K]
  ): this {
    return super.on(event, listener);
  }

  override emit<K extends keyof AppStateEvents>(
    event: K,
    ...args: Parameters<AppStateEvents[K]>
  ): boolean {
    return super.emit(event, ...args);
  }
}

export const appState = new AppState();
