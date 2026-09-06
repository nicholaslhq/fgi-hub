import type { ProviderScore } from "../../types/index";
import { sentimentLabel } from "../../utils/sentiment";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function timestamp(minutesAgo = 0): string {
	const d = new Date(Date.now() - minutesAgo * 60_000);
	return d.toISOString();
}

function randomScore(): number {
	return Math.floor(Math.random() * 100);
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
		source: "https://alternative.me/crypto/fear-and-greed-index/",
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
		source: "https://coinmarketcap.com/charts/fear-and-greed-index/",
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

export const coinGecko = async (): Promise<ProviderScore> => {
	await sleep(200 + Math.random() * 350);
	if (Math.random() < 0.06) throw new Error("CoinGecko API error");
	const score = Math.max(0, Math.min(100, randomScore() + 8));
	return {
		provider: "CoinGecko Sentiment",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 120)),
		confidence: 0.75 + Math.random() * 0.2,
		source: "https://www.coingecko.com/",
		metadata: { source: "coingecko", market: "crypto" },
	};
};

export const tradingView = async (): Promise<ProviderScore> => {
	await sleep(250 + Math.random() * 400);
	const score = Math.max(0, Math.min(100, randomScore() + 20));
	return {
		provider: "TradingView Crypto",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 30)),
		confidence: 0.7 + Math.random() * 0.2,
		source: "https://www.tradingview.com/symbols/CRYPTOCAP-TOTAL/",
		metadata: { source: "tradingview", market: "crypto" },
	};
};

export const bitcoinDominance = async (): Promise<ProviderScore> => {
	await sleep(180 + Math.random() * 300);
	if (Math.random() < 0.04) {
		return {
			provider: "BTC Dominance",
			score: 0,
			label: "Extreme Fear",
			timestamp: timestamp(4320),
			error: "Stale dominance data",
			confidence: 0,
			metadata: { source: "btc_dominance", market: "crypto" },
		};
	}
	const score = Math.max(0, Math.min(100, randomScore() - 5));
	return {
		provider: "BTC Dominance",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 4320)),
		confidence: 0.8 + Math.random() * 0.15,
		source: "https://www.coingecko.com/",
		metadata: { source: "btc_dominance", market: "crypto" },
	};
};

export const fearGreedCrypto = async (): Promise<ProviderScore> => {
	await sleep(300 + Math.random() * 500);
	const score = Math.max(0, Math.min(100, randomScore() + 10));
	return {
		provider: "Crypto Fear & Greed",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 1440)),
		confidence: 0.85 + Math.random() * 0.1,
		source: "https://alternative.me/crypto/fear-and-greed-index/",
		metadata: { source: "crypto_fear_greed", market: "crypto" },
	};
};

export const cryptoErrorProvider = async (): Promise<ProviderScore> => {
	await sleep(100 + Math.random() * 200);
	return {
		provider: "Crypto Error Provider",
		score: 0,
		label: "Extreme Fear",
		timestamp: timestamp(Math.floor(Math.random() * 10)),
		error: "Permanently unavailable",
		confidence: 0,
		metadata: { source: "crypto_error_provider", market: "crypto" },
	};
};

export const cryptoProviders = [
	alternativeMe,
	coinMarketCapPlaceholder,
	cryptoProviderB,
	socialSentiment,
	coinGecko,
	tradingView,
	bitcoinDominance,
	fearGreedCrypto,
	cryptoErrorProvider,
];
