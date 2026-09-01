import type { ProviderScore } from "../../types/index";
import { sentimentLabel } from "../../utils/sentiment";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function randomScore(): number {
	return Math.floor(Math.random() * 100);
}

function timestamp(minutesAgo = 0): string {
	const d = new Date(Date.now() - minutesAgo * 60_000);
	return d.toISOString();
}

export const cnnFearGreed = async (): Promise<ProviderScore> => {
	await sleep(300 + Math.random() * 500);
	if (Math.random() < 0.05) throw new Error("CNN Fear & Greed API timeout");
	const score = Math.max(0, Math.min(100, randomScore() + 10));
	return {
		provider: "CNN Fear & Greed",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 5)),
		confidence: 0.85 + Math.random() * 0.1,
		metadata: { source: "cnn_fear_greed", market: "stock" },
	};
};

export const marketVane = async (): Promise<ProviderScore> => {
	await sleep(200 + Math.random() * 400);
	if (Math.random() < 0.08)
		throw new Error("Market Vane service unavailable");
	const score = Math.max(0, Math.min(100, randomScore() - 5));
	return {
		provider: "Market Vane",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 10)),
		confidence: 0.7 + Math.random() * 0.2,
		metadata: { source: "market_vane", market: "stock" },
	};
};

export const stockProviderB = async (): Promise<ProviderScore> => {
	await sleep(250 + Math.random() * 350);
	if (Math.random() < 0.03) {
		return {
			provider: "Stock Provider B",
			score: 0,
			label: "Extreme Fear",
			timestamp: timestamp(45),
			error: "Stale data returned",
			confidence: 0,
			metadata: { source: "stock_provider_b", market: "stock" },
		};
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
		metadata: { source: "put_call_ratio", market: "stock" },
	};
};

export const stockProviders = [
	cnnFearGreed,
	marketVane,
	stockProviderB,
	putCall,
];
