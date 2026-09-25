import type { Market } from "../types";
import type { AcquisitionMethod } from "../types";

export interface DataSource {
	name: string;
	market: Market;
	sourceUrl?: string;
	method: AcquisitionMethod | "simulated";
	description: string;
	dataMode: "live" | "mock_only" | "both";
}

export const dataSources: DataSource[] = [
	{
		name: "CNN Fear & Greed",
		market: "stock",
		sourceUrl: "https://www.cnn.com/markets/fear-and-greed",
		method: "api_json",
		description:
			"CNN Business Fear & Greed Index, sourced from their internal sentiment graph data API. Covers multiple sub-indices including junk bond demand, market volatility, put/call ratios, market momentum, and stock prices.",
		dataMode: "both",
	},
	{
		name: "CBOE Put/Call Ratio",
		market: "stock",
		sourceUrl: "https://www.cboe.com/us/options/market_statistics/daily/",
		method: "html_scrape",
		description:
			"Chicago Board Options Exchange daily equity options put/call ratio. A higher ratio indicates more puts relative to calls, which is interpreted as bearish sentiment and translated to a lower fear & greed score.",
		dataMode: "live",
	},
	{
		name: "FearGreedChart (Stock)",
		market: "stock",
		sourceUrl: "https://feargreedchart.com/",
		method: "api_json",
		description:
			"FearGreedChart.com provides a composite stock market fear and greed index derived from seven underlying sentiment indicators. Scores are retrieved via a public JSON API.",
		dataMode: "live",
	},
	{
		name: "FearGreedMeter (Stock)",
		market: "stock",
		sourceUrl: "https://feargreedmeter.com/",
		method: "html_scrape",
		description:
			"FearGreedMeter.com publishes a proprietary stock market sentiment index built from multiple underlying indicators. Data is embedded in the page's Next.js server-side rendered payload.",
		dataMode: "live",
	},
	{
		name: "CFGI (Stock)",
		market: "stock",
		sourceUrl: "https://cfgi.io/",
		method: "html_scrape",
		description:
			"The Crypto Fear & Greed Index (CFGI) by BitFix provides sentiment indices for multiple asset classes including a stock market variant. Scores are rendered in the page's HTML widget embed.",
		dataMode: "live",
	},
	{
		name: "Alternative.me",
		market: "crypto",
		sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/",
		method: "api_json",
		description:
			"Alternative.me's Crypto Fear & Greed Index is a widely-cited sentiment measure derived from volatility, market momentum, social media, dominance, and trading volume. Retrieved via a public JSON API.",
		dataMode: "both",
	},
	{
		name: "CoinMarketCap",
		market: "crypto",
		sourceUrl: "https://coinmarketcap.com/charts/fear-and-greed-index/",
		method: "html_scrape",
		description:
			"CoinMarketCap's Fear & Greed Index measures cryptocurrency market sentiment on a 0-100 scale. Data is embedded in the page's Next.js server-side rendered payload.",
		dataMode: "both",
	},
	{
		name: "FearGreedChart (Crypto)",
		market: "crypto",
		sourceUrl: "https://crypto.feargreedchart.com/",
		method: "api_json",
		description:
			"The crypto variant of FearGreedChart.com's sentiment index. Retrieved via a public JSON API that returns the current score, label, and timestamp.",
		dataMode: "live",
	},
	{
		name: "FearGreedMeter (Crypto)",
		market: "crypto",
		sourceUrl: "https://feargreedmeter.com/crypto",
		method: "html_scrape",
		description:
			"The cryptocurrency variant of FearGreedMeter.com's sentiment index. Data is extracted from the page's Next.js server-side rendered payload.",
		dataMode: "live",
	},
	{
		name: "CFGI (Crypto)",
		market: "crypto",
		sourceUrl: "https://cfgi.io/",
		method: "html_scrape",
		description:
			"The primary cryptocurrency Fear & Greed Index provided by BitFix via CFGI. Scores are rendered in the page's HTML widget embed.",
		dataMode: "live",
	},
	{
		name: "Market Vane",
		market: "stock",
		sourceUrl: "http://www.marketvane.net/",
		method: "simulated",
		description:
			"Market Vane's stock market sentiment model (simulated in mock mode). In production data mode, this provider is not currently available.",
		dataMode: "mock_only",
	},
	{
		name: "Stock Provider B",
		market: "stock",
		sourceUrl: "unknown",
		method: "simulated",
		description:
			"A secondary stock sentiment provider included in mock mode for testing the ARA framework's multi-provider handling. Source URL is intentionally unspecified.",
		dataMode: "mock_only",
	},
	{
		name: "Put/Call Ratio",
		market: "stock",
		sourceUrl: "https://www.cboe.com/us/options/market_statistics/daily/",
		method: "simulated",
		description:
			"A simulated put/call ratio sentiment signal included in mock mode. In production, this is replaced by the CBOE Put/Call Ratio provider above.",
		dataMode: "mock_only",
	},
	{
		name: "NYSE TRIN",
		market: "stock",
		sourceUrl: "https://www.nyse.com/data/trin",
		method: "simulated",
		description:
			"The NYSE Trading Index (TRIN) measures the ratio of advancing to declining issues adjusted for volume. A high TRIN indicates bearish sentiment. Simulated in mock mode.",
		dataMode: "mock_only",
	},
	{
		name: "S&P 500 Put/Call",
		market: "stock",
		sourceUrl: "https://www.cboe.com/us/options/market_statistics/daily/",
		method: "simulated",
		description:
			"S&P 500 put/call ratio sentiment signal. Simulated in mock mode for testing provider diversity on the same underlying data source.",
		dataMode: "mock_only",
	},
	{
		name: "AAII Investor Sentiment",
		market: "stock",
		sourceUrl: "https://www.aaii.com/sentimentsurvey",
		method: "simulated",
		description:
			"The American Association of Individual Investors (AAII) weekly investor sentiment survey measures bullish, bearish, and neutral readings among individual investors. Simulated in mock mode.",
		dataMode: "mock_only",
	},
	{
		name: "Market Breadth Index",
		market: "stock",
		sourceUrl: "https://www.nyse.com/market-statistics",
		method: "simulated",
		description:
			"A market breadth sentiment signal based on advancing vs. declining issues. Simulated in mock mode.",
		dataMode: "mock_only",
	},
	{
		name: "Stock Bullish Sentinel",
		market: "stock",
		sourceUrl: "https://example.com/stock-bullish",
		method: "simulated",
		description:
			"A test-only sentinel provider that always returns a fixed score of 100 (Extreme Greed). Used in mock mode to validate the ARA framework's outlier detection and weighting of extreme values.",
		dataMode: "mock_only",
	},
	{
		name: "Stock Bearish Sentinel",
		market: "stock",
		sourceUrl: "https://example.com/stock-bearish",
		method: "simulated",
		description:
			"A test-only sentinel provider that always returns a fixed score of 0 (Extreme Fear). Used in mock mode alongside the bullish sentinel to stress-test the aggregation strategy selection under extreme disagreement.",
		dataMode: "mock_only",
	},
	{
		name: "Stock Stale Archive",
		market: "stock",
		sourceUrl: "https://example.com/stock-stale",
		method: "simulated",
		description:
			"A test-only provider that returns artificially aged data (8+ hours old). Used in mock mode to validate the ARA framework's temporal decay and staleness penalty logic.",
		dataMode: "mock_only",
	},
	{
		name: "Stock Error Provider",
		market: "stock",
		sourceUrl: "stock_error_provider",
		method: "simulated",
		description:
			"A test-only provider that always returns an error record. Used in mock mode to validate the ARA framework's error handling, exclusion, and transparent failure reporting.",
		dataMode: "mock_only",
	},
	{
		name: "Crypto Provider B",
		market: "crypto",
		sourceUrl: "unknown",
		method: "simulated",
		description:
			"A secondary crypto sentiment provider included in mock mode for testing the ARA framework's multi-provider handling on the crypto side.",
		dataMode: "mock_only",
	},
	{
		name: "Social Sentiment",
		market: "crypto",
		sourceUrl: undefined,
		method: "simulated",
		description:
			"A simulated social media sentiment signal derived from crypto-related discussions. Included in mock mode to represent social-driven sentiment indicators.",
		dataMode: "mock_only",
	},
	{
		name: "CoinGecko Sentiment",
		market: "crypto",
		sourceUrl: "https://www.coingecko.com/",
		method: "simulated",
		description:
			"CoinGecko's cryptocurrency market sentiment data. Simulated in mock mode; in production data mode, CoinGecko is not currently a direct provider.",
		dataMode: "mock_only",
	},
	{
		name: "TradingView Crypto",
		market: "crypto",
		sourceUrl: "https://www.tradingview.com/symbols/CRYPTOCAP-TOTAL/",
		method: "simulated",
		description:
			"TradingView's overall cryptocurrency market sentiment derived from the CRYPTOCAP-TOTAL index and community analysis. Simulated in mock mode.",
		dataMode: "mock_only",
	},
	{
		name: "BTC Dominance",
		market: "crypto",
		sourceUrl: "https://www.coingecko.com/",
		method: "simulated",
		description:
			"Bitcoin's market dominance as a sentiment proxy. High dominance can indicate risk-off sentiment in altcoins. Simulated in mock mode.",
		dataMode: "mock_only",
	},
	{
		name: "Crypto Fear & Greed",
		market: "crypto",
		sourceUrl: "https://alternative.me/crypto/fear-and-greed-index/",
		method: "simulated",
		description:
			"A simulated crypto fear and greed signal. In production, Alternative.me serves this data via API; this mock variant uses simulated scores for testing.",
		dataMode: "mock_only",
	},
	{
		name: "Crypto Bullish Sentinel",
		market: "crypto",
		sourceUrl: "https://example.com/crypto-bullish",
		method: "simulated",
		description:
			"A test-only sentinel provider that always returns a fixed score of 100 (Extreme Greed). Used in mock mode to validate the ARA framework's outlier detection on the crypto side.",
		dataMode: "mock_only",
	},
	{
		name: "Crypto Bearish Sentinel",
		market: "crypto",
		sourceUrl: "https://example.com/crypto-bearish",
		method: "simulated",
		description:
			"A test-only sentinel provider that always returns a fixed score of 0 (Extreme Fear). Used in mock mode alongside the bullish sentinel to stress-test crypto aggregation under extreme disagreement.",
		dataMode: "mock_only",
	},
	{
		name: "Crypto Stale Archive",
		market: "crypto",
		sourceUrl: "https://example.com/crypto-stale",
		method: "simulated",
		description:
			"A test-only crypto provider that returns artificially aged data. Used in mock mode to validate temporal decay behavior on the crypto side.",
		dataMode: "mock_only",
	},
	{
		name: "Crypto Error Provider",
		market: "crypto",
		sourceUrl: "crypto_error_provider",
		method: "simulated",
		description:
			"A test-only crypto provider that always returns an error record. Used in mock mode to validate error handling and transparent failure reporting for crypto providers.",
		dataMode: "mock_only",
	},
];
