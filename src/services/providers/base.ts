import type { ProviderScore, Market } from '../../types/index';

export type ProviderFn = () => Promise<ProviderScore>;

export interface ProviderConfig {
  name: string;
  market: Market;
  fn: ProviderFn;
}
