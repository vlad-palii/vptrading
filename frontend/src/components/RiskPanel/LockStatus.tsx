import styles from './LockStatus.module.css';

interface LockStatusProps {
  reason: string;
}

export function LockStatus({ reason }: LockStatusProps) {
  return (
    <div className={styles.container}>
      <svg
        className={styles.icon}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="3"
          y="7"
          width="10"
          height="7"
          rx="1"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M5 7V5C5 3.34315 6.34315 2 8 2C9.65685 2 11 3.34315 11 5V7"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      <span className={styles.text}>{reason}</span>
    </div>
  );
}
