import type {
	AggregationDetails,
	AggregationStrategy,
	ConsensusResult,
	ProviderScore,
} from "../types/index.js";
import { sentimentLabel } from "../utils/sentiment.js";

// ── Configuration Constants ────────────────────────────────────────────────
//
// Every threshold has a statistical rationale. None are tuned to a specific
// dataset; the framework adapts to any input distribution.

const RECENCY_TAU_MIN = 120; // exponential half-life for base age decay (2 hours)
const FRESHNESS_WINDOW_MIN = 4 * 60; // 4 hours — staleness penalty applies after this
const STALENESS_PENALTY_TAU_MIN = 60; // 1 hour half-life for staleness penalty
const OUTLIER_ROBUST_K = 3.5; // robust z-score threshold (Iglewicz & Hoaglin)
const TRIM_FRACTION = 0.2; // fraction trimmed from each tail
const CONFIDENCE_Z_95 = 1.96; // 95% normal CI critical value
const BAYES_PRIOR = 50; // neutral sentiment prior for shrinkage
const BAYES_K = 3; // shrinkage strength (pseudo-weight)
const SMALL_N = 3; // below this → Bayesian shrinkage
const MEDIUM_N = 7; // sample size boundary for strategy tiers
const OUTLIER_RATIO_WARN = 0.4; // above this → switch to median
const CV_LOW = 0.2; // robust CV below this → weighted mean
const CV_HIGH = 0.25; // robust CV above this → median
const LOW_CONFIDENCE_WARN = 0.6; // provider confidence below this → trimmed mean
const TEMPORAL_ALPHA_MIN = 0.3; // minimum weight on current estimate
const TEMPORAL_ALPHA_MAX = 0.8; // maximum weight on current estimate

// ── Utility Functions ──────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function median(values: number[]): number {
	if (values.length === 0) return NaN;
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	if (sorted.length % 2 === 1) return sorted[mid];
	return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function mean(values: number[]): number {
	if (values.length === 0) return NaN;
	return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function weightedMean(values: number[], weights: number[]): number {
	if (values.length === 0) return NaN;
	const sumW = weights.reduce((a, b) => a + b, 0);
	if (sumW === 0) return NaN;
	return Math.round(
		values.reduce((sum, v, i) => sum + weights[i] * v, 0) / sumW,
	);
}

function weightedVariance(
	values: number[],
	weights: number[],
	meanVal: number,
): number {
	if (values.length === 0) return 0;
	const sumW = weights.reduce((a, b) => a + b, 0);
	if (sumW === 0) return 0;
	return (
		values.reduce(
			(sum, v, i) => sum + weights[i] * Math.pow(v - meanVal, 2),
			0,
		) / sumW
	);
}

function effectiveSampleSize(weights: number[]): number {
	if (weights.length === 0) return 0;
	const sumW = weights.reduce((a, b) => a + b, 0);
	const sumWSq = weights.reduce((a, b) => a + b * b, 0);
	if (sumWSq === 0) return 0;
	return Math.pow(sumW, 2) / sumWSq;
}

function normalizeWeights(weights: number[]): number[] {
	const sum = weights.reduce((a, b) => a + b, 0);
	if (sum === 0) {
		return weights.map(() => 1 / weights.length);
	}
	return weights.map((w) => w / sum);
}

// ── Phase 1: Provider Validation & Reliability Weighting ───────────────────

interface WeightedProvider {
	provider: ProviderScore;
	score: number;
	weight: number;
	ageMinutes: number;
	confidence: number;
}

function validateAndWeightProviders(
	providers: ProviderScore[],
	now: number,
): {
	weighted: WeightedProvider[];
} {
	const weighted: WeightedProvider[] = [];
	let errorCount = 0;

	for (const p of providers) {
		if (p.error) {
			errorCount++;
			continue;
		}
		if (typeof p.score !== "number" || Number.isNaN(p.score)) {
			errorCount++;
			continue;
		}
		if (p.score < 0 || p.score > 100) {
			errorCount++;
			continue;
		}
		const ts = new Date(p.timestamp).getTime();
		if (Number.isNaN(ts)) {
			errorCount++;
			continue;
		}
		const ageMinutes = (now - ts) / 60_000;
		if (ageMinutes < 0) {
			errorCount++;
			continue;
		}

		const confidence = p.confidence ?? 0.5;
		const clampedConfidence = clamp(confidence, 0, 1);
		const recencyWeight = Math.exp(-ageMinutes / RECENCY_TAU_MIN);
		const stalenessPenalty = Math.exp(
			-Math.max(0, ageMinutes - FRESHNESS_WINDOW_MIN) /
				STALENESS_PENALTY_TAU_MIN,
		);
		const weight = clampedConfidence * recencyWeight * stalenessPenalty;

		weighted.push({
			provider: p,
			score: p.score,
			weight,
			ageMinutes,
			confidence: clampedConfidence,
		});
	}

	return { weighted };
}

// ── Phase 2: Outlier Detection (MAD-based) ─────────────────────────────────

function detectOutliers(
	scores: number[],
	medianVal: number,
	mad: number,
): boolean[] {
	if (mad === 0 || Number.isNaN(mad)) {
		return scores.map(() => false);
	}
	return scores.map(
		(s) => (0.6745 * Math.abs(s - medianVal)) / mad > OUTLIER_ROBUST_K,
	);
}

// ── Phase 3: Multi-Strategy Estimator Computation ──────────────────────────

interface Estimators {
	weightedMean: number;
	median: number;
	trimmedMean: number;
	bayesian: number;
}

function computeEstimators(
	providers: WeightedProvider[],
	outlierFlags: boolean[],
): Estimators {
	const scores = providers.map((p) => p.score);
	const weights = providers.map((p) => p.weight);
	const n = providers.length;

	const normWeights = normalizeWeights(weights);
	const wMean = weightedMean(scores, normWeights);

	if (Number.isNaN(wMean)) {
		return {
			weightedMean: NaN,
			median: NaN,
			trimmedMean: NaN,
			bayesian: NaN,
		};
	}

	const med = median(scores);

	// Trimmed mean: remove outlier-flagged providers, then apply symmetric
	// trimming (discard top/bottom TRIM_FRACTION) on the remaining set.
	const nonOutlierIndices = outlierFlags
		.map((flag, i) => ({ flag, i }))
		.filter((f) => !f.flag)
		.map((f) => f.i);

	const hasOutliers =
		nonOutlierIndices.length > 0 && nonOutlierIndices.length < n;
	const workingSet = hasOutliers
		? nonOutlierIndices.map((i) => ({
				score: scores[i],
				weight: weights[i],
			}))
		: providers.map((p) => ({ score: p.score, weight: p.weight }));

	const workingN = workingSet.length;
	const trimCount = Math.floor(workingN * TRIM_FRACTION);

	let trimmedMeanVal: number = wMean;

	if (trimCount > 0 && workingN > 2 * trimCount) {
		const sorted = [...workingSet].sort((a, b) => a.score - b.score);
		const slice = sorted.slice(trimCount, workingN - trimCount);
		if (slice.length > 0) {
			const sliceScores = slice.map((p) => p.score);
			const sliceWeights = normalizeWeights(slice.map((p) => p.weight));
			const candidate = weightedMean(sliceScores, sliceWeights);
			if (!Number.isNaN(candidate)) {
				trimmedMeanVal = candidate;
			}
		}
	} else if (hasOutliers && workingN > 0) {
		// Just outlier removal, no symmetric trim
		const candidate = weightedMean(
			workingSet.map((p) => p.score),
			normalizeWeights(workingSet.map((p) => p.weight)),
		);
		if (!Number.isNaN(candidate)) {
			trimmedMeanVal = candidate;
		}
	}

	// Bayesian estimate: shrink weighted mean toward neutral prior
	const sumW = normWeights.reduce((a, b) => a + b, 0);
	const effectiveWeight = sumW * n;
	const bayesian =
		(wMean * effectiveWeight + BAYES_PRIOR * BAYES_K) /
		(effectiveWeight + BAYES_K);

	return {
		weightedMean: wMean,
		median: med,
		trimmedMean: trimmedMeanVal,
		bayesian,
	};
}

// ── Phase 4: Quality Assessment ───────────────────────────────────────────

interface QualityMetrics {
	n: number;
	outlierCount: number;
	outlierRatio: number;
	robustCV: number;
	meanProviderConfidence: number;
	maxAgeMinutes: number;
	effectiveN: number;
}

function assessQuality(
	providers: WeightedProvider[],
	outlierFlags: boolean[],
	mad: number,
	medianVal: number,
): QualityMetrics {
	const n = providers.length;
	const outlierCount = outlierFlags.filter(Boolean).length;
	const outlierRatio = n > 0 ? outlierCount / n : 0;

	const robustCV =
		medianVal !== 0 &&
		!Number.isNaN(medianVal) &&
		mad > 0 &&
		!Number.isNaN(mad)
			? mad / Math.abs(medianVal)
			: 0;

	const meanProviderConfidence =
		n > 0 ? providers.reduce((sum, p) => sum + p.confidence, 0) / n : 0;

	const maxAgeMinutes =
		n > 0 ? Math.max(...providers.map((p) => p.ageMinutes)) : 0;

	return {
		n,
		outlierCount,
		outlierRatio,
		robustCV,
		meanProviderConfidence,
		maxAgeMinutes,
		effectiveN: effectiveSampleSize(providers.map((p) => p.weight)),
	};
}

// ── Phase 5: Strategy Selection ────────────────────────────────────────────

function selectStrategy(q: QualityMetrics): AggregationStrategy {
	if (q.n === 0) return "fallback";
	if (q.n === 1) return "single_provider";
	if (q.n < SMALL_N) return "bayesian_shrinkage";

	if (q.outlierRatio >= OUTLIER_RATIO_WARN) return "median";

	if (q.outlierRatio > 0) {
		if (q.robustCV > CV_HIGH) return "median";
		return "trimmed_mean";
	}

	if (q.n >= MEDIUM_N) {
		if (q.robustCV > CV_HIGH) return "median";
		if (q.robustCV > CV_LOW) return "trimmed_mean";
		if (q.meanProviderConfidence < LOW_CONFIDENCE_WARN)
			return "trimmed_mean";
		return "weighted_mean";
	}

	if (q.robustCV > CV_HIGH) return "median";
	if (q.robustCV > CV_LOW) return "trimmed_mean";
	return "weighted_mean";
}

// ── Phase 6: Score, Confidence & CI Computation ────────────────────────────

function computeScore(
	strategy: AggregationStrategy,
	estimators: Estimators,
	providers: WeightedProvider[],
): number {
	const {
		weightedMean: wm,
		median: med,
		trimmedMean: tm,
		bayesian,
	} = estimators;

	let score: number;

	switch (strategy) {
		case "single_provider":
			score = providers[0].score;
			break;
		case "bayesian_shrinkage":
			score = bayesian;
			break;
		case "trimmed_mean":
			score = tm;
			break;
		case "median":
			score = med;
			break;
		case "weighted_mean":
		case "fallback":
		default:
			score = wm;
			break;
	}

	if (Number.isNaN(score) && !Number.isNaN(wm)) score = wm;
	if (Number.isNaN(score) && !Number.isNaN(med)) score = med;

	return Math.round(clamp(score, 0, 100));
}

function computeConfidence(
	q: QualityMetrics,
	ciLower: number,
	ciUpper: number,
): number {
	if (q.n === 0) return 0;
	if (q.n === 1) {
		return clamp(
			0.15 + 0.3 * (q.meanProviderConfidence - 0.5) + 0.15,
			0,
			1,
		);
	}

	const ciWidth = ciUpper - ciLower;
	const normalizedWidth = ciWidth / 100;
	const ciScore = Math.max(0, 1 - normalizedWidth);

	const base = q.meanProviderConfidence;

	const sizeQuality = q.n >= 7 ? 1.0 : q.n >= 3 ? 0.85 : 0.6;
	const dispersionQuality =
		q.robustCV <= 0.1
			? 1.0
			: q.robustCV <= 0.25
				? 0.8
				: 0.5;
	const outlierQuality =
		q.outlierRatio === 0
			? 1.0
			: q.outlierRatio <= 0.2
				? 0.8
				: 0.5;
	const effectiveNQuality = Math.max(
		0.5,
		Math.min(1, q.effectiveN / Math.max(q.n, 1)),
	);

	const qualityComposite =
		sizeQuality * 0.15 +
		dispersionQuality * 0.35 +
		outlierQuality * 0.25 +
		effectiveNQuality * 0.25;

	const raw = (ciScore * 0.6 + base * 0.25 + qualityComposite * 0.15);

	return clamp(raw, 0, 1);
}

function computeConfidenceInterval(
	score: number,
	providers: WeightedProvider[],
	normWeights: number[],
	strategy: AggregationStrategy,
	medianVal: number,
	mad: number,
	effectiveN: number,
): { ciLower: number; ciUpper: number } {
	const n = providers.length;
	if (n === 0) return { ciLower: score, ciUpper: score };

	const useRobustSE = strategy === "median" || mad > 0;

	let se: number;

	if (useRobustSE && mad > 0) {
		const robustSigma = mad / 0.6745;
		se = robustSigma / Math.sqrt(n);
	} else {
		const scores = providers.map((p) => p.score);
		const wm = weightedMean(scores, normWeights);
		const sigma = Math.sqrt(
			weightedVariance(scores, normWeights, wm || medianVal),
		);
		se = sigma / Math.sqrt(Math.max(effectiveN, 1));
	}

	if (Number.isNaN(se) || se === 0) {
		se = 5;
	}

	const margin = CONFIDENCE_Z_95 * se;
	return {
		ciLower: Math.round(clamp(score - margin, 0, 100)),
		ciUpper: Math.round(clamp(score + margin, 0, 100)),
	};
}

function applyTemporalSmoothing(
	score: number,
	confidence: number,
	previousScore: number | undefined,
): number {
	if (previousScore === undefined) return score;

	const alpha = clamp(
		TEMPORAL_ALPHA_MIN +
			(TEMPORAL_ALPHA_MAX - TEMPORAL_ALPHA_MIN) * confidence,
		TEMPORAL_ALPHA_MIN,
		TEMPORAL_ALPHA_MAX,
	);
	return Math.round(alpha * score + (1 - alpha) * previousScore);
}

// ── Main Aggregation Function ─────────────────────────────────────────────

export function aggregate(
	market: string,
	providers: ProviderScore[],
	previousScore?: number,
): ConsensusResult | null {
	const now = Date.now();

	const { weighted } = validateAndWeightProviders(providers, now);

	if (weighted.length === 0) {
		return null;
	}

	const scores = weighted.map((p) => p.score);
	const weights = weighted.map((p) => p.weight);
	const normWeights = normalizeWeights(weights);

	const medianVal = median(scores);
	const absDeviations = scores.map((s) => Math.abs(s - medianVal));
	const mad = median(absDeviations);

	const outlierFlags = detectOutliers(scores, medianVal, mad);

	const estimators = computeEstimators(weighted, outlierFlags);
	const quality = assessQuality(weighted, outlierFlags, mad, medianVal);
	const strategy = selectStrategy(quality);

	const rawScore = computeScore(strategy, estimators, weighted);

	const preliminaryCI = computeConfidenceInterval(
		rawScore,
		weighted,
		normWeights,
		strategy,
		medianVal,
		mad,
		quality.effectiveN,
	);
	const confidence = computeConfidence(
		quality,
		preliminaryCI.ciLower,
		preliminaryCI.ciUpper,
	);
	const score = applyTemporalSmoothing(rawScore, confidence, previousScore);

	const { ciLower, ciUpper } = computeConfidenceInterval(
		score,
		weighted,
		normWeights,
		strategy,
		medianVal,
		mad,
		quality.effectiveN,
	);

	const timestamps = weighted.map((p) =>
		new Date(p.provider.timestamp).getTime(),
	);
	const lastUpdated = new Date(Math.max(...timestamps)).toISOString();

	const details: AggregationDetails = {
		n: quality.n,
		outlierCount: quality.outlierCount,
		median: Math.round(medianVal),
		weightedMean: Math.round(estimators.weightedMean),
		trimmedMean: Math.round(estimators.trimmedMean),
		mad: Math.round(mad),
		robustCV: Math.round(quality.robustCV * 1000) / 1000,
		effectiveN: Math.round(quality.effectiveN * 100) / 100,
		meanProviderConfidence:
			Math.round(quality.meanProviderConfidence * 1000) / 1000,
		maxAgeMinutes: Math.round(quality.maxAgeMinutes * 10) / 10,
		strategy,
		score,
		confidence: Math.round(confidence * 1000) / 1000,
		ciLower,
		ciUpper,
	};

	return {
		market: market as ConsensusResult["market"],
		score,
		label: sentimentLabel(score),
		providerCount: weighted.length,
		lastUpdated,
		providers,
		confidence: Math.round(confidence * 1000) / 1000,
		ciLower,
		ciUpper,
		strategy,
		details,
	};
}

// ── Re-exports for testing & external use ───────────────────────────────────

export {
	validateAndWeightProviders,
	detectOutliers,
	computeEstimators,
	assessQuality,
	selectStrategy,
	computeScore,
	computeConfidence,
	computeConfidenceInterval,
	applyTemporalSmoothing,
	mean,
	median,
	effectiveSampleSize,
	normalizeWeights,
	RECENCY_TAU_MIN,
	FRESHNESS_WINDOW_MIN,
	STALENESS_PENALTY_TAU_MIN,
};
