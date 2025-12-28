import styles from './TradeCounter.module.css';

interface TradeCounterProps {
  current: number;
  max: number;
}

export function TradeCounter({ current, max }: TradeCounterProps) {
  const remaining = max - current;
  const isNearLimit = remaining <= 1;

  return (
    <div className={styles.container}>
      <span className={styles.label}>Trades Today</span>
      <div className={styles.counter}>
        <span className={`${styles.current} ${isNearLimit ? styles.warning : ''}`}>
          {current}
        </span>
        <span className={styles.separator}>/</span>
        <span className={styles.max}>{max}</span>
      </div>
    </div>
  );
}
