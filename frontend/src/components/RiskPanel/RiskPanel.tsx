import { useStore } from '../../store';
import { DailyPnL } from './DailyPnL';
import { TradeCounter } from './TradeCounter';
import { LockStatus } from './LockStatus';
import styles from './RiskPanel.module.css';

export function RiskPanel() {
  const dailyPnl = useStore((s) => s.dailyPnl);
  const tradeCount = useStore((s) => s.tradeCount);
  const maxTrades = useStore((s) => s.maxTrades);
  const isLocked = useStore((s) => s.isLocked);
  const lockReason = useStore((s) => s.lockReason);
  const position = useStore((s) => s.position);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>RISK</span>
      </div>

      <DailyPnL pnl={dailyPnl} />

      <TradeCounter
        current={tradeCount}
        max={maxTrades}
      />

      {isLocked && (
        <LockStatus reason={lockReason || 'Trading locked'} />
      )}

      {position && (
        <div className={styles.positionInfo}>
          <div className={styles.positionHeader}>
            <span className={styles.positionLabel}>Open Position</span>
            <span className={`${styles.positionSide} ${position.side === 'BUY' ? styles.long : styles.short}`}>
              {position.side === 'BUY' ? 'LONG' : 'SHORT'}
            </span>
          </div>
          <div className={styles.positionDetails}>
            <div className={styles.positionRow}>
              <span>Entry</span>
              <span>${position.entryPrice.toFixed(2)}</span>
            </div>
            <div className={styles.positionRow}>
              <span>Current</span>
              <span>${position.currentPrice.toFixed(2)}</span>
            </div>
            <div className={styles.positionRow}>
              <span>P&L</span>
              <span className={position.unrealizedPnl >= 0 ? styles.positive : styles.negative}>
                ${position.unrealizedPnl.toFixed(2)} ({position.currentRMultiple.toFixed(2)}R)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
