import type { ConsensusResult } from "../types";
import { countProviders } from "../utils/providerCounts";
import { getTimestampTier } from "../utils/time";
import { Timestamp } from "./Timestamp";

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
	const tier = lastRefreshed ? getTimestampTier(lastRefreshed) : "fresh";
	const isStaleData = tier === "stale";
	const isOutdatedData = tier === "outdated";

	const statusDotColor = isRefreshing
		? "var(--color-neutral)"
		: isOutdatedData
			? "var(--color-fear)"
			: isStaleData
				? "var(--color-neutral)"
				: "var(--color-greed)";

	const statusText = isRefreshing
		? "Awaiting data"
		: isOutdatedData
			? "Data outdated"
			: isStaleData
				? "Data stale"
				: "System operational";

	return (
		<div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-4 py-2 px-1">
			<div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 w-full sm:w-auto">
				<div className="flex items-center gap-3">
					<div
						className="w-1.5 h-1.5 rounded-full"
						style={{
							backgroundColor: statusDotColor,
							animation: isRefreshing
								? "pulse-soft 1.5s ease-in-out infinite"
								: "none",
						}}
					/>
					<span
						className="text-xs font-semibold"
						style={{
							color: isOutdatedData
								? "var(--color-fear)"
								: isStaleData
									? "var(--color-neutral)"
									: "var(--color-text-tertiary)",
						}}
					>
						{statusText}
					</span>
				</div>
				<div
					className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] sm:text-xs sm:justify-start sm:gap-4 w-full sm:w-auto"
					style={{ color: "var(--color-text-tertiary)" }}
				>
					<span>{totalProviders} providers</span>
					<span
						style={{ color: "var(--color-border)" }}
					>
						|
					</span>
					<span>{activeProviders} active</span>
					{staleProviders > 0 && (
						<>
							<span
								className="hidden sm:inline"
								style={{ color: "var(--color-border)" }}
							>
								|
							</span>
							<span>{staleProviders} stale</span>
						</>
					)}
					{failedProviders > 0 && (
						<>
							<span
								className="hidden sm:inline"
								style={{ color: "var(--color-border)" }}
							>
								|
							</span>
							<span>{failedProviders} failed</span>
						</>
					)}
				</div>
			</div>
			{lastRefreshed && (
				<Timestamp iso={lastRefreshed} showDot size="xs" />
			)}
		</div>
	);
}
