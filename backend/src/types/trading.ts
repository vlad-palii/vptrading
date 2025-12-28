import type { AIState, OrderStatus, VolatilityState } from '../config/constants.js';

export interface Position {
  id: number;
  tradeId: number;
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  side: 'BUY' | 'SELL';
  stopLoss: number;
  takeProfit: number;
  trailingStopPrice?: number;
  highestPriceSinceEntry: number;
  initialRisk: number;      // Entry - SL in price terms
  currentRMultiple: number;
  unrealizedPnl: number;
  status: 'OPEN' | 'CLOSED';
  createdAt: number;
  updatedAt: number;
}

export interface Trade {
  id: number;
  orderId: string;
  clientOrderId?: string;
  side: 'BUY' | 'SELL';
  entryPrice: number;
  quantity: number;
  executedQuantity: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  trailingStopActive: boolean;
  trailingStopDistance?: number;
  status: OrderStatus;
  realizedPnl: number;
  fees: number;
  aiState?: AIState;
  aiConfidence?: number;
  volatilityState?: VolatilityState;
  notes?: string;
  createdAt: number;
  executedAt?: number;
  closedAt?: number;
}

export interface Order {
  orderId: string;
  clientOrderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'STOP_LOSS_LIMIT' | 'TAKE_PROFIT_LIMIT';
  quantity: number;
  price?: number;
  stopPrice?: number;
  status: string;
  executedQty: number;
  cummulativeQuoteQty: number;
  timeInForce: string;
  createdAt: number;
  updatedAt: number;
}

export interface DailyStats {
  date: string;           // YYYY-MM-DD format
  tradeCount: number;
  maxTradesAllowed: number;
  realizedPnl: number;    // In USD
  unrealizedPnl: number;
  feesPaid: number;
  dailyLossLimit: number;
  dailyProfitLock: number;
  isLocked: boolean;
  lockReason?: string;
  lockedAt?: number;
  winningTrades: number;
  losingTrades: number;
  largestWin: number;
  largestLoss: number;
  sessionStart?: number;
  sessionEnd?: number;
  createdAt: number;
  updatedAt: number;
}

export interface AccountBalance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

export interface AccountInfo {
  balances: {
    bnb: AccountBalance;
    usdt: AccountBalance;
  };
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
}

export interface TradingState {
  isEnabled: boolean;
  isLocked: boolean;
  lockReason?: string;
  currentPosition?: Position;
  pendingOrders: Order[];
  dailyStats: DailyStats;
}

export interface BuyOrderRequest {
  riskPercent: number;    // 0.5, 1, or 2
  stopLossPrice?: number; // If not provided, will be calculated
}

export interface SellOrderRequest {
  quantity?: number;      // If not provided, closes full position
}
