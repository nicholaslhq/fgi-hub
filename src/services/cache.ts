import type { ConsensusResult } from "../types/index.js";

export const DEFAULT_CACHE_TTL_SECONDS = 60;
const MIN_CACHE_TTL_MS = 1;

export interface CacheEntry {
	data: ConsensusResult;
	expiresAt: number;
}

export interface CacheStats {
	hits: number;
	misses: number;
	staleReturns: number;
	errors: number;
}

/**
 * In-memory cache for consensus results with TTL-based expiration,
 * in-flight request deduplication, and stale-data fallback.
 *
 * Designed for single-process use. The cache is not shared across
 * multiple server processes; each Node.js process holds its own
 * instance.
 */
export class ConsensusCache {
	private entries = new Map<string, CacheEntry>();
	private inflight = new Map<string, Promise<ConsensusResult>>();
	private readonly ttlMs: number;
	private stats: CacheStats;

	constructor(ttlSeconds: number = DEFAULT_CACHE_TTL_SECONDS) {
		this.ttlMs = Math.max(MIN_CACHE_TTL_MS, Math.round(ttlSeconds * 1000));
		this.stats = { hits: 0, misses: 0, staleReturns: 0, errors: 0 };
	}

	getStats(): CacheStats {
		return { ...this.stats };
	}

	resetStats(): void {
		this.stats = { hits: 0, misses: 0, staleReturns: 0, errors: 0 };
	}

	clear(): void {
		this.entries.clear();
		this.inflight.clear();
	}

	private isStale(key: string): boolean {
		const entry = this.entries.get(key);
		return entry === undefined || entry.expiresAt <= Date.now();
	}

	private getEntry(key: string): ConsensusResult | undefined {
		return this.entries.get(key)?.data;
	}

	/**
	 * Returns a cached result if fresh.
	 * If the cache entry has expired, starts (or shares) a fetch.
	 * On fetch failure with an existing stale entry, returns the stale
	 * entry without overwriting it.
	 */
	async getOrFetch(
		key: string,
		fetcher: () => Promise<ConsensusResult>,
	): Promise<ConsensusResult> {
		if (!this.isStale(key)) {
			this.stats.hits++;
			return this.entries.get(key)!.data;
		}

		const existingInflight = this.inflight.get(key);
		if (existingInflight) {
			this.stats.hits++;
			return existingInflight;
		}

		this.stats.misses++;
		const promise = this.runFetch(key, fetcher);
		this.inflight.set(key, promise);
		return promise;
	}

	private async runFetch(
		key: string,
		fetcher: () => Promise<ConsensusResult>,
	): Promise<ConsensusResult> {
		try {
			const result = await fetcher();
			this.entries.set(key, {
				data: result,
				expiresAt: Date.now() + this.ttlMs,
			});
			return result;
		} catch (err) {
			const stale = this.getEntry(key);
			if (stale !== undefined) {
				this.stats.staleReturns++;
				return stale;
			}
			this.stats.errors++;
			throw err;
		} finally {
			this.inflight.delete(key);
		}
	}
}
