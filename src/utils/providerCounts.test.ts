import { describe, it, expect } from "vitest";
import type { ProviderScore } from "../types";
import { countProviders } from "./providerCounts";

function makeProvider(
	score: number,
	opts: Partial<ProviderScore> & { ageMinutes?: number } = {},
): ProviderScore {
	const now = Date.now();
	const ageMinutes = opts.ageMinutes ?? 1;
	return {
		provider: opts.provider ?? `Provider-${score}`,
		score,
		label: opts.label ?? "Neutral",
		timestamp: opts.timestamp ?? new Date(now - ageMinutes * 60_000).toISOString(),
		confidence: opts.confidence ?? 0.8,
		error: opts.error,
		metadata: opts.metadata,
	};
}

describe("countProviders", () => {
	it("counts all providers as active when none are error or stale", () => {
		const providers = [
			makeProvider(50),
			makeProvider(60),
			makeProvider(70),
		];
		const result = countProviders(providers);
		expect(result).toEqual({ total: 3, active: 3, stale: 0, failed: 0 });
	});

	it("counts error providers as failed", () => {
		const providers = [
			makeProvider(50),
			makeProvider(60, { error: "timeout" }),
			makeProvider(70),
		];
		const result = countProviders(providers);
		expect(result).toEqual({ total: 3, active: 2, stale: 0, failed: 1 });
	});

	it("counts stale providers correctly", () => {
		const providers = [
			makeProvider(50),
			makeProvider(60, { ageMinutes: 90 }),
			makeProvider(70),
		];
		const result = countProviders(providers);
		expect(result.total).toBe(3);
		expect(result.failed).toBe(0);
		expect(result.stale).toBe(1);
		expect(result.active).toBe(2);
	});

	it("does not count errored providers as stale", () => {
		const providers = [
			makeProvider(50, { error: "timeout", ageMinutes: 20 }),
			makeProvider(60),
		];
		const result = countProviders(providers);
		expect(result).toEqual({ total: 2, active: 1, stale: 0, failed: 1 });
	});

	it("handles empty provider list", () => {
		const result = countProviders([]);
		expect(result).toEqual({ total: 0, active: 0, stale: 0, failed: 0 });
	});

	it("handles all providers failing", () => {
		const providers = [
			makeProvider(50, { error: "timeout" }),
			makeProvider(60, { error: "api_error" }),
		];
		const result = countProviders(providers);
		expect(result).toEqual({ total: 2, active: 0, stale: 0, failed: 2 });
	});

	it("handles all providers stale", () => {
		const providers = [
			makeProvider(50, { ageMinutes: 90 }),
			makeProvider(60, { ageMinutes: 120 }),
		];
		const result = countProviders(providers);
		expect(result).toEqual({ total: 2, active: 0, stale: 2, failed: 0 });
	});

	it("handles mixed error, stale, and active providers", () => {
		const providers = [
			makeProvider(50),
			makeProvider(60, { error: "timeout" }),
			makeProvider(70, { ageMinutes: 90 }),
			makeProvider(80),
			makeProvider(90, { error: "api_error", ageMinutes: 90 }),
		];
		const result = countProviders(providers);
		expect(result).toEqual({ total: 5, active: 2, stale: 1, failed: 2 });
	});

	it("always satisfies total = active + stale + failed", () => {
		const providers = [
			makeProvider(50),
			makeProvider(60, { error: "timeout" }),
			makeProvider(70, { ageMinutes: 90 }),
			makeProvider(80),
			makeProvider(90, { error: "api_error", ageMinutes: 90 }),
		];
		const result = countProviders(providers);
		expect(result.active + result.stale + result.failed).toBe(result.total);
	});
});
