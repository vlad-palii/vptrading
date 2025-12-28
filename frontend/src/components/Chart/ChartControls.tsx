import { useStore } from '../../store';
import type { Timeframe } from '../../types';
import styles from './ChartControls.module.css';

const TIMEFRAMES: Timeframe[] = ['5m', '15m'];

export function ChartControls() {
  const selectedTimeframe = useStore((s) => s.selectedTimeframe);
  const setSelectedTimeframe = useStore((s) => s.setSelectedTimeframe);

  return (
    <div className={styles.controls}>
      <div className={styles.timeframes}>
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            className={`${styles.timeframeBtn} ${selectedTimeframe === tf ? styles.active : ''}`}
            onClick={() => setSelectedTimeframe(tf)}
          >
            {tf.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
