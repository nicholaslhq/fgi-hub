import type { SentimentLabel } from "../types";

export const EXTREME_FEAR_MAX = 20;
export const FEAR_MAX = 40;
export const NEUTRAL_MAX = 60;
export const GREED_MAX = 80;

export function sentimentLabel(score: number): SentimentLabel {
	if (score <= EXTREME_FEAR_MAX) return "Extreme Fear";
	if (score <= FEAR_MAX) return "Fear";
	if (score <= NEUTRAL_MAX) return "Neutral";
	if (score <= GREED_MAX) return "Greed";
	return "Extreme Greed";
}

export interface SentimentRange {
	min: number;
	max: number;
}

export function sentimentRange(label: SentimentLabel): SentimentRange {
	switch (label) {
		case "Extreme Fear":
			return { min: 0, max: EXTREME_FEAR_MAX };
		case "Fear":
			return { min: EXTREME_FEAR_MAX + 1, max: FEAR_MAX };
		case "Neutral":
			return { min: FEAR_MAX + 1, max: NEUTRAL_MAX };
		case "Greed":
			return { min: NEUTRAL_MAX + 1, max: GREED_MAX };
		case "Extreme Greed":
			return { min: GREED_MAX + 1, max: 100 };
	}
}
