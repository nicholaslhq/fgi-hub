import type { ConsensusResult } from "../types";
import { formatStrategyName } from "../utils/formatters";
import { ProviderRow } from "./SentimentSpectrum";

const STALE_THRESHOLD_MS = 15 * 60_000;

function isStale(timestamp: string): boolean {
	return Date.now() - new Date(timestamp).getTime() > STALE_THRESHOLD_MS;
}

export function ProviderConsensus({
	data,
	market,
	theme,
}: {
	data: ConsensusResult;
	market: "stock" | "crypto";
	theme: "light" | "dark";
}) {
	const activeScores = data.providers
		.filter((p) => !p.error)
		.map((p) => p.score);
	const min = Math.min(...activeScores);
	const max = Math.max(...activeScores);
	const spread = max - min;
	const divergence = spread > 30 ? "high" : spread > 15 ? "medium" : "low";

	const divergenceLabel = {
		high: "High divergence",
		medium: "Moderate spread",
		low: "Strong consensus",
	};

	const divergenceColor = {
		high: "var(--color-fear)",
		medium: "var(--color-neutral)",
		low: "var(--color-greed)",
	};

	const errorCount = data.providers.filter((p) => p.error).length;
	const staleCount = data.providers.filter(
		(p) => !p.error && isStale(p.timestamp),
	).length;
	const activeCount = data.providers.length - errorCount - staleCount;
	const confidencePct =
		data.confidence !== undefined ? Math.round(data.confidence * 100) : 0;

	const confidenceColor =
		confidencePct >= 70
			? "var(--color-greed)"
			: confidencePct >= 45
				? "var(--color-neutral)"
				: "var(--color-fear)";

	return (
		<div
			className="card animate-fade-in"
			style={{ animationDelay: "0.2s" }}
		>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
				<h3
					className="text-xs font-semibold uppercase tracking-widest"
					style={{ color: "var(--color-text-tertiary)" }}
				>
					Provider Consensus —{" "}
					{market === "stock" ? "Stocks" : "Crypto"}
				</h3>
				<div className="consensus-meter">
					<span
						className="text-xs font-medium"
						style={{ color: divergenceColor[divergence] }}
					>
						{divergenceLabel[divergence]}
					</span>
					<div className="consensus-bar">
						<div
							className="consensus-bar-fill"
							style={{
								width: `${Math.max(0, 100 - spread)}%`,
								backgroundColor: divergenceColor[divergence],
							}}
						/>
					</div>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-4 text-xs">
				<div className="flex items-center gap-2">
					<span style={{ color: "var(--color-text-tertiary)" }}>
						Strategy:
					</span>
					<span
						className="font-mono font-medium"
						style={{ color: "var(--color-text-primary)" }}
					>
						{formatStrategyName(data.strategy)}
					</span>
				</div>
				<div className="flex items-center gap-2">
					<span style={{ color: "var(--color-text-tertiary)" }}>
						Confidence:
					</span>
					<span
						className="font-mono font-medium"
						style={{ color: confidenceColor }}
					>
						{confidencePct}%
					</span>
				</div>
				{data.ciLower !== undefined && data.ciUpper !== undefined && (
					<div className="flex items-center gap-2">
						<span style={{ color: "var(--color-text-tertiary)" }}>
							95% CI:
						</span>
						<span
							className="font-mono font-medium"
							style={{ color: "var(--color-text-primary)" }}
						>
							[{data.ciLower}, {data.ciUpper}]
						</span>
					</div>
				)}
			</div>

			<div className="space-y-1">
				{data.providers.map((provider) => (
					<ProviderRow
						key={provider.provider}
						provider={provider}
						theme={theme}
					/>
				))}
			</div>
			<div
				className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6 pt-5"
				style={{ borderTop: "1px solid var(--color-border-subtle)" }}
			>
				<div className="flex items-center gap-2">
					<div className="status-dot healthy" />
					<span
						className="text-xs font-medium"
						style={{ color: "var(--color-text-tertiary)" }}
					>
						{activeCount} active
					</span>
				</div>
				{staleCount > 0 && (
					<div className="flex items-center gap-2">
						<div className="status-dot stale" />
						<span
							className="text-xs font-medium"
							style={{ color: "var(--color-text-tertiary)" }}
						>
							{staleCount} stale
						</span>
					</div>
				)}
				{errorCount > 0 && (
					<div className="flex items-center gap-2">
						<div className="status-dot error" />
						<span
							className="text-xs font-medium"
							style={{ color: "var(--color-text-tertiary)" }}
						>
							{errorCount} failed
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
