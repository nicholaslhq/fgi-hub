import { isStale } from "./time";
import type { ConsensusResult } from "../types";

export interface ProviderCounts {
	total: number;
	active: number;
	stale: number;
	failed: number;
}

export function countProviders(providers: ConsensusResult["providers"]): ProviderCounts {
	const total = providers.length;
	const failed = providers.filter((p) => p.error).length;
	const stale = providers.filter((p) => !p.error && isStale(p.timestamp)).length;
	const active = total - failed - stale;
	return { total, active, stale, failed };
}
