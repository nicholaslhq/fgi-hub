export type Market = "stock" | "crypto";

export type SentimentLabel =
	| "Extreme Fear"
	| "Fear"
	| "Neutral"
	| "Greed"
	| "Extreme Greed";

export type AcquisitionMethod =
	| "api_json"
	| "html_scrape"
	| "csv_download"
	| "websocket"
	| "graphql"
	| "fallback";

export type DataFreshness = "realtime" | "delayed" | "stale" | "expired";

export interface ProviderScore {
	provider: string;
	score: number;
	label: SentimentLabel;
	timestamp: string;
	confidence?: number;
	metadata?: Record<string, unknown>;
	error?: string;
	market?: Market;
	source?: string;
	method?: AcquisitionMethod;
	retrievedAt?: string;
	freshness?: DataFreshness;
}

export type AggregationStrategy =
	| "weighted_mean"
	| "median"
	| "trimmed_mean"
	| "bayesian_shrinkage"
	| "single_provider"
	| "fallback";

export interface AggregationDetails {
	n: number;
	outlierCount: number;
	median: number;
	weightedMean: number;
	trimmedMean: number;
	mad: number;
	robustCV: number;
	effectiveN: number;
	meanProviderConfidence: number;
	maxAgeMinutes: number;
	strategy: AggregationStrategy;
	score: number;
	confidence: number;
	ciLower: number;
	ciUpper: number;
}

export interface ConsensusResult {
	market: Market;
	score: number;
	label: SentimentLabel;
	providerCount: number;
	lastUpdated: string;
	providers: ProviderScore[];
	confidence: number;
	ciLower: number;
	ciUpper: number;
	strategy: AggregationStrategy;
	details: AggregationDetails;
}

export type ProviderStatus = "idle" | "loading" | "success" | "error" | "empty";

export interface AppState {
	stock: ConsensusResult | null;
	crypto: ConsensusResult | null;
	status: ProviderStatus;
	lastRefreshed: string | null;
	error: string | null;
}
