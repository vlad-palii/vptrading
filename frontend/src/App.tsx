import { useWebSocket } from './hooks/useWebSocket';
import { Header } from './components/Header';
import { TradingChart } from './components/Chart';
import { AIStatePanel } from './components/AIPanel';
import { ActionPanel } from './components/ActionPanel';
import { RiskPanel } from './components/RiskPanel';
import { AccountPanel } from './components/AccountPanel';
import './index.css';
import styles from './App.module.css';

export function App() {
  // Initialize WebSocket connection
  useWebSocket();

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        <div className={styles.chartPanel}>
          <TradingChart />
        </div>

        <div className={styles.sidePanel}>
          <AccountPanel />
          <AIStatePanel />
          <ActionPanel />
          <RiskPanel />
        </div>
      </main>
    </div>
  );
}
