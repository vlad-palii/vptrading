import styles from './DailyPnL.module.css';

interface DailyPnLProps {
  pnl: number;
}

export function DailyPnL({ pnl }: DailyPnLProps) {
  const isPositive = pnl >= 0;

  return (
    <div className={styles.container}>
      <span className={styles.label}>Daily P&L</span>
      <span className={`${styles.value} ${isPositive ? styles.positive : styles.negative}`}>
        {isPositive ? '+' : ''}${pnl.toFixed(2)}
      </span>
    </div>
  );
}
