import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConsensusCache, DEFAULT_CACHE_TTL_SECONDS } from "./cache";
import type { ConsensusResult } from "../types";

function makeResult(score: number): ConsensusResult {
	return {
		market: "stock",
		score,
		label: "Neutral",
		providerCount: 1,
		lastUpdated: new Date().toISOString(),
		providers: [],
		confidence: 0.8,
		ciLower: 45,
		ciUpper: 55,
		strategy: "single_provider",
		details: {
			n: 1,
			outlierCount: 0,
			median: score,
			weightedMean: score,
			trimmedMean: score,
			mad: 0,
			robustCV: 0,
			effectiveN: 1,
			meanProviderConfidence: 0.8,
			maxAgeMinutes: 0,
			strategy: "single_provider",
			score,
			confidence: 0.8,
			ciLower: 45,
			ciUpper: 55,
		},
	};
}

describe("ConsensusCache", () => {
	let cache: ConsensusCache;

	beforeEach(() => {
		cache = new ConsensusCache(60);
	});

	describe("fresh cache hit", () => {
		it("returns cached data without calling fetcher", async () => {
			const fetcher = vi.fn().mockResolvedValue(makeResult(50));

			const result = await cache.getOrFetch("key", fetcher);
			expect(result.score).toBe(50);
			expect(fetcher).toHaveBeenCalledTimes(1);

			const result2 = await cache.getOrFetch("key", fetcher);
			expect(result2).toBe(result);
			expect(fetcher).toHaveBeenCalledTimes(1);
		});

		it("counts hits and misses in stats", async () => {
			const fetcher = vi.fn().mockResolvedValue(makeResult(50));

			await cache.getOrFetch("key", fetcher);
			await cache.getOrFetch("key", fetcher);

			const stats = cache.getStats();
			expect(stats.misses).toBe(1);
			expect(stats.hits).toBe(1);
		});
	});

	describe("stale cache triggers fetch", () => {
		it("calls fetcher again after TTL expires", async () => {
			const cache = new ConsensusCache(0.001); // ~1ms TTL
			const fetcher = vi
				.fn()
				.mockResolvedValueOnce(makeResult(50))
				.mockResolvedValueOnce(makeResult(60));

			await cache.getOrFetch("key", fetcher);
			expect(fetcher).toHaveBeenCalledTimes(1);

			await new Promise((resolve) => setTimeout(resolve, 10));

			await cache.getOrFetch("key", fetcher);
			expect(fetcher).toHaveBeenCalledTimes(2);
		});
	});

	describe("in-flight deduplication", () => {
		it("shares a single in-flight promise across concurrent requests", async () => {
			let resolveFetcher: (value: ConsensusResult) => void = () => {};
			const slowFetcher = vi.fn(
				() =>
					new Promise<ConsensusResult>((resolve) => {
						resolveFetcher = resolve;
					}),
			);

			const p1 = cache.getOrFetch("key", slowFetcher);
			const p2 = cache.getOrFetch("key", slowFetcher);
			const p3 = cache.getOrFetch("key", slowFetcher);

			expect(slowFetcher).toHaveBeenCalledTimes(1);

			resolveFetcher(makeResult(75));

			const results = await Promise.all([p1, p2, p3]);
			expect(results[0].score).toBe(75);
			expect(results[1]).toBe(results[0]);
			expect(results[2]).toBe(results[0]);
		});

		it("counts concurrent waiters as hits", async () => {
			let resolveFetcher: (value: ConsensusResult) => void = () => {};
			const slowFetcher = vi.fn(
				() =>
					new Promise<ConsensusResult>((resolve) => {
						resolveFetcher = resolve;
					}),
			);

			const p1 = cache.getOrFetch("key", slowFetcher);
			const p2 = cache.getOrFetch("key", slowFetcher);

			resolveFetcher(makeResult(75));
			await Promise.all([p1, p2]);

			const stats = cache.getStats();
			expect(stats.misses).toBe(1);
			expect(stats.hits).toBe(1);
		});
	});

	describe("error handling with stale cache", () => {
		it("returns stale cached data on fetch failure", async () => {
			const cache = new ConsensusCache(0.001); // ~1ms TTL
			const fetcher = vi
				.fn()
				.mockResolvedValueOnce(makeResult(50))
				.mockRejectedValueOnce(new Error("upstream down"));

			// Prime the cache
			await cache.getOrFetch("key", fetcher);
			expect(fetcher).toHaveBeenCalledTimes(1);

			// Wait for TTL to expire
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Fetch fails — should return stale cached data
			const staleResult = await cache.getOrFetch("key", fetcher);
			expect(staleResult.score).toBe(50);
			expect(cache.getStats().staleReturns).toBe(1);
		});

		it("throws when fetch fails and no cache exists", async () => {
			const fetcher = vi.fn().mockRejectedValue(new Error("upstream down"));

			await expect(cache.getOrFetch("key", fetcher)).rejects.toThrow(
				"upstream down",
			);
			expect(cache.getStats().errors).toBe(1);
		});

		it("does not corrupt cache on fetch failure", async () => {
			const cache = new ConsensusCache(0.001); // ~1ms TTL
			const fetcher = vi
				.fn()
				.mockResolvedValueOnce(makeResult(50))
				.mockRejectedValueOnce(new Error("upstream down"));

			// Prime the cache
			await cache.getOrFetch("key", fetcher);

			// Wait for TTL to expire
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Fetch fails — should return stale data without erroring
			const stale = await cache.getOrFetch("key", fetcher);
			expect(stale.score).toBe(50);

			// Error stat should be 0 (stale return, not propagated error)
			expect(cache.getStats().errors).toBe(0);
			expect(cache.getStats().staleReturns).toBe(1);
		});
	});

	describe("stats and management", () => {
		it("getStats returns a copy (not a reference)", async () => {
			const fetcher = vi.fn().mockResolvedValue(makeResult(50));
			await cache.getOrFetch("a", fetcher);

			const stats1 = cache.getStats();
			const stats2 = cache.getStats();
			expect(stats1).toEqual(stats2);

			stats1.hits = 999;
			expect(cache.getStats().hits).not.toBe(999);
		});

		it("resetStats clears all counters", async () => {
			const fetcher = vi.fn().mockResolvedValue(makeResult(50));
			await cache.getOrFetch("a", fetcher);
			await cache.getOrFetch("a", fetcher);

			cache.resetStats();
			expect(cache.getStats()).toEqual({
				hits: 0,
				misses: 0,
				staleReturns: 0,
				errors: 0,
			});
		});

		it("clear removes all entries", async () => {
			const fetcher = vi.fn().mockResolvedValue(makeResult(50));
			await cache.getOrFetch("a", fetcher);
			await cache.getOrFetch("b", fetcher);

			cache.clear();

			const fetcher2 = vi.fn().mockResolvedValue(makeResult(50));
			await cache.getOrFetch("a", fetcher2);
			expect(fetcher2).toHaveBeenCalledTimes(1);
		});
	});

	describe("defaults", () => {
		it("DEFAULT_CACHE_TTL_SECONDS is 60", () => {
			expect(DEFAULT_CACHE_TTL_SECONDS).toBe(60);
		});

		it("uses default TTL when no argument provided", async () => {
			const cache = new ConsensusCache();
			const fetcher = vi.fn().mockResolvedValue(makeResult(50));
			await cache.getOrFetch("key", fetcher);
			expect(fetcher).toHaveBeenCalledTimes(1);
		});
	});

	describe("separate keys", () => {
		it("caches different keys independently", async () => {
			const stockFetcher = vi.fn().mockResolvedValue(makeResult(30));
			const cryptoFetcher = vi.fn().mockResolvedValue(makeResult(70));

			const stockResult = await cache.getOrFetch("stock", stockFetcher);
			const cryptoResult = await cache.getOrFetch("crypto", cryptoFetcher);

			expect(stockResult.score).toBe(30);
			expect(cryptoResult.score).toBe(70);

			// Both cached — further calls should not invoke fetchers
			await cache.getOrFetch("stock", stockFetcher);
			await cache.getOrFetch("crypto", cryptoFetcher);
			expect(stockFetcher).toHaveBeenCalledTimes(1);
			expect(cryptoFetcher).toHaveBeenCalledTimes(1);
		});
	});

	describe("request reduction measurement", () => {
		it("100 concurrent requests share a single upstream fetch", async () => {
			const fetcher = vi.fn().mockResolvedValue(makeResult(50));

			const promises = Array.from({ length: 100 }, () =>
				cache.getOrFetch("key", fetcher),
			);
			await Promise.all(promises);

			expect(fetcher).toHaveBeenCalledTimes(1);
		});

		it("repeated requests within TTL do not trigger upstream fetches", async () => {
			const fetcher = vi.fn().mockResolvedValue(makeResult(50));

			for (let i = 0; i < 20; i++) {
				await cache.getOrFetch("key", fetcher);
			}

			expect(fetcher).toHaveBeenCalledTimes(1);
		});

		it("concurrent requests for two markets each trigger one fetch", async () => {
			const stockFetcher = vi.fn().mockResolvedValue(makeResult(30));
			const cryptoFetcher = vi.fn().mockResolvedValue(makeResult(70));

			await Promise.all([
				...Array.from({ length: 50 }, () =>
					cache.getOrFetch("stock", stockFetcher),
				),
				...Array.from({ length: 50 }, () =>
					cache.getOrFetch("crypto", cryptoFetcher),
				),
			]);

			expect(stockFetcher).toHaveBeenCalledTimes(1);
			expect(cryptoFetcher).toHaveBeenCalledTimes(1);
		});
	});
});
