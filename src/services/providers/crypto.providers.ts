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

export const alternativeMe = async (): Promise<ProviderScore> => {
	await sleep(250 + Math.random() * 400);
	if (Math.random() < 0.06) throw new Error("Alternative.me API error");
	const score = Math.max(0, Math.min(100, randomScore() - 10));
	return {
		provider: "Alternative.me",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 4)),
		confidence: 0.8 + Math.random() * 0.15,
		metadata: { source: "alternative_me", market: "crypto" },
	};
};

export const coinMarketCapPlaceholder = async (): Promise<ProviderScore> => {
	await sleep(400 + Math.random() * 600);
	if (Math.random() < 0.1)
		throw new Error("CoinMarketCap placeholder unavailable");
	const score = Math.max(0, Math.min(100, randomScore() + 5));
	return {
		provider: "CoinMarketCap",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 8)),
		confidence: 0.7 + Math.random() * 0.2,
		metadata: { source: "coinmarketcap_placeholder", market: "crypto" },
	};
};

export const cryptoProviderB = async (): Promise<ProviderScore> => {
	await sleep(200 + Math.random() * 300);
	if (Math.random() < 0.04) {
		return {
			provider: "Crypto Provider B",
			score: 0,
			label: "Extreme Fear",
			timestamp: timestamp(60),
			error: "Partial response",
			confidence: 0,
			metadata: { source: "crypto_provider_b", market: "crypto" },
		};
	}
	const score = Math.max(0, Math.min(100, randomScore() + 15));
	return {
		provider: "Crypto Provider B",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 5)),
		confidence: 0.65 + Math.random() * 0.25,
		metadata: { source: "crypto_provider_b", market: "crypto" },
	};
};

export const socialSentiment = async (): Promise<ProviderScore> => {
	await sleep(300 + Math.random() * 500);
	const score = Math.max(0, Math.min(100, randomScore() + 25));
	return {
		provider: "Social Sentiment",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 6)),
		confidence: 0.55 + Math.random() * 0.3,
		metadata: { source: "social_sentiment", market: "crypto" },
	};
};

export const cryptoProviders = [
	alternativeMe,
	coinMarketCapPlaceholder,
	cryptoProviderB,
	socialSentiment,
];
