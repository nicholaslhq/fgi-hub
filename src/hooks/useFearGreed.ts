import { useState, useCallback, useEffect, useRef } from "react";
import type { ConsensusResult, ProviderStatus } from "../types";
import { refreshAll } from "../services";

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

	const isProdMode = __FGI_DATA_MODE__ === "prod";

	const refresh = useCallback(async () => {
		setStatus("loading");
		setError(null);
		try {
			let data: { stock: ConsensusResult; crypto: ConsensusResult };

			// In prod mode, never fall back to mock data
			if (isProdMode) {
				const [stockResult, cryptoResult] = await Promise.all([
					fetchStockFromApi(),
					fetchCryptoFromApi(),
				]);
				useApiRef.current = true;
				setApiAvailable(true);
				data = { stock: stockResult, crypto: cryptoResult };
			} else if (useApiRef.current === null) {
				// Auto-detect API availability in mock mode
				try {
					const [stockResult, cryptoResult] = await Promise.all([
						fetchStockFromApi(),
						fetchCryptoFromApi(),
					]);
					useApiRef.current = true;
					setApiAvailable(true);
					data = { stock: stockResult, crypto: cryptoResult };
				} catch {
					useApiRef.current = false;
					setApiAvailable(false);
					data = await refreshAll({
						previousStockScore: prevStockScoreRef.current ?? undefined,
						previousCryptoScore: prevCryptoScoreRef.current ?? undefined,
					});
				}
			} else if (useApiRef.current) {
				const [stockResult, cryptoResult] = await Promise.all([
					fetchStockFromApi(),
					fetchCryptoFromApi(),
				]);
				setApiAvailable(true);
				data = { stock: stockResult, crypto: cryptoResult };
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
		}
	}, [isProdMode]);

	useEffect(() => {
		refresh();
	}, [refresh]);

	return { stock, crypto, status, lastRefreshed, error, refresh, apiAvailable };
}