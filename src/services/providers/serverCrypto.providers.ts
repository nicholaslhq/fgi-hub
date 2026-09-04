import type { ProviderScore, Market } from "../../types/index.js";
import { sentimentLabel } from "../../utils/sentiment.js";

const TIMEOUT_MS = 10000;

async function fetchJson(url: string, init: RequestInit = {}): Promise<unknown> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		const res = await fetch(url, {
			...init,
			signal: controller.signal,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				Accept: "application/json, text/plain, */*",
				...init.headers,
			},
		});
		if (!res.ok) {
			throw new Error(`HTTP ${res.status}: ${res.statusText}`);
		}
		return res.json();
	} finally {
		clearTimeout(timeout);
	}
}

export async function fetchAlternativeMe(): Promise<ProviderScore> {
	const url = "https://api.alternative.me/fng/?limit=1&format=json";
	const data = (await fetchJson(url)) as {
		data?: Array<{
			value?: string;
			timestamp?: string;
			label?: string;
		}>;
	};

	if (!data.data || data.data.length === 0) {
		throw new Error("Alternative.me: no data returned");
	}

	const entry = data.data[0];
	if (entry.value === undefined) {
		throw new Error("Alternative.me: missing value");
	}

	const score = parseInt(entry.value, 10);
	let timestamp: string;
	if (entry.timestamp) {
		const ts = parseInt(entry.timestamp, 10);
		timestamp = Number.isNaN(ts)
			? new Date(entry.timestamp).toISOString()
			: new Date(ts * 1000).toISOString();
	} else {
		timestamp = new Date().toISOString();
	}

	return {
		provider: "Alternative.me",
		score,
		label: sentimentLabel(score),
		timestamp,
		confidence: 0.95,
		market: "crypto",
		source: "https://api.alternative.me/fng/?limit=1&format=json",
		method: "api_json",
		retrievedAt: new Date().toISOString(),
		freshness: "delayed",
		metadata: { source: "alternative_me", label: entry.label },
	};
}

export async function fetchQiaobax(): Promise<ProviderScore> {
	const url = "https://qiaobax.com/api/fng";
	const data = (await fetchJson(url)) as {
		value?: number;
		labelEn?: string;
		labelZh?: string;
		updatedAt?: string;
		ts?: number;
	};

	if (data.value === undefined) {
		throw new Error("Qiaobax: missing value");
	}

	const score = Math.round(data.value);
	let timestamp: string;
	if (data.ts) {
		timestamp = new Date(data.ts * 1000).toISOString();
	} else if (data.updatedAt) {
		timestamp = new Date(data.updatedAt).toISOString();
	} else {
		timestamp = new Date().toISOString();
	}

	return {
		provider: "Qiaobax",
		score,
		label: sentimentLabel(score),
		timestamp,
		confidence: 0.9,
		market: "crypto",
		source: "https://qiaobax.com/api/fng",
		method: "api_json",
		retrievedAt: new Date().toISOString(),
		freshness: "realtime",
		metadata: { source: "qiaobax", labelEn: data.labelEn, labelZh: data.labelZh },
	};
}

export async function fetchFearGreedChartCrypto(): Promise<ProviderScore> {
	const url = "https://crypto.feargreedchart.com/api/?action=crypto";
	const data = (await fetchJson(url)) as {
		score?: number;
		label?: string;
		date?: string;
		updated?: string;
	};

	if (data.score === undefined) {
		throw new Error("FearGreedChart Crypto: missing data");
	}

	const score = Math.round(data.score);
	const timestamp = data.updated
		? new Date(data.updated).toISOString()
		: data.date
			? new Date(data.date).toISOString()
			: new Date().toISOString();

	return {
		provider: "FearGreedChart (Crypto)",
		score,
		label: sentimentLabel(score),
		timestamp,
		confidence: 0.85,
		market: "crypto",
		source: "https://crypto.feargreedchart.com/api/?action=crypto",
		method: "api_json",
		retrievedAt: new Date().toISOString(),
		freshness: "realtime",
		metadata: { source: "feargreedchart_crypto", label: data.label },
	};
}

export const serverCryptoProviders: Array<() => Promise<ProviderScore>> = [
	fetchAlternativeMe,
	fetchQiaobax,
	fetchFearGreedChartCrypto,
];

export const cryptoProviderNames = [
	"Alternative.me",
	"Qiaobax",
	"FearGreedChart (Crypto)",
];

export function getCryptoMarket(): Market {
	return "crypto";
}
