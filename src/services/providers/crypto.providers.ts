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

export const alternativeMe = async (): Promise<ProviderScore> => {
	await sleep(250 + Math.random() * 400);
	if (Math.random() < 0.06)
		return providerError(
			"Alternative.me",
			"Alternative.me API error",
			"crypto",
			"https://alternative.me/crypto/fear-and-greed-index/",
		);
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
		return providerError(
			"CoinMarketCap",
			"CoinMarketCap placeholder unavailable",
			"crypto",
			"https://coinmarketcap.com/charts/fear-and-greed-index/",
		);
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
		return providerError(
			"Crypto Provider B",
			"Partial response",
			"crypto",
			"unknown",
		);
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
	if (Math.random() < 0.06)
		return providerError(
			"CoinGecko Sentiment",
			"CoinGecko API error",
			"crypto",
			"https://www.coingecko.com/",
		);
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
		return providerError(
			"BTC Dominance",
			"Stale dominance data",
			"crypto",
			"https://www.coingecko.com/",
		);
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

export const cryptoBullish = async (): Promise<ProviderScore> => {
	await sleep(150 + Math.random() * 250);
	return {
		provider: "Crypto Bullish Sentinel",
		score: 100,
		label: "Extreme Greed",
		timestamp: timestamp(Math.floor(Math.random() * 5)),
		confidence: 0.9 + Math.random() * 0.1,
		source: "https://example.com/crypto-bullish",
		metadata: { source: "crypto_bullish", market: "crypto", fixedScore: true },
	};
};

export const cryptoBearish = async (): Promise<ProviderScore> => {
	await sleep(150 + Math.random() * 250);
	return {
		provider: "Crypto Bearish Sentinel",
		score: 0,
		label: "Extreme Fear",
		timestamp: timestamp(Math.floor(Math.random() * 5)),
		confidence: 0.9 + Math.random() * 0.1,
		source: "https://example.com/crypto-bearish",
		metadata: { source: "crypto_bearish", market: "crypto", fixedScore: true },
	};
};

export const cryptoStale = async (): Promise<ProviderScore> => {
	await sleep(200 + Math.random() * 300);
	const score = Math.max(0, Math.min(100, randomScore() + 5));
	return {
		provider: "Crypto Stale Archive",
		score,
		label: sentimentLabel(score),
		timestamp: timestamp(Math.floor(Math.random() * 4320) + 4320),
		confidence: 0.5 + Math.random() * 0.2,
		source: "https://example.com/crypto-stale",
		metadata: { source: "crypto_stale", market: "crypto", stale: true },
	};
};

export const cryptoErrorProvider = async (): Promise<ProviderScore> => {
	await sleep(100 + Math.random() * 200);
	return providerError(
		"Crypto Error Provider",
		"Permanently unavailable",
		"crypto",
		"crypto_error_provider",
	);
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
	cryptoBullish,
	cryptoBearish,
	cryptoStale,
	cryptoErrorProvider,
];
