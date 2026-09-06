import type { ProviderScore } from "../types";
import { Timestamp } from "./Timestamp";

function sentimentDot(score: number, error?: string): string {
	if (error) return "bg-gray-400";
	if (score <= 20) return "bg-fear-extreme";
	if (score <= 40) return "bg-fear";
	if (score <= 60) return "bg-neutral";
	if (score <= 80) return "bg-greed";
	return "bg-greed-extreme";
}

export function ProviderList({ providers }: { providers: ProviderScore[] }) {
	return (
		<div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
			<h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
				Provider Details
			</h3>
			<div className="space-y-3">
				{providers.map((p) => (
					<div
						key={p.provider}
						className="flex items-center justify-between py-2 border-b border-border last:border-0"
					>
						<div className="flex items-center gap-3">
							<span
								className={`w-1.5 h-1.5 rounded-full ${sentimentDot(p.score, p.error)}`}
							/>
						<div>
							{p.source ? (
								<a
									href={p.source}
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm font-medium hover:underline"
									style={{ color: "var(--color-text-primary)" }}
								>
									{p.provider}
								</a>
							) : (
								<p className="text-sm font-medium text-text-primary">
									{p.provider}
								</p>
							)}
							<p className="text-xs text-text-muted">
								{p.error ? (
									<span className="text-red-500">
										{p.error}
									</span>
								) : (
									<Timestamp iso={p.timestamp} size="xs" />
								)}
							</p>
						</div>
						</div>
						<div className="text-right">
							<p
								className={`text-sm font-bold ${p.error ? "text-text-muted line-through" : "text-text-primary"}`}
							>
								{p.error ? "—" : p.score}
							</p>
							{p.confidence && !p.error ? (
								<p className="text-xs text-text-muted">
									{(p.confidence * 100).toFixed(0)}%
									confidence
								</p>
							) : null}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
