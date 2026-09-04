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

async function fetchText(url: string, init: RequestInit = {}): Promise<string> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
	try {
		const res = await fetch(url, {
			...init,
			signal: controller.signal,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
				Accept: "text/html,application/xhtml+xml",
				...init.headers,
			},
		});
		if (!res.ok) {
			throw new Error(`HTTP ${res.status}: ${res.statusText}`);
		}
		return res.text();
	} finally {
		clearTimeout(timeout);
	}
}

export async function fetchCnnFearGreed(): Promise<ProviderScore> {
	const url =
		"https://production.dataviz.cnn.io/index/fearandgreed/graphdata";
	const data = (await fetchJson(url)) as {
		fear_and_greed?: {
			score?: number;
			timestamp?: string;
		};
	};

	const current = data.fear_and_greed;
	if (!current || current.score === undefined) {
		throw new Error("CNN: missing fear_and_greed data");
	}

	const score = Math.round(current.score);
	const timestamp = current.timestamp
		? new Date(current.timestamp).toISOString()
		: new Date().toISOString();

	return {
		provider: "CNN Fear & Greed",
		score,
		label: sentimentLabel(score),
		timestamp,
		confidence: 0.9,
		market: "stock",
		source: "https://production.dataviz.cnn.io/index/fearandgreed/graphdata",
		method: "api_json",
		retrievedAt: new Date().toISOString(),
		freshness: "realtime",
		metadata: { source: "cnn_fear_greed" },
	};
}

export async function fetchFearGreedChartStock(): Promise<ProviderScore> {
	const url = "https://feargreedchart.com/api/?action=all";
	const data = (await fetchJson(url)) as {
		score?: {
			score?: number;
			components?: Array<{ name: string; val: number; wt: number }>;
		};
		ts?: number;
	};

	if (!data.score || data.score.score === undefined) {
		throw new Error("FearGreedChart: missing score data");
	}

	const score = Math.round(data.score.score);
	const timestamp = data.ts
		? new Date(data.ts).toISOString()
		: new Date().toISOString();

	return {
		provider: "FearGreedChart (Stock)",
		score,
		label: sentimentLabel(score),
		timestamp,
		confidence: 0.85,
		market: "stock",
		source: "https://feargreedchart.com/api/?action=all",
		method: "api_json",
		retrievedAt: new Date().toISOString(),
		freshness: "realtime",
		metadata: { source: "feargreedchart_stock" },
	};
}

export async function fetchCboePutCallRatio(): Promise<ProviderScore> {
	const html = await fetchText(
		"https://www.cboe.com/us/options/market_statistics/daily/",
	);

	const idx = html.indexOf("EQUITY OPTIONS");
	if (idx < 0) {
		throw new Error("CBOE: could not find EQUITY OPTIONS in page");
	}

	const slice = html.substring(idx);
	const arrStart = slice.indexOf("[");
	if (arrStart < 0) {
		throw new Error("CBOE: could not find array start");
	}

	const arrEnd = slice.indexOf("]", arrStart);
	if (arrEnd < 0) {
		throw new Error("CBOE: could not find array end");
	}

	const jsonStr = slice.substring(arrStart, arrEnd + 1).replace(/\\"/g, '"');
	const arr = JSON.parse(jsonStr) as Array<{
		name: string;
		call: number;
		put: number;
		total: number;
	}>;

	const volume = arr.find((entry) => entry.name === "VOLUME");
	if (!volume || !volume.call || volume.call === 0) {
		throw new Error("CBOE: could not find valid VOLUME entry");
	}

	const callVol = volume.call;
	const putVol = volume.put;
	const pcr = putVol / callVol;
	const score = pcrToSentimentScore(pcr);

	return {
		provider: "CBOE Put/Call Ratio",
		score,
		label: sentimentLabel(score),
		timestamp: new Date().toISOString(),
		confidence: 0.8,
		market: "stock",
		source: "https://www.cboe.com/us/options/market_statistics/daily/",
		method: "html_scrape",
		retrievedAt: new Date().toISOString(),
		freshness: "realtime",
		metadata: { source: "cboe_pcr", putVolume: putVol, callVolume: callVol, pcr },
	};
}

function pcrToSentimentScore(pcr: number): number {
	const clamped = Math.max(0.2, Math.min(1.5, pcr));
	const normalized = (1.5 - clamped) / (1.5 - 0.2);
	return Math.round(normalized * 100);
}

async function fetchFearGreedMeterPage(url: string): Promise<unknown> {
	const html = await fetchText(url);
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
	const jsonStr = html.substring(jsonStart, endIdx);
	return JSON.parse(jsonStr);
}

export async function fetchFearGreedMeterStock(): Promise<ProviderScore> {
	const url = "https://feargreedmeter.com/";
	const data = (await fetchFearGreedMeterPage(url)) as {
		props?: {
			pageProps?: {
				data?: {
					fgi?: {
						latest?: { now?: number; date?: string };
						last_update?: string;
					};
				};
			};
		};
	};

	const fgi = data?.props?.pageProps?.data?.fgi;
	const now = fgi?.latest?.now;
	if (typeof now !== "number") {
		throw new Error("FearGreedMeter Stock: missing fgi.latest.now");
	}

	const score = Math.round(now);
	const timestamp = fgi?.last_update
		? new Date(fgi.last_update).toISOString()
		: new Date().toISOString();

	return {
		provider: "FearGreedMeter (Stock)",
		score,
		label: sentimentLabel(score),
		timestamp,
		confidence: 0.85,
		market: "stock",
		source: "https://feargreedmeter.com/",
		method: "html_scrape",
		retrievedAt: new Date().toISOString(),
		freshness: "realtime",
		metadata: { source: "feargreedmeter_stock", date: fgi?.latest?.date },
	};
}

export async function fetchCfgiStock(): Promise<ProviderScore> {
	const url = "https://cfgi.io/widget/embed/?symbol=STOCK_MARKET&theme=dark&timeframe=1d";
	const html = await fetchText(url);

	const valueMatch = html.match(/<span class="num value">(\d+)<\/span>/);
	const classMatch = html.match(/<span class="classification">([^<]+)<\/span>/);
	const metaMatch = html.match(/<p class="meta">([^<]+)<\/p>/);

	if (!valueMatch) {
		throw new Error("CFGI Stock: could not find value span");
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
		provider: "CFGI (Stock)",
		score,
		label: sentimentLabel(score),
		timestamp,
		confidence: 0.8,
		market: "stock",
		source: "https://cfgi.io/widget/embed/?symbol=STOCK_MARKET&theme=dark&timeframe=1d",
		method: "html_scrape",
		retrievedAt: new Date().toISOString(),
		freshness: "realtime",
		metadata: { source: "cfgi_stock", classification },
	};
}

export const serverStockProviders: Array<() => Promise<ProviderScore>> = [
	fetchCnnFearGreed,
	fetchCboePutCallRatio,
	fetchFearGreedChartStock,
	fetchFearGreedMeterStock,
	fetchCfgiStock,
];

export const stockProviderNames = [
	"CNN Fear & Greed",
	"CBOE Put/Call Ratio",
	"FearGreedChart (Stock)",
	"FearGreedMeter (Stock)",
	"CFGI (Stock)",
];

export function getStockMarket(): Market {
	return "stock";
}
