import type { AggregationStrategy } from "../types";

const STRATEGY_LABELS: Record<AggregationStrategy, string> = {
	weighted_mean: "Weighted Mean",
	median: "Median",
	trimmed_mean: "Trimmed Mean",
	bayesian_shrinkage: "Bayesian Shrinkage",
	single_provider: "Single Provider",
	fallback: "Fallback",
};

const STRATEGY_DESCRIPTIONS: Record<AggregationStrategy, string> = {
	weighted_mean: "reliability-weighted",
	median: "robust center",
	trimmed_mean: "outlier-resistant",
	bayesian_shrinkage: "empirical Bayes ",
	single_provider: "single source",
	fallback: "system fallback",
};

export function formatStrategyName(
	strategy: AggregationStrategy | undefined | string,
): string {
	if (!strategy) return "Weighted Mean";
	if (strategy in STRATEGY_LABELS) {
		return STRATEGY_LABELS[strategy as AggregationStrategy];
	}
	return strategy
		.split("_")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}

export function formatStrategyDescription(
	strategy: AggregationStrategy | undefined | string,
): string {
	if (!strategy) return "reliability-weighted average";
	if (strategy in STRATEGY_DESCRIPTIONS) {
		return STRATEGY_DESCRIPTIONS[strategy as AggregationStrategy];
	}
	return "system fallback";
}
