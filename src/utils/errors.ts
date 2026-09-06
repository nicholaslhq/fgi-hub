import type { ProviderScore } from "../types/index.js";

export function providerError(
	provider: string,
	message: string,
	market: "stock" | "crypto",
	source: string,
): ProviderScore {
	return {
		provider,
		score: 0,
		timestamp: new Date().toISOString(),
		error: message,
		confidence: 0,
		metadata: { source, market },
	};
}
