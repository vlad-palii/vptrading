-- BNB/USDT Trading Application Database Schema
-- All prices stored as integers (cents/satoshis) to avoid floating point issues

-- =====================================================
-- TRADES TABLE - Core trade history
-- =====================================================
CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Trade identification
    order_id TEXT UNIQUE NOT NULL,
    client_order_id TEXT,

    -- Trade details
    side TEXT NOT NULL CHECK(side IN ('BUY', 'SELL')),
    entry_price INTEGER NOT NULL,            -- Price in cents (x100)
    quantity INTEGER NOT NULL,               -- Quantity in satoshis (x100000000)
    executed_quantity INTEGER DEFAULT 0,

    -- Risk management
    stop_loss_price INTEGER,
    take_profit_price INTEGER,
    trailing_stop_active INTEGER DEFAULT 0,
    trailing_stop_distance INTEGER,

    -- Timestamps (Unix milliseconds)
    created_at INTEGER NOT NULL,
    executed_at INTEGER,
    closed_at INTEGER,

    -- Status
    status TEXT NOT NULL DEFAULT 'PENDING'
        CHECK(status IN ('PENDING', 'OPEN', 'FILLED', 'PARTIALLY_FILLED',
                         'CLOSED', 'CANCELLED', 'EXPIRED', 'REJECTED')),

    -- PnL tracking (in cents)
    realized_pnl INTEGER DEFAULT 0,
    fees INTEGER DEFAULT 0,

    -- AI context at time of trade
    ai_state TEXT CHECK(ai_state IN ('BULLISH', 'BEARISH', 'NO_TRADE') OR ai_state IS NULL),
    ai_confidence INTEGER,
    volatility_state TEXT CHECK(volatility_state IN ('HIGH', 'LOW') OR volatility_state IS NULL),

    -- Metadata
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);

-- =====================================================
-- DAILY_STATS TABLE - Daily performance tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    date TEXT NOT NULL UNIQUE,               -- YYYY-MM-DD format (UTC)

    -- Trade counts
    trade_count INTEGER DEFAULT 0,
    max_trades_allowed INTEGER DEFAULT 3,

    -- PnL tracking (in cents)
    realized_pnl INTEGER DEFAULT 0,
    unrealized_pnl INTEGER DEFAULT 0,
    fees_paid INTEGER DEFAULT 0,

    -- Limits (in cents)
    daily_loss_limit INTEGER DEFAULT -5000,  -- -$50.00
    daily_profit_lock INTEGER DEFAULT 10000, -- +$100.00

    -- Lock states
    is_locked INTEGER DEFAULT 0,
    lock_reason TEXT,
    locked_at INTEGER,

    -- Session info
    session_start INTEGER,
    session_end INTEGER,

    -- Statistics
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    largest_win INTEGER DEFAULT 0,
    largest_loss INTEGER DEFAULT 0,

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);

-- =====================================================
-- CANDLES TABLE - Price history cache
-- =====================================================
CREATE TABLE IF NOT EXISTS candles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    timeframe TEXT NOT NULL CHECK(timeframe IN ('1m', '5m', '15m', '1h', '4h', '1d')),

    open_time INTEGER NOT NULL,              -- Unix timestamp ms
    close_time INTEGER NOT NULL,

    open INTEGER NOT NULL,                   -- All prices in cents
    high INTEGER NOT NULL,
    low INTEGER NOT NULL,
    close INTEGER NOT NULL,

    volume INTEGER NOT NULL,                 -- Volume * 100000000
    quote_volume INTEGER NOT NULL,
    trade_count INTEGER,

    UNIQUE(timeframe, open_time)
);

CREATE INDEX IF NOT EXISTS idx_candles_timeframe_time ON candles(timeframe, open_time DESC);

-- =====================================================
-- POSITIONS TABLE - Current open positions
-- =====================================================
CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    trade_id INTEGER NOT NULL,

    side TEXT NOT NULL CHECK(side IN ('BUY', 'SELL')),
    entry_price INTEGER NOT NULL,
    current_price INTEGER,
    quantity INTEGER NOT NULL,

    -- Risk levels (in cents)
    stop_loss INTEGER NOT NULL,
    take_profit INTEGER NOT NULL,

    -- Trailing stop
    trailing_stop_price INTEGER,
    highest_price_since_entry INTEGER,

    -- R-multiple tracking (in cents)
    initial_risk INTEGER NOT NULL,

    status TEXT DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'CLOSED')),

    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,

    FOREIGN KEY (trade_id) REFERENCES trades(id)
);

CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);

-- =====================================================
-- AI_STATES TABLE - AI decision history
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    timestamp INTEGER NOT NULL,

    -- Classification
    state TEXT NOT NULL CHECK(state IN ('BULLISH', 'BEARISH', 'NO_TRADE')),
    confidence INTEGER NOT NULL CHECK(confidence >= 0 AND confidence <= 100),

    -- Key features at time of classification
    ema_slope REAL,
    volatility_expansion REAL,
    volume_delta REAL,
    vwap_distance REAL,
    htf_bias TEXT,
    adx REAL,
    chop_index REAL,

    -- Gatekeeper overrides
    gatekeeper_override INTEGER DEFAULT 0,
    override_reason TEXT,

    created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_states_timestamp ON ai_states(timestamp DESC);

-- =====================================================
-- APP_STATE TABLE - Persistent application state
-- =====================================================
CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Default application settings
INSERT OR IGNORE INTO app_state (key, value, updated_at) VALUES
    ('risk_percentage', '0.75', strftime('%s', 'now') * 1000),
    ('max_daily_trades', '3', strftime('%s', 'now') * 1000),
    ('daily_loss_limit', '-5000', strftime('%s', 'now') * 1000),
    ('daily_profit_lock', '10000', strftime('%s', 'now') * 1000),
    ('tp_r_multiple', '1.5', strftime('%s', 'now') * 1000),
    ('trailing_stop_activation_r', '1.0', strftime('%s', 'now') * 1000),
    ('trading_enabled', '1', strftime('%s', 'now') * 1000);
