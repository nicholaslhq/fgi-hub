export const LOADING_MESSAGES = [
	"Aggregating sentiment data…",
	"Crunching numbers from the trenches…",
	"Polling the market's mood ring…",
	"Calibrating the fear & greed compass…",
	"Weighing whale whispers against retail buzz…",
	"Tuning into the market's frequency…",
	"Normalizing volatility signals…",
	"Cross-referencing sentiment streams…",
	"Assembling the consensus mosaic…",
	"Filtering noise from signal…",
	"Running the adaptive aggregation matrix…",
	"Scanning for outlier distortions…",
	"Harmonizing multi-source sentiment…",
	"Validating data integrity…",
	"Estimating confidence intervals…",
	"Synthesizing market psychology…",
	"Checking the pulse of financial markets…",
	"Balancing bear vs. bull sentiment…",
	"Almost there…",
];

export function getRandomLoadingMessage(): string {
	return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
}

export function getLoadingMessage(index: number): string {
	return LOADING_MESSAGES[index % LOADING_MESSAGES.length];
}
