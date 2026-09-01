import { useState, useCallback, useEffect, useRef } from 'react';
import type { ConsensusResult, ProviderStatus } from '../types';
import { refreshAll } from '../services';

export function useFearGreed() {
  const [stock, setStock] = useState<ConsensusResult | null>(null);
  const [crypto, setCrypto] = useState<ConsensusResult | null>(null);
  const [status, setStatus] = useState<ProviderStatus>('idle');
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const prevStockScoreRef = useRef<number | null>(null);
  const prevCryptoScoreRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const data = await refreshAll({
        previousStockScore: prevStockScoreRef.current ?? undefined,
        previousCryptoScore: prevCryptoScoreRef.current ?? undefined,
      });
      prevStockScoreRef.current = data.stock.score;
      prevCryptoScoreRef.current = data.crypto.score;
      setStock(data.stock);
      setCrypto(data.crypto);
      setLastRefreshed(new Date().toISOString());
      setStatus('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sentiment data');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { stock, crypto, status, lastRefreshed, error, refresh };
}
