import { ProviderRow } from "./SentimentSpectrum";
import type { ProviderScore } from "../types";

export function ProviderList({
	providers,
	theme = "light",
}: {
	providers: ProviderScore[];
	theme?: "light" | "dark";
}) {
	return (
		<div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
			<h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
				Provider Details
			</h3>
			<div className="space-y-3">
				{providers.map((p) => (
					<ProviderRow key={p.provider} provider={p} theme={theme} />
				))}
			</div>
		</div>
	);
}
