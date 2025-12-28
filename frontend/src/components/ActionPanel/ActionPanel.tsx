import { useStore } from '../../store';
import { PositionSizeSelector } from './PositionSizeSelector';
import styles from './ActionPanel.module.css';

export function ActionPanel() {
  const aiState = useStore((s) => s.aiState);
  const gatekeeperActive = useStore((s) => s.gatekeeperActive);
  const isLocked = useStore((s) => s.isLocked);
  const lockReason = useStore((s) => s.lockReason);
  const selectedRiskPercent = useStore((s) => s.selectedRiskPercent);
  const setSelectedRiskPercent = useStore((s) => s.setSelectedRiskPercent);

  const canTrade = !isLocked && !gatekeeperActive && aiState !== 'NO_TRADE';
  const canBuy = canTrade && aiState === 'BULLISH';
  const canSell = canTrade && aiState === 'BEARISH';

  const handleBuy = () => {
    if (!canBuy) return;
    // Will be implemented in Phase 3
    console.log('BUY clicked', { riskPercent: selectedRiskPercent });
  };

  const handleSell = () => {
    if (!canSell) return;
    // Will be implemented in Phase 3
    console.log('SELL clicked', { riskPercent: selectedRiskPercent });
  };

  const handleStandDown = () => {
    // Manual stand down - skip this trade opportunity
    console.log('STAND DOWN clicked');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>ACTION</span>
      </div>

      <PositionSizeSelector
        selected={selectedRiskPercent}
        onSelect={(percent) => setSelectedRiskPercent(percent)}
        disabled={!canTrade}
      />

      <div className={styles.buttons}>
        <button
          className={`${styles.btn} ${styles.buyBtn}`}
          onClick={handleBuy}
          disabled={!canBuy}
        >
          BUY
        </button>
        <button
          className={`${styles.btn} ${styles.sellBtn}`}
          onClick={handleSell}
          disabled={!canSell}
        >
          SELL
        </button>
      </div>

      <button
        className={`${styles.btn} ${styles.standDownBtn}`}
        onClick={handleStandDown}
      >
        STAND DOWN
      </button>

      {!canTrade && (
        <div className={styles.disabledReason}>
          {isLocked
            ? `Trading locked: ${lockReason || 'Unknown reason'}`
            : gatekeeperActive
            ? 'Gatekeeper active'
            : 'No trade signal'}
        </div>
      )}
    </div>
  );
}
