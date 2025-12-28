import type { VolatilityState } from '../../types';
import styles from './VolatilityBadge.module.css';

interface VolatilityBadgeProps {
  state: VolatilityState;
}

export function VolatilityBadge({ state }: VolatilityBadgeProps) {
  const isHigh = state === 'HIGH';

  return (
    <span className={`${styles.badge} ${isHigh ? styles.high : styles.low}`}>
      {state}
    </span>
  );
}
