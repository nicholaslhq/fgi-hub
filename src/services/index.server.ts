import type { ConsensusResult, ProviderScore } from "../types/index.js";
import { aggregate } from "./aggregation.js";
import {
	serverStockProviders,
	stockProviderNames,
} from "./providers/serverStock.providers.js";
import {
	serverCryptoProviders,
	cryptoProviderNames,
} from "./providers/serverCrypto.providers.js";

const STOCK_PROVIDER_NAMES = stockProviderNames;
const CRYPTO_PROVIDER_NAMES = cryptoProviderNames;

async function fetchConsensusProd(
	market: "stock" | "crypto",
	providerFns: Array<() => Promise<ProviderScore>>,
	providerNames: string[],
	previousScore?: number,
): Promise<ConsensusResult> {
	const results = await Promise.allSettled(providerFns.map((fn) => fn()));

	const providers: ProviderScore[] = results.map((r, i) => {
		if (r.status === "fulfilled") return r.value;
		return {
			provider: providerNames[i],
			score: NaN,
			label: "Extreme Fear" as const,
			timestamp: new Date().toISOString(),
			error:
				r.reason instanceof Error ? r.reason.message : "Unknown error",
			confidence: 0,
			metadata: { source: "unknown", market },
		};
	});

	const consensus = aggregate(market, providers, previousScore);
	if (!consensus) throw new Error(`Unable to calculate ${market} consensus`);
	return consensus;
}

export async function fetchStockConsensusProd(
	previousScore?: number,
): Promise<ConsensusResult> {
	return fetchConsensusProd(
		"stock",
		serverStockProviders,
		STOCK_PROVIDER_NAMES,
		previousScore,
	);
}

export async function fetchCryptoConsensusProd(
	previousScore?: number,
): Promise<ConsensusResult> {
	return fetchConsensusProd(
		"crypto",
		serverCryptoProviders,
		CRYPTO_PROVIDER_NAMES,
		previousScore,
	);
}

export async function refreshAllProd(): Promise<{
	stock: ConsensusResult;
	crypto: ConsensusResult;
}> {
	const [stock, crypto] = await Promise.all([
		fetchStockConsensusProd(),
		fetchCryptoConsensusProd(),
	]);
	return { stock, crypto };
}
