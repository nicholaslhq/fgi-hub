export const STALE_THRESHOLD_MS = 60 * 60_000;

export function isStale(timestamp: string): boolean {
	return Date.now() - new Date(timestamp).getTime() > STALE_THRESHOLD_MS;
}

export type TimestampTier = "fresh" | "stale" | "outdated";

export function getTimestampTier(
	timestamp: string,
	now: number = Date.now(),
): TimestampTier {
	const age = now - new Date(timestamp).getTime();
	if (age < STALE_THRESHOLD_MS) return "fresh";
	if (age < 24 * 60 * 60 * 1000) return "stale";
	return "outdated";
}

export interface TimestampDisplay {
	text: string;
	tooltip: string;
	tier: TimestampTier;
}

const CFGI_MONTHS = [
	"Jan", "Feb", "Mar", "Apr", "May", "Jun",
	"Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function parseCfgiTimestamp(
	metaText: string,
	fallback: string = new Date().toISOString(),
): string {
	const dateMatch = metaText.match(/as of (.+)$/);
	if (!dateMatch) return fallback;

	const dateStr = dateMatch[1].trim();
	const parts = dateStr.match(/(\d{1,2}) (\w{3}), (\d{2}):(\d{2})/);
	if (!parts) return fallback;

	const month = CFGI_MONTHS.indexOf(parts[2]);
	if (month < 0) return fallback;

	const day = parseInt(parts[1], 10);
	const hour = parseInt(parts[3], 10);
	const minute = parseInt(parts[4], 10);
	const year = new Date().getFullYear();

	const parsed = new Date(Date.UTC(year, month, day, hour, minute));
	if (Number.isNaN(parsed.getTime())) return fallback;

	if (parsed.getTime() > Date.now() + 24 * 60 * 60_000) {
		parsed.setUTCFullYear(year - 1);
	}

	return parsed.toISOString();
}

export function formatTimestamp(
	timestamp: string,
	now: number = Date.now(),
): TimestampDisplay {
	const date = new Date(timestamp);
	const age = now - date.getTime();
	const ageMin = age / 60_000;

	let tier: TimestampTier = "fresh";
	if (ageMin < 1) {
		tier = "fresh";
	} else if (ageMin < STALE_THRESHOLD_MS / 60_000) {
		tier = "fresh";
	} else if (ageMin < 24 * 60) {
		tier = "stale";
	} else {
		tier = "outdated";
	}

	let text: string;

	if (ageMin < 1) {
		text = "Updated just now";
	} else if (ageMin < 60) {
		const mins = Math.floor(ageMin);
		text = `Updated ${mins}m ago`;
	} else {
		const isToday = date.toDateString() === new Date(now).toDateString();

		if (isToday) {
			text = `Updated ${date.toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
			})}`;
		} else {
			const yesterday = new Date(now);
			yesterday.setDate(yesterday.getDate() - 1);

			if (date.toDateString() === yesterday.toDateString()) {
				text = `Updated yesterday, ${date.toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
				})}`;
			} else if (ageMin < 7 * 24 * 60) {
				const dateStr = date.toLocaleDateString([], {
					month: "short",
					day: "numeric",
				});
				text = `Updated ${dateStr}, ${date.toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
				})}`;
			} else {
				const dateStr = date.toLocaleDateString([], {
					month: "short",
					day: "numeric",
					year: "numeric",
				});
				text = `Updated ${dateStr}`;
			}
		}
	}

	const tooltip = date.toLocaleString();

	return { text, tooltip, tier };
}
