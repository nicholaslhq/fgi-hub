import type { ConsensusResult } from "../types";
import { countProviders } from "../utils/providerCounts";

export function SystemStatus({
	stock,
	crypto,
	lastRefreshed,
}: {
	stock: ConsensusResult | null;
	crypto: ConsensusResult | null;
	lastRefreshed: string | null;
}) {
	const stockCounts = stock ? countProviders(stock.providers) : null;
	const cryptoCounts = crypto ? countProviders(crypto.providers) : null;

	const totalProviders =
		(stockCounts?.total ?? 0) + (cryptoCounts?.total ?? 0);
	const activeProviders =
		(stockCounts?.active ?? 0) + (cryptoCounts?.active ?? 0);
	const staleProviders =
		(stockCounts?.stale ?? 0) + (cryptoCounts?.stale ?? 0);
	const failedProviders =
		(stockCounts?.failed ?? 0) + (cryptoCounts?.failed ?? 0);

	const isRefreshing = !lastRefreshed;

	return (
		<div className="flex flex-col items-center sm:flex-row sm:items-center justify-between gap-4 py-2 px-1">
			<div className="flex flex-wrap items-center gap-4 sm:gap-6">
				<div className="flex items-center gap-2">
					<div
						className="w-2 h-2 rounded-full"
						style={{
							backgroundColor: isRefreshing
								? "var(--color-neutral)"
								: "var(--color-greed)",
							animation: isRefreshing
								? "pulse-soft 1.5s ease-in-out infinite"
								: "none",
						}}
					/>
					<span
						className="text-xs font-semibold"
						style={{ color: "var(--color-text-tertiary)" }}
					>
						{isRefreshing ? "Awaiting data" : "System operational"}
					</span>
				</div>
				<div
					className="hidden sm:flex items-center gap-4 text-xs"
					style={{ color: "var(--color-text-tertiary)" }}
				>
					<span>{totalProviders} providers</span>
					<span style={{ color: "var(--color-border)" }}>|</span>
					<span>{activeProviders} active</span>
					{staleProviders > 0 && (
						<>
							<span style={{ color: "var(--color-border)" }}>
								|
							</span>
							<span>{staleProviders} stale</span>
						</>
					)}
					{failedProviders > 0 && (
						<>
							<span style={{ color: "var(--color-border)" }}>
								|
							</span>
							<span>{failedProviders} failed</span>
						</>
					)}
				</div>
			</div>
			{lastRefreshed && (
				<div
					className="text-xs font-mono font-medium"
					style={{ color: "var(--color-text-tertiary)" }}
				>
					Last updated:{" "}
					{new Date(lastRefreshed).toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
						second: "2-digit",
					})}
				</div>
			)}
		</div>
	);
}
