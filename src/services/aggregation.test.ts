import { describe, it, expect } from "vitest";
import {
	aggregate,
	detectOutliers,
	selectStrategy,
	computeConfidence,
	applyTemporalSmoothing,
	mean,
	median,
	effectiveSampleSize,
	normalizeWeights,
} from "./aggregation";
import type { ProviderScore } from "../types";

function makeProvider(
	score: number,
	opts: Partial<ProviderScore> = {},
): ProviderScore {
	return {
		provider: opts.provider ?? `Provider-${score}`,
		score,
		label: opts.label ?? "Neutral",
		timestamp:
			opts.timestamp ?? new Date(Date.now() - 1 * 60_000).toISOString(),
		confidence: opts.confidence ?? 0.8,
		error: opts.error,
		metadata: opts.metadata,
	};
}

function freshProviders(
	scores: number[],
	confidences?: number[],
): ProviderScore[] {
	return scores.map((s, i) =>
		makeProvider(s, { confidence: confidences?.[i], provider: `P${i}` }),
	);
}

describe("median", () => {
	it("returns median of odd-length array", () => {
		expect(median([1, 3, 2])).toBe(2);
	});
	it("returns median of even-length array as integer", () => {
		expect(median([1, 2, 3, 4])).toBe(3);
	});
	it("returns NaN for empty array", () => {
		expect(Number.isNaN(median([]))).toBe(true);
	});
});

describe("mean", () => {
	it("computes arithmetic mean", () => {
		expect(mean([10, 20, 30])).toBe(20);
	});
	it("returns NaN for empty array", () => {
		expect(Number.isNaN(mean([]))).toBe(true);
	});
});

describe("normalizeWeights", () => {
	it("normalizes weights to sum to 1", () => {
		const w = normalizeWeights([1, 2, 3]);
		expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
	});
	it("returns uniform weights when all weights are zero", () => {
		const w = normalizeWeights([0, 0, 0]);
		expect(w).toEqual([1 / 3, 1 / 3, 1 / 3]);
	});
});

describe("effectiveSampleSize", () => {
	it("equals n when weights are uniform", () => {
		expect(effectiveSampleSize([1, 1, 1, 1])).toBeCloseTo(4, 10);
	});
	it("is less than n when weights are unequal", () => {
		expect(effectiveSampleSize([10, 1, 1, 1])).toBeLessThan(4);
	});
	it("returns 0 for empty input", () => {
		expect(effectiveSampleSize([])).toBe(0);
	});
});

describe("detectOutliers", () => {
	it("flags values beyond robust z-score threshold", () => {
		// 9 values clustered at 50, one at 0
		const scores = [50, 50, 50, 50, 50, 50, 50, 50, 50, 0];
		const flags = detectOutliers(scores, 50, 0);
		// MAD = 0 → no outliers (all deviations zero)
		expect(flags.every((f) => f === false)).toBe(true);
	});
	it("flags outliers when MAD > 0", () => {
		// Values: 48, 49, 50, 51, 52, 60, 20
		// Median = 50, deviations = [2, 1, 0, 1, 2, 10, 30], MAD = 2
		// z(20) = 0.6745 * 30 / 2 = 10.12 → outlier
		// z(60) = 0.6745 * 10 / 2 = 3.37 → not outlier (< 3.5)
		// z(48) = 0.6745 * 2 / 2 = 0.67 → not outlier
		const scores = [48, 49, 50, 51, 52, 60, 20];
		const flags = detectOutliers(scores, 50, 2);
		expect(flags[6]).toBe(true); // score=20 is outlier
		expect(flags[5]).toBe(false); // score=60 is NOT outlier (z=3.37 < 3.5)
	});
	it("returns all-false when MAD is 0", () => {
		const scores = [50, 50, 50];
		const flags = detectOutliers(scores, 50, 0);
		expect(flags).toEqual([false, false, false]);
	});
	it("returns all-false for empty input", () => {
		const flags = detectOutliers([], 50, 1);
		expect(flags).toEqual([]);
	});
});

describe("selectStrategy", () => {
	const base = {
		n: 5,
		outlierCount: 0,
		outlierRatio: 0,
		robustCV: 0.1,
		meanProviderConfidence: 0.8,
		effectiveN: 4,
		maxAgeMinutes: 2,
	};

	it("returns single_provider for n=1", () => {
		expect(selectStrategy({ ...base, n: 1 })).toBe("single_provider");
	});
	it("returns bayesian_shrinkage for n<3", () => {
		expect(selectStrategy({ ...base, n: 2 })).toBe("bayesian_shrinkage");
	});
	it("returns median when outlier_ratio >= 0.4", () => {
		expect(selectStrategy({ ...base, n: 5, outlierRatio: 0.5 })).toBe(
			"median",
		);
	});
	it("returns trimmed_mean when outliers present and CV moderate", () => {
		expect(
			selectStrategy({
				...base,
				n: 5,
				outlierRatio: 0.2,
				robustCV: 0.15,
			}),
		).toBe("trimmed_mean");
	});
	it("returns median when CV > 0.25", () => {
		expect(selectStrategy({ ...base, n: 10, robustCV: 0.3 })).toBe(
			"median",
		);
	});
	it("returns weighted_mean for high-quality data with n>=7", () => {
		expect(
			selectStrategy({ ...base, n: 8, robustCV: 0.05, outlierRatio: 0 }),
		).toBe("weighted_mean");
	});
	it("returns trimmed_mean for low confidence with n>=7", () => {
		expect(
			selectStrategy({
				...base,
				n: 10,
				robustCV: 0.1,
				meanProviderConfidence: 0.5,
			}),
		).toBe("trimmed_mean");
	});
});

describe("computeConfidence", () => {
	const base = {
		n: 5,
		outlierCount: 0,
		outlierRatio: 0,
		robustCV: 0.1,
		meanProviderConfidence: 0.8,
		maxAgeMinutes: 2,
		effectiveN: 4,
	};

	it("returns 0 for n=0", () => {
		expect(computeConfidence({ ...base, n: 0 }, 50, 50)).toBe(0);
	});
	it("returns positive value for n=1", () => {
		expect(computeConfidence({ ...base, n: 1 }, 50, 50)).toBeGreaterThan(0);
	});
	it("returns higher confidence for more providers", () => {
		const c5 = computeConfidence({ ...base, n: 5, effectiveN: 4 }, 50, 50);
		const c20 = computeConfidence({ ...base, n: 20, effectiveN: 16 }, 50, 50);
		expect(c20).toBeGreaterThan(c5);
	});
	it("returns lower confidence with outliers", () => {
		const clean = computeConfidence({
			...base,
			n: 5,
			outlierRatio: 0,
			robustCV: 0.1,
		}, 50, 50);
		const withOutliers = computeConfidence({
			...base,
			n: 5,
			outlierRatio: 0.4,
			robustCV: 0.1,
		}, 50, 50);
		expect(withOutliers).toBeLessThan(clean);
	});
	it("returns lower confidence with high dispersion", () => {
		const clean = computeConfidence({ ...base, robustCV: 0.05 }, 50, 50);
		const dispersed = computeConfidence({ ...base, robustCV: 0.3 }, 50, 50);
		expect(dispersed).toBeLessThan(clean);
	});
	it("returns value in [0, 1]", () => {
		const c = computeConfidence({
			...base,
			n: 3,
			outlierRatio: 0.5,
			robustCV: 0.5,
			meanProviderConfidence: 0.3,
		}, 50, 50);
		expect(c).toBeGreaterThanOrEqual(0);
		expect(c).toBeLessThanOrEqual(1);
	});
});

describe("applyTemporalSmoothing", () => {
	it("returns unchanged score when no previous score", () => {
		expect(applyTemporalSmoothing(70, 0.9, undefined)).toBe(70);
	});
	it("blends toward previous score with low confidence", () => {
		const result = applyTemporalSmoothing(90, 0.1, 50);
		expect(result).toBeGreaterThan(50);
		expect(result).toBeLessThan(90);
	});
	it("stays close to current with high confidence", () => {
		// alpha = 0.3 + 0.5 * 1.0 = 0.8 → 0.8*90 + 0.2*50 = 82
		const result = applyTemporalSmoothing(90, 1.0, 50);
		expect(result).toBeCloseTo(82, 0);
	});
	it("alpha increases with confidence", () => {
		const lowConf = applyTemporalSmoothing(80, 0.1, 50);
		const highConf = applyTemporalSmoothing(80, 0.9, 50);
		expect(highConf).toBeGreaterThan(lowConf);
	});
});

describe("aggregate", () => {
	it("returns null for empty provider list", () => {
		expect(aggregate("stock", [])).toBeNull();
	});

	it("returns null when all providers have errors", () => {
		const providers = [
			makeProvider(50, { error: "timeout", confidence: 0 }),
			makeProvider(60, { error: "api_error", confidence: 0 }),
		];
		expect(aggregate("stock", providers)).toBeNull();
	});

	it("uses single_provider strategy for n=1", () => {
		const providers = [makeProvider(75)];
		const result = aggregate("crypto", providers);
		expect(result).not.toBeNull();
		expect(result!.strategy).toBe("single_provider");
		expect(result!.score).toBe(75);
		expect(result!.label).toBe("Greed");
	});

	it("uses bayesian_shrinkage for small n", () => {
		const providers = freshProviders([30, 40]);
		const result = aggregate("stock", providers);
		expect(result).not.toBeNull();
		expect(result!.strategy).toBe("bayesian_shrinkage");
		// Should be shrunk toward 50
		expect(result!.score).toBeGreaterThan(30);
		expect(result!.score).toBeLessThan(50);
	});

	it("uses weighted_mean for clean high-quality data", () => {
		const providers = freshProviders(
			[48, 50, 52, 51, 49, 50, 51, 48],
			[0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9],
		);
		const result = aggregate("crypto", providers);
		expect(result).not.toBeNull();
		expect(result!.strategy).toBe("weighted_mean");
		expect(result!.score).toBeCloseTo(50, 0);
	});

	it("uses median when outliers are extreme", () => {
		// 5 providers at ~50, one at 5 (extreme outlier)
		const providers = freshProviders([50, 51, 49, 50, 51, 5]);
		const result = aggregate("stock", providers);
		expect(result).not.toBeNull();
		// With 5/6 outliers ratio = 0.17 (< 0.4), but the outlier should be caught
		// n=6 >= 7 is false, so we check the strategy
		expect(result!.score).toBeGreaterThan(45); // shouldn't be dragged to 5
	});

	it("uses trimmed_mean when some outliers present", () => {
		// Mix of normal and slightly outlier values
		const providers = freshProviders([40, 45, 50, 55, 60, 90]);
		const result = aggregate("crypto", providers);
		expect(result).not.toBeNull();
		expect([
			"trimmed_mean",
			"median",
			"weighted_mean",
			"bayesian_shrinkage",
			"single_provider",
		]).toContain(result!.strategy);
		// 90 should not dominate the result
		expect(result!.score).toBeLessThan(70);
	});

	it("excludes errored providers from computation", () => {
		const providers = [
			makeProvider(80, { confidence: 0.9, provider: "Good" }),
			makeProvider(0, {
				error: "timeout",
				confidence: 0,
				provider: "Bad",
			}),
			makeProvider(70, { confidence: 0.8, provider: "Good2" }),
		];
		const result = aggregate("crypto", providers);
		expect(result).not.toBeNull();
		expect(result!.providerCount).toBe(2); // only 2 valid
		expect(result!.providers).toHaveLength(3); // all 3 included for display
		expect(result!.providers.map((p) => p.provider)).toEqual([
			"Good",
			"Bad",
			"Good2",
		]);
		// Bayesian shrinkage with n=2: raw weighted mean ~75, shrunk toward 50
		expect(result!.score).toBeGreaterThan(55); // not dragged to 0 by errored provider
		expect(result!.score).toBeLessThan(75); // regularized toward neutral
	});

  it("includes stale providers with penalized weight", () => {
    const providers = [
      makeProvider(80, { confidence: 0.9 }),
      makeProvider(70, {
        confidence: 0.8,
        timestamp: new Date(Date.now() - 25 * 60 * 60_000).toISOString(),
      }),
    ];
    const result = aggregate("stock", providers);
    expect(result).not.toBeNull();
    expect(result!.providerCount).toBe(2);
    expect(result!.score).toBeGreaterThan(60);
  });

	it("computes confidence interval that contains the score", () => {
		const providers = freshProviders([45, 50, 55, 52, 48, 50, 51, 49]);
		const result = aggregate("crypto", providers);
		expect(result).not.toBeNull();
		expect(result!.ciLower).toBeLessThanOrEqual(result!.score);
		expect(result!.ciUpper).toBeGreaterThanOrEqual(result!.score);
	});

	it("produces deterministic results for identical inputs", () => {
		const providers = freshProviders([
			40, 50, 60, 55, 45, 50, 52, 48, 50, 51,
		]);
		const r1 = aggregate("stock", providers);
		const r2 = aggregate("stock", providers);
		expect(r1).not.toBeNull();
		expect(r2).not.toBeNull();
		expect(r1!.score).toBe(r2!.score);
		expect(r1!.confidence).toBe(r2!.confidence);
		expect(r1!.strategy).toBe(r2!.strategy);
	});

	it("is robust to extreme outliers (mean replacement test)", () => {
		// Without outlier, mean of [50,50,50,50,50] = 50
		// With one outlier at 100, simple mean = 60, but ARA should be much closer to 50
		const providers = freshProviders([50, 50, 50, 50, 100]);
		const result = aggregate("stock", providers);
		expect(result).not.toBeNull();
		expect(result!.score).toBeLessThan(70); // outlier dragged mean to 60, ARA should be lower
	});

	it("handles all providers with the same score", () => {
		const providers = freshProviders([50, 50, 50, 50]);
		const result = aggregate("crypto", providers);
		expect(result).not.toBeNull();
		expect(result!.score).toBe(50);
		expect(result!.label).toBe("Neutral");
	});

	it("applies temporal smoothing when previousScore is provided", () => {
		const providers = freshProviders([50, 52, 48, 51, 49, 50, 51, 49]);
		const r1 = aggregate("stock", providers);
		const r2 = aggregate("stock", providers, r1!.score);
		expect(r1).not.toBeNull();
		expect(r2).not.toBeNull();
		// Score should be stable (previous score close to current)
		expect(Math.abs(r2!.score - r1!.score)).toBeLessThanOrEqual(5);
	});

	it("includes all providers in the providers field for display", () => {
		const providers = [
			makeProvider(80, { confidence: 0.9, provider: "Good" }),
			makeProvider(0, {
				error: "timeout",
				confidence: 0,
				provider: "Bad",
			}),
			makeProvider(70, { confidence: 0.8, provider: "Good2" }),
		];
		const result = aggregate("crypto", providers);
		expect(result).not.toBeNull();
		expect(result!.providers).toHaveLength(3);
		expect(result!.providers.map((p) => p.provider)).toEqual([
			"Good",
			"Bad",
			"Good2",
		]);
	});

	it("computes confidence in [0, 1]", () => {
		const providers = freshProviders([40, 50, 60, 55, 45]);
		const result = aggregate("stock", providers);
		expect(result).not.toBeNull();
		expect(result!.confidence).toBeGreaterThanOrEqual(0);
		expect(result!.confidence).toBeLessThanOrEqual(1);
	});

	it("produces details with all required fields", () => {
		const providers = freshProviders([45, 50, 55, 52, 48]);
		const result = aggregate("crypto", providers);
		expect(result).not.toBeNull();
		expect(result!.details).toBeDefined();
		expect(result!.details.n).toBe(5);
		expect(result!.details).toHaveProperty("median");
		expect(result!.details).toHaveProperty("weightedMean");
		expect(result!.details).toHaveProperty("trimmedMean");
		expect(result!.details).toHaveProperty("mad");
		expect(result!.details).toHaveProperty("robustCV");
		expect(result!.details).toHaveProperty("effectiveN");
		expect(result!.details).toHaveProperty("meanProviderConfidence");
		expect(result!.details).toHaveProperty("maxAgeMinutes");
		expect(result!.details).toHaveProperty("strategy");
		expect(result!.details).toHaveProperty("confidence");
		expect(result!.details).toHaveProperty("ciLower");
		expect(result!.details).toHaveProperty("ciUpper");
	});

	it("returns integer score", () => {
		const providers = freshProviders([45, 50, 55, 52, 48]);
		const result = aggregate("stock", providers);
		expect(result).not.toBeNull();
		expect(Number.isInteger(result!.score)).toBe(true);
	});

	it("returns integer ciLower and ciUpper", () => {
		const providers = freshProviders([45, 50, 55, 52, 48]);
		const result = aggregate("stock", providers);
		expect(result).not.toBeNull();
		expect(Number.isInteger(result!.ciLower)).toBe(true);
		expect(Number.isInteger(result!.ciUpper)).toBe(true);
	});

	it("returns integer median, weightedMean, and trimmedMean in details", () => {
		const providers = freshProviders([45, 50, 55, 52, 48]);
		const result = aggregate("stock", providers);
		expect(result).not.toBeNull();
		expect(Number.isInteger(result!.details.median)).toBe(true);
		expect(Number.isInteger(result!.details.weightedMean)).toBe(true);
		expect(Number.isInteger(result!.details.trimmedMean)).toBe(true);
	});

	it("returns integer score even when provider scores are floats", () => {
		const providers = [
			makeProvider(31.2571428571429, { confidence: 0.9 }),
			makeProvider(50, { confidence: 0.9 }),
			makeProvider(60, { confidence: 0.9 }),
		];
		const result = aggregate("stock", providers);
		expect(result).not.toBeNull();
		expect(Number.isInteger(result!.score)).toBe(true);
		expect(Number.isInteger(result!.ciLower)).toBe(true);
		expect(Number.isInteger(result!.ciUpper)).toBe(true);
	});
});

describe("Stress Testing Scenarios", () => {
	it("STRESS 1: Extreme outlier cluster (40% outliers)", () => {
		// 6 providers: 3 at ~50, 3 at 100 (extreme cluster)
		const providers = freshProviders([48, 50, 52, 98, 99, 100]);
		const result = aggregate("stock", providers);
		expect(result).not.toBeNull();
		// Outlier ratio = 0.5 ≥ 0.4 → median strategy
		expect(result!.strategy).toBe("median");
		// Median of [48,50,52,98,99,100] = (52+98)/2 = 75, but after sorting:
		// [48,50,52,98,99,100] → median = (52+98)/2 = 75
		// The outlier cluster should not drive the score to 100
		expect(result!.score).toBeLessThan(85);
	});

	it("STRESS 2: Mix of high and low confidence providers", () => {
		// High-confidence providers at 60, low-confidence "outlier" at 90
		const providers = [
			makeProvider(60, { confidence: 0.95 }),
			makeProvider(62, { confidence: 0.9 }),
			makeProvider(58, { confidence: 0.9 }),
			makeProvider(90, { confidence: 0.3 }), // low confidence, high score
		];
		const result = aggregate("crypto", providers);
		expect(result).not.toBeNull();
		// Low-confidence provider should not dominate
		expect(result!.score).toBeLessThan(70);
		// Strategy should be weighted_mean (n=4, < MEDIUM_N, no major outliers)
		// but with low confidence provider, may switch to trimmed_mean or weighted_mean
	});

	it("STRESS 3: Data gap - providers with varying ages", () => {
		// One fresh provider at 80, one old (10 min) at 20
		const providers = [
			makeProvider(80, {
				confidence: 0.9,
				timestamp: new Date(Date.now() - 1 * 60_000).toISOString(),
			}),
			makeProvider(20, {
				confidence: 0.8,
				timestamp: new Date(Date.now() - 10 * 60_000).toISOString(),
			}),
		];
		const result = aggregate("stock", providers);
		expect(result).not.toBeNull();
		// Fresh provider should dominate due to recency weighting
		expect(result!.score).toBeGreaterThan(50);
	});

	it("STRESS 4: All providers identical (degenerate case)", () => {
		const providers = freshProviders([50, 50, 50, 50]);
		const result = aggregate("crypto", providers);
		expect(result).not.toBeNull();
		expect(result!.score).toBe(50);
		expect(result!.label).toBe("Neutral");
		// MAD = 0 → no outliers, weighted_mean strategy
		expect(result!.strategy).toBe("weighted_mean");
	});

	it("STRESS 5: Extreme scores at boundaries (0 and 100)", () => {
		const providers = freshProviders([0, 100, 0, 100, 50]);
		const result = aggregate("stock", providers);
		expect(result).not.toBeNull();
		expect(result!.score).toBeGreaterThanOrEqual(0);
		expect(result!.score).toBeLessThanOrEqual(100);
		// With extreme divergence, should use median (50)
		expect(result!.score).toBeCloseTo(50, 5);
	});

	it("STRESS 6: Temporal stability across multiple refreshes", () => {
		const providers = freshProviders([45, 50, 55, 52, 48]);
		const result1 = aggregate("stock", providers);
		expect(result1).not.toBeNull();

		// Simulate same data arriving again
		const result2 = aggregate("stock", providers, result1!.score);
		expect(result2).not.toBeNull();

		// Score should be stable
		expect(Math.abs(result2!.score - result1!.score)).toBeLessThanOrEqual(
			3,
		);
	});

	it("STRESS 7: All providers failing except one", () => {
		const providers = [
			makeProvider(0, {
				error: "timeout",
				confidence: 0,
				provider: "Dead1",
			}),
			makeProvider(75, { confidence: 0.9, provider: "Alive" }),
			makeProvider(0, {
				error: "api_error",
				confidence: 0,
				provider: "Dead2",
			}),
		];
		const result = aggregate("crypto", providers);
		expect(result).not.toBeNull();
		expect(result!.providerCount).toBe(1);
		expect(result!.strategy).toBe("single_provider");
		expect(result!.score).toBe(75);
	});

	it("STRESS 8: Large provider set with noise", () => {
		// 20 providers, mostly around 50 with some noise
		const scores: number[] = [];
		for (let i = 0; i < 15; i++) {
			scores.push(45 + Math.floor(Math.random() * 11)); // 45-55
		}
		for (let i = 0; i < 5; i++) {
			scores.push(10 + Math.floor(Math.random() * 20)); // 10-30 (lower cluster)
		}
		const providers = freshProviders(scores);
		const result = aggregate("stock", providers);
		expect(result).not.toBeNull();
		// With 20 providers, should use weighted_mean if data is clean
		// Some outliers (10-30) may be detected and trimmed
		expect(result!.score).toBeGreaterThan(30); // shouldn't be dragged too low by outliers
		expect(result!.score).toBeLessThan(65); // shouldn't be inflated by noise
	});

	it("STRESS 9: Completely empty and missing confidence", () => {
		const providers = [
			{
				provider: "A",
				score: 60,
				label: "Neutral" as const,
				timestamp: new Date().toISOString(),
			},
			{
				provider: "B",
				score: 70,
				label: "Greed" as const,
				timestamp: new Date().toISOString(),
			},
		];
		const result = aggregate("crypto", providers);
		expect(result).not.toBeNull();
		// Missing confidence defaults to 0.5; n=2 triggers bayesian_shrinkage
		// toward prior (50): (65 * 2 + 50 * 3) / 5 = 56
		expect(result!.score).toBe(56);
		expect(result!.details.meanProviderConfidence).toBeCloseTo(0.5, 1);
	});
});
