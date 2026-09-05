import { describe, it, expect } from "vitest";
import { isStale, STALE_THRESHOLD_MS } from "./time";

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
