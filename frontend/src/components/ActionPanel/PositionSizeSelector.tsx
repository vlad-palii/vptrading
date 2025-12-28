import styles from './PositionSizeSelector.module.css';

interface PositionSizeSelectorProps {
  selected: 0.5 | 1 | 2;
  onSelect: (percent: 0.5 | 1 | 2) => void;
  disabled?: boolean;
}

const PRESETS: Array<0.5 | 1 | 2> = [0.5, 1, 2];

export function PositionSizeSelector({
  selected,
  onSelect,
  disabled = false,
}: PositionSizeSelectorProps) {
  return (
    <div className={styles.container}>
      <span className={styles.label}>Position Size</span>
      <div className={styles.presets}>
        {PRESETS.map((percent) => (
          <button
            key={percent}
            className={`${styles.preset} ${selected === percent ? styles.active : ''}`}
            onClick={() => onSelect(percent)}
            disabled={disabled}
          >
            {percent}%
          </button>
        ))}
      </div>
    </div>
  );
}
