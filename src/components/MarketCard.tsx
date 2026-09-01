import { ConsensusCard } from './ConsensusCard';
import { ProviderList } from './ProviderList';
import type { ConsensusResult } from '../types';

export function MarketCard({
  title,
  data,
}: {
  title: string;
  data: ConsensusResult | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      <ConsensusCard title={title} data={data} />
      {data && <ProviderList providers={data.providers} />}
    </div>
  );
}
