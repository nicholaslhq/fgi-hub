import { useState, useCallback, useEffect, useRef } from "react";
import type { ConsensusResult, ProviderStatus } from "../types";
import { refreshAll } from "../services";

const CLIENT_CACHE_TTL_MS = 5 * 60_000;

interface ClientCacheEntry {
	data: ConsensusResult;
	timestamp: number;
}

const clientCache: Partial<
	Record<"stock" | "crypto", ClientCacheEntry>
> = {};

function setClientCache(
	market: "stock" | "crypto",
	data: ConsensusResult,
): void {
	clientCache[market] = { data, timestamp: Date.now() };
}

function getClientCache(
	market: "stock" | "crypto",
): ConsensusResult | undefined {
	const entry = clientCache[market];
	if (!entry) return undefined;
	if (Date.now() - entry.timestamp >= CLIENT_CACHE_TTL_MS) return undefined;
	return entry.data;
}

function getClientCacheFallback(): {
	stock: ConsensusResult;
	crypto: ConsensusResult;
} | null {
	const cachedStock = getClientCache("stock");
	const cachedCrypto = getClientCache("crypto");
	if (cachedStock && cachedCrypto) {
		return { stock: cachedStock, crypto: cachedCrypto };
	}
	return null;
}

async function fetchFromApi(market: "stock" | "crypto"): Promise<ConsensusResult> {
	const res = await fetch(`/api/consensus/${market}`);
	if (!res.ok) {
		throw new Error(`API endpoint returned ${res.status}`);
	}
	const contentType = res.headers.get("content-type");
	if (!contentType?.includes("application/json")) {
		throw new Error("API endpoint returned non-JSON response");
	}
	return res.json() as Promise<ConsensusResult>;
}

async function fetchStockFromApi(): Promise<ConsensusResult> {
	return fetchFromApi("stock");
}

async function fetchCryptoFromApi(): Promise<ConsensusResult> {
	return fetchFromApi("crypto");
}

async function fetchBothFromApi(): Promise<{
	stock: ConsensusResult;
	crypto: ConsensusResult;
}> {
	const [stockResult, cryptoResult] = await Promise.all([
		fetchStockFromApi(),
		fetchCryptoFromApi(),
	]);
	setClientCache("stock", stockResult);
	setClientCache("crypto", cryptoResult);
	return { stock: stockResult, crypto: cryptoResult };
}

export function useFearGreed() {
	const [stock, setStock] = useState<ConsensusResult | null>(null);
	const [crypto, setCrypto] = useState<ConsensusResult | null>(null);
	const [status, setStatus] = useState<ProviderStatus>("idle");
	const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

	const prevStockScoreRef = useRef<number | null>(null);
	const prevCryptoScoreRef = useRef<number | null>(null);
	const useApiRef = useRef<boolean | null>(null);
	const fetchInFlightRef = useRef(false);

	const isProdMode = __FGI_DATA_MODE__ === "prod";

	const refresh = useCallback(async () => {
		if (fetchInFlightRef.current) {
			return;
		}
		fetchInFlightRef.current = true;
		setStatus("loading");
		setError(null);
		try {
			let data: { stock: ConsensusResult; crypto: ConsensusResult };

			// In prod mode, never fall back to mock data
			if (isProdMode) {
				try {
					data = await fetchBothFromApi();
					useApiRef.current = true;
					setApiAvailable(true);
				} catch (apiErr) {
					setApiAvailable(false);
					const cached = getClientCacheFallback();
					if (cached) {
						data = cached;
					} else {
						throw apiErr;
					}
				}
			} else if (useApiRef.current === null) {
				// Auto-detect API availability in mock mode
				try {
					data = await fetchBothFromApi();
					useApiRef.current = true;
					setApiAvailable(true);
				} catch {
					useApiRef.current = false;
					setApiAvailable(false);
					const cached = getClientCacheFallback();
					if (cached) {
						data = cached;
					} else {
						data = await refreshAll({
							previousStockScore: prevStockScoreRef.current ?? undefined,
							previousCryptoScore: prevCryptoScoreRef.current ?? undefined,
						});
					}
				}
			} else if (useApiRef.current) {
				try {
					data = await fetchBothFromApi();
					setApiAvailable(true);
				} catch (apiErr) {
					setApiAvailable(false);
					const cached = getClientCacheFallback();
					if (cached) {
						data = cached;
					} else {
						throw apiErr;
					}
				}
			} else {
				setApiAvailable(false);
				data = await refreshAll({
					previousStockScore: prevStockScoreRef.current ?? undefined,
					previousCryptoScore: prevCryptoScoreRef.current ?? undefined,
				});
			}

			prevStockScoreRef.current = data.stock.score;
			prevCryptoScoreRef.current = data.crypto.score;
			setStock(data.stock);
			setCrypto(data.crypto);
			setLastRefreshed(new Date().toISOString());
			setStatus("success");
		} catch (e) {
			setError(
				e instanceof Error
					? e.message
					: "Failed to load sentiment data",
			);
			setStatus("error");
			if (isProdMode) {
				setApiAvailable(false);
			}
		} finally {
			fetchInFlightRef.current = false;
		}
	}, [isProdMode]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	return { stock, crypto, status, lastRefreshed, error, refresh, apiAvailable };
}
