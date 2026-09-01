import type { ConsensusResult } from "../types";

function sentimentTextColor(score: number): string {
	if (score <= 20) return "text-fear-extreme";
	if (score <= 40) return "text-fear";
	if (score <= 60) return "text-neutral";
	if (score <= 80) return "text-greed";
	return "text-greed-extreme";
}

function formatTime(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});
}

export function ConsensusCard({
	title,
	data,
}: {
	title: string;
	data: ConsensusResult | null;
}) {
	return (
		<div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
			<h2 className="text-lg font-semibold text-text-secondary mb-4">
				{title}
			</h2>
			{data ? (
				<div className="flex flex-col items-center gap-4">
					<div className="relative w-40 h-40">
						<svg
							viewBox="0 0 36 36"
							className="w-full h-full transform -rotate-90"
						>
							<path
								d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
								fill="none"
								stroke="#e2e8f0"
								strokeWidth="3"
							/>
							<path
								d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
								fill="none"
								stroke="currentColor"
								strokeWidth="3"
								strokeDasharray={`${data.score}, 100`}
								className={sentimentTextColor(data.score)}
							/>
						</svg>
						<div className="absolute inset-0 flex flex-col items-center justify-center">
							<span className="text-4xl font-bold text-text-primary">
								{data.score}
							</span>
							<span className="text-xs text-text-muted mt-1">
								/ 100
							</span>
						</div>
					</div>
					<div className="text-center">
						<p
							className={`text-xl font-bold ${sentimentTextColor(data.score)}`}
						>
							{data.label}
						</p>
						<p className="text-sm text-text-muted mt-1">
							Updated {formatTime(data.lastUpdated)}
						</p>
						<p className="text-xs text-text-muted mt-0.5">
							{data.providerCount} provider
							{data.providerCount !== 1 ? "s" : ""}
						</p>
					</div>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-12 text-text-muted">
					<p>No data available</p>
				</div>
			)}
		</div>
	);
}
