import { useStore } from '../../store';
import { PriceDisplay } from './PriceDisplay';
import { VolatilityBadge } from './VolatilityBadge';
import { ConnectionStatus } from './ConnectionStatus';
import styles from './Header.module.css';

export function Header() {
  const price = useStore((s) => s.price);
  const priceChange24h = useStore((s) => s.priceChange24h);
  const priceChangePercent24h = useStore((s) => s.priceChangePercent24h);
  const volatilityState = useStore((s) => s.volatilityState);
  const isConnected = useStore((s) => s.isConnected);
  const isReconnecting = useStore((s) => s.isReconnecting);

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <span className={styles.pair}>BNB/USDT</span>
        <VolatilityBadge state={volatilityState} />
      </div>

      <div className={styles.center}>
        <PriceDisplay
          price={price}
          change={priceChange24h}
          changePercent={priceChangePercent24h}
        />
      </div>

      <div className={styles.right}>
        <ConnectionStatus
          connected={isConnected}
          reconnecting={isReconnecting}
        />
      </div>
    </header>
  );
}
