import { describe, it, expect } from "vitest";
import {
	isStale,
	STALE_THRESHOLD_MS,
	getTimestampTier,
	formatTimestamp,
} from "./time";

describe("isStale", () => {
	it("returns false for a fresh timestamp", () => {
		const now = Date.now();
		const fresh = new Date(now - 1_000).toISOString();
		expect(isStale(fresh)).toBe(false);
	});

	it("returns true for a timestamp older than the threshold", () => {
		const old = new Date(Date.now() - STALE_THRESHOLD_MS - 1_000).toISOString();
		expect(isStale(old)).toBe(true);
	});

	it("returns false at exactly the threshold boundary", () => {
		const boundary = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();
		expect(isStale(boundary)).toBe(false);
	});

	it("returns false for a future timestamp", () => {
		const future = new Date(Date.now() + 60_000).toISOString();
		expect(isStale(future)).toBe(false);
	});

	it("returns false for an invalid timestamp string", () => {
		expect(isStale("not-a-date")).toBe(false);
	});

	it("returns false for an empty string", () => {
		expect(isStale("")).toBe(false);
	});

	it("returns true for null (epoch date)", () => {
		expect(isStale(null as unknown as string)).toBe(true);
	});

	it("returns false for undefined", () => {
		expect(isStale(undefined as unknown as string)).toBe(false);
	});
});

describe("STALE_THRESHOLD_MS", () => {
	it("equals 15 minutes in milliseconds", () => {
		expect(STALE_THRESHOLD_MS).toBe(15 * 60_000);
	});
});

describe("getTimestampTier", () => {
	it("returns fresh for recent timestamps", () => {
		const now = Date.now();
		const recent = new Date(now - 5 * 60_000).toISOString();
		expect(getTimestampTier(recent, now)).toBe("fresh");
	});

	it("returns stale for timestamps older than 15 minutes but less than 24 hours", () => {
		const now = Date.now();
		const staleTs = new Date(now - 30 * 60_000).toISOString();
		expect(getTimestampTier(staleTs, now)).toBe("stale");
	});

	it("returns outdated for timestamps older than 24 hours", () => {
		const now = Date.now();
		const oldTs = new Date(now - 25 * 60_000 * 60).toISOString();
		expect(getTimestampTier(oldTs, now)).toBe("outdated");
	});

	it("returns fresh for a timestamp just under 15 minutes old", () => {
		const now = Date.now();
		const justFresh = new Date(now - STALE_THRESHOLD_MS + 1_000).toISOString();
		expect(getTimestampTier(justFresh, now)).toBe("fresh");
	});
});

describe("formatTimestamp", () => {
	const FIXED_NOW = new Date("2026-09-06T15:30:00Z").getTime();

	it("returns 'just now' for timestamps within the last minute", () => {
		const ts = new Date(FIXED_NOW - 30_000).toISOString();
		const result = formatTimestamp(ts, FIXED_NOW);
		expect(result.text).toBe("Updated just now");
		expect(result.tier).toBe("fresh");
	});

	it("returns relative minutes for timestamps 15-59 minutes old", () => {
		const ts = new Date(FIXED_NOW - 30 * 60_000).toISOString();
		const result = formatTimestamp(ts, FIXED_NOW);
		expect(result.text).toBe("Updated 30m ago");
		expect(result.tier).toBe("stale");
	});

	it("returns time-only format for same-day timestamps older than an hour", () => {
		const ts = new Date(FIXED_NOW - 3 * 60 * 60_000).toISOString();
		const result = formatTimestamp(ts, FIXED_NOW);
		expect(result.text).toContain("Updated");
		expect(result.text).toMatch(/\d{1,2}:\d{2}/);
		expect(result.tier).toBe("stale");
	});

	it("returns 'yesterday' format for yesterday's timestamps", () => {
		const ts = new Date(FIXED_NOW - 25 * 60 * 60_000).toISOString();
		const result = formatTimestamp(ts, FIXED_NOW);
		expect(result.text).toContain("yesterday");
		expect(result.tier).toBe("outdated");
	});

	it("returns month-day format for timestamps 2-6 days old", () => {
		const ts = new Date(FIXED_NOW - 3 * 24 * 60 * 60_000).toISOString();
		const result = formatTimestamp(ts, FIXED_NOW);
		expect(result.text).toContain("Updated");
		expect(result.text).not.toContain("yesterday");
		expect(result.text).not.toContain("2026");
		expect(result.tier).toBe("outdated");
	});

	it("returns month-day-year format for timestamps older than 7 days", () => {
		const ts = new Date(FIXED_NOW - 10 * 24 * 60 * 60_1000).toISOString();
		const result = formatTimestamp(ts, FIXED_NOW);
		expect(result.text).toContain("2026");
		expect(result.tier).toBe("outdated");
	});

	it("includes a tooltip with full locale string", () => {
		const ts = new Date(FIXED_NOW - 30 * 60_000).toISOString();
		const result = formatTimestamp(ts, FIXED_NOW);
		expect(result.tooltip).toBe(new Date(ts).toLocaleString());
	});

	it("returns fresh tier for a future timestamp", () => {
		const ts = new Date(FIXED_NOW + 60_000).toISOString();
		const result = formatTimestamp(ts, FIXED_NOW);
		expect(result.tier).toBe("fresh");
	});
});
