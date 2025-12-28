import { useStore } from '../../store';
import styles from './GatekeeperWarning.module.css';

interface GatekeeperWarningProps {
  reason: string;
}

interface ConditionCheck {
  label: string;
  current: string;
  threshold: string;
  isBlocking: boolean;
  hint: string;
}

export function GatekeeperWarning({ reason }: GatekeeperWarningProps) {
  const indicators = useStore((s) => s.indicators);
  const volatilityState = useStore((s) => s.volatilityState);
  const aiConfidence = useStore((s) => s.aiConfidence);
  const tradeCount = useStore((s) => s.tradeCount);
  const maxTrades = useStore((s) => s.maxTrades);
  const dailyPnl = useStore((s) => s.dailyPnl);
  const isLocked = useStore((s) => s.isLocked);

  // Define conditions and their thresholds based on gatekeeper rules
  const conditions: ConditionCheck[] = [];

  // Volatility check
  conditions.push({
    label: 'Volatility',
    current: volatilityState,
    threshold: 'HIGH',
    isBlocking: volatilityState === 'LOW',
    hint: volatilityState === 'LOW' ? 'Wait for volatility expansion' : 'OK',
  });

  // ADX check (trend strength)
  if (indicators) {
    conditions.push({
      label: 'ADX (Trend)',
      current: indicators.adx.toFixed(1),
      threshold: '> 20',
      isBlocking: indicators.adx < 20,
      hint: indicators.adx < 20 ? 'Wait for stronger trend' : 'Trend present',
    });

    // Chop Index check
    conditions.push({
      label: 'Chop Index',
      current: indicators.chopIndex.toFixed(1),
      threshold: '< 61.8',
      isBlocking: indicators.chopIndex > 61.8,
      hint: indicators.chopIndex > 61.8 ? 'Market is choppy, wait for breakout' : 'Not choppy',
    });
  }

  // Confidence check
  conditions.push({
    label: 'AI Confidence',
    current: `${aiConfidence}%`,
    threshold: '> 65%',
    isBlocking: aiConfidence < 65,
    hint: aiConfidence < 65 ? 'Signal not strong enough' : 'Strong signal',
  });

  // Trade count check
  conditions.push({
    label: 'Trades Today',
    current: `${tradeCount}/${maxTrades}`,
    threshold: `< ${maxTrades}`,
    isBlocking: tradeCount >= maxTrades,
    hint: tradeCount >= maxTrades ? 'Daily limit reached, try tomorrow' : 'Trades available',
  });

  // Daily loss check
  if (dailyPnl < -50) {
    conditions.push({
      label: 'Daily P&L',
      current: `$${dailyPnl.toFixed(2)}`,
      threshold: '> -$50',
      isBlocking: true,
      hint: 'Loss limit hit, trading locked for today',
    });
  }

  // Daily profit lock check
  if (dailyPnl >= 100) {
    conditions.push({
      label: 'Daily P&L',
      current: `$${dailyPnl.toFixed(2)}`,
      threshold: '< $100',
      isBlocking: true,
      hint: 'Profit target reached! Trading locked to protect gains',
    });
  }

  const blockingConditions = conditions.filter(c => c.isBlocking);
  const passingConditions = conditions.filter(c => !c.isBlocking);

  // Determine guidance message
  let guidance = '';
  if (isLocked) {
    guidance = 'Trading is locked for today. Come back tomorrow.';
  } else if (blockingConditions.length === 1) {
    guidance = blockingConditions[0].hint;
  } else if (blockingConditions.length > 1) {
    guidance = `${blockingConditions.length} conditions blocking. Wait for market to improve.`;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <svg
          className={styles.icon}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 1.5L14.5 13H1.5L8 1.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M8 6V9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="8" cy="11" r="0.75" fill="currentColor" />
        </svg>
        <span className={styles.title}>GATEKEEPER ACTIVE</span>
      </div>

      <div className={styles.reason}>{reason}</div>

      <div className={styles.conditions}>
        {blockingConditions.map((condition, i) => (
          <div key={i} className={`${styles.condition} ${styles.blocking}`}>
            <span className={styles.conditionLabel}>{condition.label}</span>
            <span className={styles.conditionValue}>
              {condition.current}
              <span className={styles.threshold}>(need {condition.threshold})</span>
            </span>
          </div>
        ))}
        {passingConditions.map((condition, i) => (
          <div key={i} className={`${styles.condition} ${styles.passing}`}>
            <span className={styles.conditionLabel}>{condition.label}</span>
            <span className={styles.conditionValue}>{condition.current}</span>
          </div>
        ))}
      </div>

      {guidance && (
        <div className={styles.guidance}>
          <span className={styles.guidanceIcon}>→</span>
          {guidance}
        </div>
      )}
    </div>
  );
}
