import type { ProviderScore, Market } from "../../types/index.js";
import { sentimentLabel } from "../../utils/sentiment.js";
import { providerError } from "../../utils/errors.js";

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
		return providerError(
			"Alternative.me",
			"Alternative.me: no data returned",
			"crypto",
			"https://alternative.me/crypto/fear-and-greed-index/",
		);
	}

	const entry = data.data[0];
	if (entry.value === undefined) {
		return providerError(
			"Alternative.me",
			"Alternative.me: missing value",
			"crypto",
			"https://alternative.me/crypto/fear-and-greed-index/",
		);
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
		source: "https://alternative.me/crypto/fear-and-greed-index/",
		method: "api_json",
		retrievedAt: new Date().toISOString(),
		freshness: "delayed",
		metadata: { source: "alternative_me", label: entry.label },
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
		return providerError(
			"FearGreedChart (Crypto)",
			"FearGreedChart Crypto: missing data",
			"crypto",
			"https://crypto.feargreedchart.com/",
		);
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
		source: "https://crypto.feargreedchart.com/",
		method: "api_json",
		retrievedAt: new Date().toISOString(),
		freshness: "realtime",
		metadata: { source: "feargreedchart_crypto", label: data.label },
	};
}

async function fetchFearGreedMeterPage(url: string): Promise<unknown> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		const res = await fetch(url, {
			signal: controller.signal,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				Accept: "text/html,application/xhtml+xml",
			},
		});
		if (!res.ok) {
			throw new Error(`HTTP ${res.status}: ${res.statusText}`);
		}
		const html = await res.text();
		const startMarker = '<script id="__NEXT_DATA__" type="application/json">';
		const startIdx = html.indexOf(startMarker);
		if (startIdx < 0) {
			throw new Error("FearGreedMeter: __NEXT_DATA__ script not found");
		}
		const jsonStart = startIdx + startMarker.length;
		const endIdx = html.indexOf("</script>", jsonStart);
		if (endIdx < 0) {
			throw new Error("FearGreedMeter: __NEXT_DATA__ end tag not found");
		}
		return JSON.parse(html.substring(jsonStart, endIdx));
	} finally {
		clearTimeout(timeout);
	}
}

export async function fetchFearGreedMeterCrypto(): Promise<ProviderScore> {
	const url = "https://feargreedmeter.com/crypto";
	const data = (await fetchFearGreedMeterPage(url)) as {
		props?: {
			pageProps?: {
				data?: {
					fgi_crypto?: Array<{
						value?: string | number;
						timestamp?: number;
						time_until_update?: number;
					}>;
				};
			};
		};
	};

	const series = data?.props?.pageProps?.data?.fgi_crypto;
	if (!Array.isArray(series) || series.length === 0) {
		return providerError(
			"FearGreedMeter (Crypto)",
			"FearGreedMeter Crypto: missing fgi_crypto series",
			"crypto",
			"https://feargreedmeter.com/crypto",
		);
	}

	const entry = series[0];
	const rawValue = entry.value;
	const numericValue =
		typeof rawValue === "number"
			? rawValue
			: typeof rawValue === "string"
				? parseInt(rawValue, 10)
				: NaN;
	if (!Number.isFinite(numericValue)) {
		return providerError(
			"FearGreedMeter (Crypto)",
			"FearGreedMeter Crypto: missing value in latest entry",
			"crypto",
			"https://feargreedmeter.com/crypto",
		);
	}

	const score = Math.round(numericValue);
	const timestamp =
		typeof entry.timestamp === "number"
			? new Date(entry.timestamp * 1000).toISOString()
			: new Date().toISOString();

	return {
		provider: "FearGreedMeter (Crypto)",
		score,
		label: sentimentLabel(score),
		timestamp,
		confidence: 0.85,
		market: "crypto",
		source: "https://feargreedmeter.com/crypto",
		method: "html_scrape",
		retrievedAt: new Date().toISOString(),
		freshness: "delayed",
		metadata: {
			source: "feargreedmeter_crypto",
			timeUntilUpdate: entry.time_until_update,
		},
	};
}

export async function fetchCfgiCrypto(): Promise<ProviderScore> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
	let html: string;
	try {
		const res = await fetch(
			"https://cfgi.io/widget/embed/?symbol=MARKET&theme=dark&timeframe=1d",
			{
				signal: controller.signal,
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
					Accept: "text/html,application/xhtml+xml",
				},
			},
		);
		if (!res.ok) {
			throw new Error(`HTTP ${res.status}: ${res.statusText}`);
		}
		html = await res.text();
	} finally {
		clearTimeout(timeout);
	}

	const valueMatch = html.match(/<span class="num value">(\d+)<\/span>/);
	const classMatch = html.match(/<span class="classification">([^<]+)<\/span>/);
	const metaMatch = html.match(/<p class="meta">([^<]+)<\/p>/);

	if (!valueMatch) {
		return providerError(
			"CFGI (Crypto)",
			"CFGI Crypto: could not find value span",
			"crypto",
			"https://cfgi.io/",
		);
	}

	const score = parseInt(valueMatch[1], 10);
	const classification = classMatch?.[1]?.trim();
	const metaText = metaMatch?.[1]?.trim() ?? "";

	const dateMatch = metaText.match(/as of (.+)$/);
	let timestamp = new Date().toISOString();
	if (dateMatch) {
		const parsed = new Date(dateMatch[1].trim() + " UTC");
		if (!Number.isNaN(parsed.getTime())) {
			timestamp = parsed.toISOString();
		}
	}

	return {
		provider: "CFGI (Crypto)",
		score,
		label: sentimentLabel(score),
		timestamp,
		confidence: 0.8,
		market: "crypto",
		source: "https://cfgi.io/",
		method: "html_scrape",
		retrievedAt: new Date().toISOString(),
		freshness: "realtime",
		metadata: { source: "cfgi_crypto", classification },
	};
}

export async function fetchCoinMarketCapFgi(): Promise<ProviderScore> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
	let html: string;
	try {
		const res = await fetch(
			"https://coinmarketcap.com/charts/fear-and-greed-index/",
			{
				signal: controller.signal,
				headers: {
					"User-Agent":
						"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
					Accept: "text/html,application/xhtml+xml",
				},
			},
		);
		if (!res.ok) {
			throw new Error(`HTTP ${res.status}: ${res.statusText}`);
		}
		html = await res.text();
	} finally {
		clearTimeout(timeout);
	}

	const startMarker = '<script id="__NEXT_DATA__" type="application/json"';
	const startIdx = html.indexOf(startMarker);
	if (startIdx < 0) {
		return providerError(
			"CoinMarketCap",
			"CoinMarketCap: __NEXT_DATA__ script not found",
			"crypto",
			"https://coinmarketcap.com/charts/fear-and-greed-index/",
		);
	}
	const jsonStart = html.indexOf(">", startIdx) + 1;
	const endIdx = html.indexOf("</script>", jsonStart);
	if (endIdx < 0) {
		return providerError(
			"CoinMarketCap",
			"CoinMarketCap: __NEXT_DATA__ end tag not found",
			"crypto",
			"https://coinmarketcap.com/charts/fear-and-greed-index/",
		);
	}

	const data = JSON.parse(html.substring(jsonStart, endIdx)) as {
		props?: {
			pageProps?: {
				pageSharedData?: {
					fearGreedIndexData?: {
						currentIndex?: {
							score?: number;
							name?: string;
							updateTime?: string;
						};
					};
				};
			};
		};
	};

	const current =
		data?.props?.pageProps?.pageSharedData?.fearGreedIndexData?.currentIndex;
	if (!current || typeof current.score !== "number") {
		return providerError(
			"CoinMarketCap",
			"CoinMarketCap: missing fearGreedIndexData.currentIndex.score",
			"crypto",
			"https://coinmarketcap.com/charts/fear-and-greed-index/",
		);
	}

	const score = Math.round(current.score);
	const timestamp = current.updateTime
		? new Date(current.updateTime).toISOString()
		: new Date().toISOString();

	return {
		provider: "CoinMarketCap",
		score,
		label: sentimentLabel(score),
		timestamp,
		confidence: 0.85,
		market: "crypto",
		source: "https://coinmarketcap.com/charts/fear-and-greed-index/",
		method: "html_scrape",
		retrievedAt: new Date().toISOString(),
		freshness: "realtime",
		metadata: { source: "coinmarketcap", name: current.name },
	};
}

export const serverCryptoProviders: Array<() => Promise<ProviderScore>> = [
	fetchAlternativeMe,
	fetchCoinMarketCapFgi,
	fetchFearGreedChartCrypto,
	fetchFearGreedMeterCrypto,
	fetchCfgiCrypto,
];

export const cryptoProviderNames = [
	"Alternative.me",
	"CoinMarketCap",
	"FearGreedChart (Crypto)",
	"FearGreedMeter (Crypto)",
	"CFGI (Crypto)",
];

export function getCryptoMarket(): Market {
	return "crypto";
}
