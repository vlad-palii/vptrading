import styles from './PriceDisplay.module.css';

interface PriceDisplayProps {
  price: number | null;
  change: number | null;
  changePercent: number | null;
}

export function PriceDisplay({ price, change, changePercent }: PriceDisplayProps) {
  const safePrice = price ?? 0;
  const safeChange = change ?? 0;
  const safeChangePercent = changePercent ?? 0;
  const isPositive = safeChange >= 0;

  return (
    <div className={styles.container}>
      <span className={styles.price}>
        ${safePrice.toFixed(2)}
      </span>
      <span className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
        {isPositive ? '+' : ''}{safeChange.toFixed(2)} ({isPositive ? '+' : ''}{safeChangePercent.toFixed(2)}%)
      </span>
    </div>
  );
}
