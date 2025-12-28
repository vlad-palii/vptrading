import { useStore } from '../../store';
import { ConfidenceBar } from './ConfidenceBar';
import { GatekeeperWarning } from './GatekeeperWarning';
import styles from './AIStatePanel.module.css';

export function AIStatePanel() {
  const aiState = useStore((s) => s.aiState);
  const aiConfidence = useStore((s) => s.aiConfidence);
  const gatekeeperActive = useStore((s) => s.gatekeeperActive);
  const overrideReason = useStore((s) => s.overrideReason);

  const stateClass = {
    BULLISH: styles.bullish,
    BEARISH: styles.bearish,
    NO_TRADE: styles.noTrade,
  }[aiState];

  // Show conditions panel when gatekeeper is active OR when in NO_TRADE state
  const showConditions = gatekeeperActive || aiState === 'NO_TRADE';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>AI STATE</span>
      </div>

      <div className={`${styles.stateDisplay} ${stateClass}`}>
        <span className={styles.stateText}>{aiState.replace('_', ' ')}</span>
      </div>

      <ConfidenceBar confidence={aiConfidence} state={aiState} />

      {showConditions && (
        <GatekeeperWarning reason={overrideReason || 'Waiting for favorable conditions'} />
      )}
    </div>
  );
}
