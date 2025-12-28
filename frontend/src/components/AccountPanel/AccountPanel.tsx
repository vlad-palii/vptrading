import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import styles from './AccountPanel.module.css';

interface AccountBalance {
  balances: {
    bnb: {
      free: number;
      locked: number;
      total: number;
      valueUsdt: number;
    };
    usdt: {
      free: number;
      locked: number;
      total: number;
    };
  };
  totalValueUsdt: number;
  currentBnbPrice: number;
  permissions: {
    canTrade: boolean;
    canWithdraw: boolean;
    canDeposit: boolean;
  };
  isTestnet: boolean;
  timestamp: number;
}

export function AccountPanel() {
  const [balance, setBalance] = useState<AccountBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    try {
      const data = await api.getBalance();
      setBalance(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.title}>ACCOUNT</span>
        </div>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <span className={styles.title}>ACCOUNT</span>
        </div>
        <div className={styles.error}>{error}</div>
        <button className={styles.retryBtn} onClick={fetchBalance}>
          Retry
        </button>
      </div>
    );
  }

  if (!balance) return null;

  const canTrade = balance.permissions?.canTrade ?? false;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>ACCOUNT</span>
        {balance.isTestnet && <span className={styles.testnetBadge}>TESTNET</span>}
      </div>

      <div className={styles.apiPermissions}>
        <span className={styles.permissionsLabel}>API Key Permissions:</span>
        <div className={styles.permissionsList}>
          <span className={`${styles.permission} ${canTrade ? styles.enabled : styles.disabled}`}>
            {canTrade ? '✓' : '✗'} Trade
          </span>
          <span className={`${styles.permission} ${balance.permissions?.canWithdraw ? styles.enabled : styles.disabled}`}>
            {balance.permissions?.canWithdraw ? '✓' : '✗'} Withdraw
          </span>
          <span className={`${styles.permission} ${balance.permissions?.canDeposit ? styles.enabled : styles.disabled}`}>
            {balance.permissions?.canDeposit ? '✓' : '✗'} Deposit
          </span>
        </div>
        {!canTrade && (
          <div className={styles.warningBox}>
            API key is READ-ONLY. Enable "Spot Trading" in Binance API settings to trade.
          </div>
        )}
      </div>

      <div className={styles.totalValue}>
        <span className={styles.totalLabel}>Total Value</span>
        <span className={styles.totalAmount}>${(balance.totalValueUsdt ?? 0).toFixed(2)}</span>
      </div>

      <div className={styles.balances}>
        <div className={styles.balanceRow}>
          <div className={styles.asset}>
            <span className={styles.assetIcon}>BNB</span>
            <div className={styles.assetDetails}>
              <span className={styles.assetName}>BNB</span>
              <span className={styles.assetPrice}>@${(balance.currentBnbPrice ?? 0).toFixed(2)}</span>
            </div>
          </div>
          <div className={styles.amounts}>
            <span className={styles.mainAmount}>{(balance.balances?.bnb?.total ?? 0).toFixed(4)}</span>
            <span className={styles.usdValue}>${(balance.balances?.bnb?.valueUsdt ?? 0).toFixed(2)}</span>
          </div>
        </div>

        {(balance.balances?.bnb?.locked ?? 0) > 0 && (
          <div className={styles.lockedInfo}>
            <span>Locked: {(balance.balances.bnb.locked).toFixed(4)} BNB</span>
          </div>
        )}

        <div className={styles.balanceRow}>
          <div className={styles.asset}>
            <span className={styles.assetIcon}>USDT</span>
            <div className={styles.assetDetails}>
              <span className={styles.assetName}>USDT</span>
              <span className={styles.assetPrice}>Stablecoin</span>
            </div>
          </div>
          <div className={styles.amounts}>
            <span className={styles.mainAmount}>${(balance.balances?.usdt?.total ?? 0).toFixed(2)}</span>
            <span className={styles.usdValue}>Available</span>
          </div>
        </div>

        {(balance.balances?.usdt?.locked ?? 0) > 0 && (
          <div className={styles.lockedInfo}>
            <span>Locked: ${(balance.balances.usdt.locked).toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.lastUpdate}>
          Updated: {new Date(balance.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
