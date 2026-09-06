import type { ProviderScore } from "../../types/index";
import { sentimentLabel } from "../../utils/sentiment";
import { providerError } from "../../utils/errors";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function timestamp(minutesAgo = 0): string {
	const d = new Date(Date.now() - minutesAgo * 60_000);
	return d.toISOString();
}

function randomScore(): number {
	return Math.floor(Math.random() * 100);
}

export const cnnFearGreed = async (): Promise<ProviderScore> => {
	await sleep(300 + Math.random() * 500);
	if (Math.random() < 0.05)
		return providerError(
			"CNN Fear & Greed",
			"CNN Fear & Greed API timeout",
			"stock",
			"https://www.cnn.com/markets/fear-and-greed",
		);
	const score = Math.max(0, Math.min(100, randomScore() + 10));
	return {
		provider: "CNN Fear & Greed",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 5)),
		confidence: 0.85 + Math.random() * 0.1,
		source: "https://www.cnn.com/markets/fear-and-greed",
		metadata: { source: "cnn_fear_greed", market: "stock" },
	};
};

export const marketVane = async (): Promise<ProviderScore> => {
	await sleep(200 + Math.random() * 400);
	if (Math.random() < 0.08)
		return providerError(
			"Market Vane",
			"Market Vane service unavailable",
			"stock",
			"http://www.marketvane.net/",
		);
	const score = Math.max(0, Math.min(100, randomScore() - 5));
	return {
		provider: "Market Vane",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 10)),
		confidence: 0.7 + Math.random() * 0.2,
		source: "http://www.marketvane.net/",
		metadata: { source: "market_vane", market: "stock" },
	};
};

export const stockProviderB = async (): Promise<ProviderScore> => {
	await sleep(250 + Math.random() * 350);
	if (Math.random() < 0.03) {
		return providerError(
			"Stock Provider B",
			"Stale data returned",
			"stock",
			"unknown",
		);
	}
	const score = Math.max(0, Math.min(100, randomScore() + 20));
	return {
		provider: "Stock Provider B",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 3)),
		confidence: 0.75 + Math.random() * 0.15,
		metadata: { source: "stock_provider_b", market: "stock" },
	};
};

export const putCall = async (): Promise<ProviderScore> => {
	await sleep(150 + Math.random() * 300);
	const score = Math.max(0, Math.min(100, randomScore()));
	return {
		provider: "Put/Call Ratio",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 7)),
		confidence: 0.6 + Math.random() * 0.25,
		source: "https://www.cboe.com/us/options/market_statistics/daily/",
		metadata: { source: "put_call_ratio", market: "stock" },
	};
};

export const nyseTrin = async (): Promise<ProviderScore> => {
	await sleep(180 + Math.random() * 320);
	if (Math.random() < 0.07)
		return providerError(
			"NYSE TRIN",
			"NYSE TRIN data timeout",
			"stock",
			"https://www.nyse.com/data/trin",
		);
	const score = Math.max(0, Math.min(100, randomScore() - 8));
	return {
		provider: "NYSE TRIN",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 1440)),
		confidence: 0.7 + Math.random() * 0.2,
		source: "https://www.nyse.com/data/trin",
		metadata: { source: "nyse_trin", market: "stock" },
	};
};

export const sp500PutCall = async (): Promise<ProviderScore> => {
	await sleep(220 + Math.random() * 400);
	const score = Math.max(0, Math.min(100, randomScore() + 12));
	return {
		provider: "S&P 500 Put/Call",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 4320)),
		confidence: 0.75 + Math.random() * 0.15,
		source: "https://www.cboe.com/us/options/market_statistics/daily/",
		metadata: { source: "sp500_put_call", market: "stock" },
	};
};

export const investorSentiment = async (): Promise<ProviderScore> => {
	await sleep(280 + Math.random() * 450);
	if (Math.random() < 0.05) {
		return providerError(
			"AAII Investor Sentiment",
			"Weekly survey pending",
			"stock",
			"https://www.aaii.com/sentimentsurvey",
		);
	}
	const score = Math.max(0, Math.min(100, randomScore() + 5));
	return {
		provider: "AAII Investor Sentiment",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 10080)),
		confidence: 0.8 + Math.random() * 0.15,
		source: "https://www.aaii.com/sentimentsurvey",
		metadata: { source: "aaii_sentiment", market: "stock" },
	};
};

export const marketBreadth = async (): Promise<ProviderScore> => {
	await sleep(160 + Math.random() * 280);
	const score = Math.max(0, Math.min(100, randomScore() + 18));
	return {
		provider: "Market Breadth Index",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 60)),
		confidence: 0.65 + Math.random() * 0.2,
		source: "https://www.nyse.com/market-statistics",
		metadata: { source: "market_breadth", market: "stock" },
	};
};

export const stockBullish = async (): Promise<ProviderScore> => {
	await sleep(150 + Math.random() * 250);
	return {
		provider: "Stock Bullish Sentinel",
		score: 100,
		label: "Extreme Greed",
		timestamp: timestamp(Math.floor(Math.random() * 5)),
		confidence: 0.9 + Math.random() * 0.1,
		source: "https://example.com/stock-bullish",
		metadata: { source: "stock_bullish", market: "stock", fixedScore: true },
	};
};

export const stockBearish = async (): Promise<ProviderScore> => {
	await sleep(150 + Math.random() * 250);
	return {
		provider: "Stock Bearish Sentinel",
		score: 0,
		label: "Extreme Fear",
		timestamp: timestamp(Math.floor(Math.random() * 5)),
		confidence: 0.9 + Math.random() * 0.1,
		source: "https://example.com/stock-bearish",
		metadata: { source: "stock_bearish", market: "stock", fixedScore: true },
	};
};

export const stockErrorProvider = async (): Promise<ProviderScore> => {
	await sleep(100 + Math.random() * 200);
	return providerError(
		"Stock Error Provider",
		"Permanently unavailable",
		"stock",
		"stock_error_provider",
	);
};

export const stockProviders = [
	cnnFearGreed,
	marketVane,
	stockProviderB,
	putCall,
	nyseTrin,
	sp500PutCall,
	investorSentiment,
	marketBreadth,
	stockBullish,
	stockBearish,
	stockErrorProvider,
];
