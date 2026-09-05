export const STALE_THRESHOLD_MS = 15 * 60_000;

export function isStale(timestamp: string): boolean {
	return Date.now() - new Date(timestamp).getTime() > STALE_THRESHOLD_MS;
}
