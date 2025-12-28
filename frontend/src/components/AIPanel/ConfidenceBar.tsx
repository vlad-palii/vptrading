import type { AIState } from '../../types';
import styles from './ConfidenceBar.module.css';

interface ConfidenceBarProps {
  confidence: number;
  state: AIState;
}

export function ConfidenceBar({ confidence, state }: ConfidenceBarProps) {
  const colorClass = {
    BULLISH: styles.bullish,
    BEARISH: styles.bearish,
    NO_TRADE: styles.neutral,
  }[state];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>Confidence</span>
        <span className={styles.value}>{confidence}%</span>
      </div>
      <div className={styles.bar}>
        <div
          className={`${styles.fill} ${colorClass}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
}
