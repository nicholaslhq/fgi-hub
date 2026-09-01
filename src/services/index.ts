import type { ConsensusResult, ProviderScore } from '../types';
import { aggregate } from './aggregation';
import { stockProviders } from './providers/stock.providers';
import { cryptoProviders } from './providers/crypto.providers';

export interface RefreshOptions {
  previousStockScore?: number;
  previousCryptoScore?: number;
}

async function fetchConsensus(
  market: 'stock' | 'crypto',
  providerFns: (() => Promise<ProviderScore>)[],
  providerNames: string[],
  previousScore?: number,
): Promise<ConsensusResult> {
  const results = await Promise.allSettled(providerFns.map((fn) => fn()));
  const providers: ProviderScore[] = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      provider: providerNames[i],
      score: NaN,
      label: 'Extreme Fear',
      timestamp: new Date().toISOString(),
      error: r.reason instanceof Error ? r.reason.message : 'Unknown error',
      confidence: 0,
      metadata: { source: 'unknown', market },
    };
  });
  const consensus = aggregate(market, providers, previousScore);
  if (!consensus) throw new Error(`Unable to calculate ${market} consensus`);
  return consensus;
}

export async function fetchStockConsensus(
  opts: RefreshOptions = {},
): Promise<ConsensusResult> {
  const providerNames = [
    'CNN Fear & Greed',
    'Market Vane',
    'Stock Provider B',
    'Put/Call Ratio',
  ];
  return fetchConsensus('stock', stockProviders, providerNames, opts.previousStockScore);
}

export async function fetchCryptoConsensus(
  opts: RefreshOptions = {},
): Promise<ConsensusResult> {
  const providerNames = [
    'Alternative.me',
    'CoinMarketCap',
    'Crypto Provider B',
    'Social Sentiment',
  ];
  return fetchConsensus(
    'crypto',
    cryptoProviders,
    providerNames,
    opts.previousCryptoScore,
  );
}

export async function refreshAll(opts: RefreshOptions = {}): Promise<{
  stock: ConsensusResult;
  crypto: ConsensusResult;
}> {
  const [stock, crypto] = await Promise.all([
    fetchStockConsensus(opts),
    fetchCryptoConsensus(opts),
  ]);
  return { stock, crypto };
}
