import type { ConsensusResult, ProviderScore } from "../types/index.js";
import { aggregate } from "./aggregation.js";
import { ConsensusCache } from "./cache.js";
import {
	serverStockProviders,
	stockProviderNames,
} from "./providers/serverStock.providers.js";
import {
	serverCryptoProviders,
	cryptoProviderNames,
} from "./providers/serverCrypto.providers.js";
import { providerError } from "../utils/errors.js";

const STOCK_PROVIDER_NAMES = stockProviderNames;
const CRYPTO_PROVIDER_NAMES = cryptoProviderNames;

const CACHE_TTL_SECONDS =
	Number(process.env.FGI_CACHE_TTL) || 60;

const cache = new ConsensusCache(CACHE_TTL_SECONDS);

const CACHE_KEY_STOCK = "consensus:stock";
const CACHE_KEY_CRYPTO = "consensus:crypto";

function logCacheEvent(
	market: "stock" | "crypto",
	event: "hit" | "miss" | "stale" | "error",
): void {
	const stats = cache.getStats();
	console.error(
		`[cache] ${market} ${event} — hits=${stats.hits} misses=${stats.misses} stale=${stats.staleReturns} errors=${stats.errors}`,
	);
}

async function fetchWithCache(
	key: string,
	market: "stock" | "crypto",
	fetcher: () => Promise<ConsensusResult>,
): Promise<ConsensusResult> {
	const before = cache.getStats();
	try {
		const result = await cache.getOrFetch(key, fetcher);
		const after = cache.getStats();
		if (after.hits > before.hits) {
			logCacheEvent(market, "hit");
		} else if (after.staleReturns > before.staleReturns) {
			logCacheEvent(market, "stale");
		} else if (after.errors > before.errors) {
			logCacheEvent(market, "error");
		} else {
			logCacheEvent(market, "miss");
		}
		return result;
	} catch (err) {
		logCacheEvent(market, "error");
		throw err;
	}
}

async function fetchConsensusProd(
	market: "stock" | "crypto",
	providerFns: Array<() => Promise<ProviderScore>>,
	providerNames: string[],
	previousScore?: number,
): Promise<ConsensusResult> {
	const results = await Promise.allSettled(providerFns.map((fn) => fn()));

	const providers: ProviderScore[] = results.map((r, i) => {
		if (r.status === "fulfilled") return r.value;
		return providerError(
			providerNames[i],
			r.reason instanceof Error ? r.reason.message : "Unknown error",
			market,
			"unknown",
		);
	});

	const consensus = aggregate(market, providers, previousScore);
	if (!consensus) throw new Error(`Unable to calculate ${market} consensus`);
	return consensus;
}

export async function fetchStockConsensusProd(
	previousScore?: number,
): Promise<ConsensusResult> {
	if (previousScore !== undefined) {
		return fetchConsensusProd(
			"stock",
			serverStockProviders,
			STOCK_PROVIDER_NAMES,
			previousScore,
		);
	}
	return fetchWithCache(CACHE_KEY_STOCK, "stock", () =>
		fetchConsensusProd(
			"stock",
			serverStockProviders,
			STOCK_PROVIDER_NAMES,
		),
	);
}

export async function fetchCryptoConsensusProd(
	previousScore?: number,
): Promise<ConsensusResult> {
	if (previousScore !== undefined) {
		return fetchConsensusProd(
			"crypto",
			serverCryptoProviders,
			CRYPTO_PROVIDER_NAMES,
			previousScore,
		);
	}
	return fetchWithCache(CACHE_KEY_CRYPTO, "crypto", () =>
		fetchConsensusProd(
			"crypto",
			serverCryptoProviders,
			CRYPTO_PROVIDER_NAMES,
		),
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

export { cache };
