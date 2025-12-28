import styles from './ConnectionStatus.module.css';

interface ConnectionStatusProps {
  connected: boolean;
  reconnecting: boolean;
}

export function ConnectionStatus({ connected, reconnecting }: ConnectionStatusProps) {
  let status: 'connected' | 'disconnected' | 'reconnecting';
  let label: string;

  if (connected) {
    status = 'connected';
    label = 'Connected';
  } else if (reconnecting) {
    status = 'reconnecting';
    label = 'Reconnecting...';
  } else {
    status = 'disconnected';
    label = 'Disconnected';
  }

  return (
    <div className={styles.container}>
      <span className={`${styles.dot} ${styles[status]}`} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
