import { useState, useMemo } from "react";
import type { ConsensusResult } from "../types";
import { detectOutliers } from "../services/aggregation";
import { isStale } from "../utils/time";
import { getSentimentColor } from "./SentimentSpectrum";
import { Timestamp } from "./Timestamp";
import { useTimeTicker } from "../hooks/useTimeTicker";

type SortKey = "score" | "deviation" | "weight" | "confidence" | "age" | "name";
type SortDir = "asc" | "desc";

const RECENCY_TAU = 5;

function formatAge(minutes: number): string {
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${Math.floor(minutes)}m`;
	const hours = Math.floor(minutes / 60);
	const mins = Math.floor(minutes % 60);
	if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	const days = Math.floor(hours / 24);
	return `${days}d`;
}

interface EnrichedProvider {
	provider: string;
	score: number;
	timestamp: string;
	confidence?: number;
	error?: string;
	source?: string;
	status: "healthy" | "stale" | "error";
	weight: number;
	normalizedWeight: number;
	deviation: number | null;
	isOutlier: boolean;
	ageMinutes: number | null;
}

export function ProviderBreakdown({
	data,
	theme,
}: {
	data: ConsensusResult;
	theme: "light" | "dark";
}) {
	const [sortKey, setSortKey] = useState<SortKey>("score");
	const [sortDir, setSortDir] = useState<SortDir>("desc");
	const now = useTimeTicker();

	const enriched = useMemo<EnrichedProvider[]>(() => {
		const activeProviders = data.providers.filter((p) => !p.error);
		const scores = activeProviders.map((p) => p.score);

		const outlierFlags = detectOutliers(
			scores,
			data.details.median,
			data.details.mad,
		);
		const outlierSet = new Set<string>();
		activeProviders.forEach((p, i) => {
			if (outlierFlags[i]) outlierSet.add(p.provider);
		});

		const maxWeight = Math.max(
			...activeProviders.map((p) => {
				const confidence = p.confidence ?? 0.5;
				const ageMinutes =
					(now - new Date(p.timestamp).getTime()) / 60000;
				return confidence * Math.exp(-ageMinutes / RECENCY_TAU);
			}),
			0.001,
		);

		return data.providers.map((p) => {
			const hasError = !!p.error;
			const stale = !hasError && isStale(p.timestamp);
			const confidence = p.confidence ?? 0.5;
			const ageMinutes = hasError
				? null
				: (now - new Date(p.timestamp).getTime()) / 60000;
			const weight = hasError
				? 0
				: confidence * Math.exp(-(ageMinutes ?? 0) / RECENCY_TAU);
			const deviation = hasError ? null : p.score - data.score;

			return {
				provider: p.provider,
				score: p.score,
				timestamp: p.timestamp,
				confidence: p.confidence,
				error: p.error,
				source: p.source,
				status: hasError ? "error" : stale ? "stale" : "healthy",
				weight,
				normalizedWeight: weight / maxWeight,
				deviation,
				isOutlier: outlierSet.has(p.provider),
				ageMinutes,
			};
		});
	}, [data, now]);

	const sorted = useMemo(() => {
		const arr = [...enriched];
		arr.sort((a, b) => {
			let aVal: number | string;
			let bVal: number | string;
			switch (sortKey) {
				case "score":
					aVal = a.error ? -Infinity : a.score;
					bVal = b.error ? -Infinity : b.score;
					break;
				case "deviation":
					aVal = a.deviation ?? 0;
					bVal = b.deviation ?? 0;
					break;
				case "weight":
					aVal = a.weight;
					bVal = b.weight;
					break;
				case "confidence":
					aVal = a.confidence ?? 0;
					bVal = b.confidence ?? 0;
					break;
				case "age":
					aVal = a.ageMinutes ?? Infinity;
					bVal = b.ageMinutes ?? Infinity;
					break;
				case "name":
					aVal = a.provider;
					bVal = b.provider;
					break;
			}
			if (typeof aVal === "string") {
				return sortDir === "asc"
					? aVal.localeCompare(bVal as string)
					: (bVal as string).localeCompare(aVal);
			}
			return sortDir === "asc"
				? (aVal as number) - (bVal as number)
				: (bVal as number) - (aVal as number);
		});
		return arr;
	}, [enriched, sortKey, sortDir]);

	const healthyCount = enriched.filter((p) => p.status === "healthy").length;
	const staleCount = enriched.filter((p) => p.status === "stale").length;
	const errorCount = enriched.filter((p) => p.status === "error").length;
	const outlierCount = enriched.filter((p) => p.isOutlier).length;
	const deviations = enriched
		.filter((p) => p.deviation !== null)
		.map((p) => p.deviation as number);
	const avgDeviation =
		deviations.length > 0
			? Math.round(
					deviations.reduce((a, b) => a + b, 0) / deviations.length,
				)
			: 0;
	const within10 = deviations.filter((d) => Math.abs(d) <= 10).length;

	const handleSort = (key: SortKey) => {
		if (sortKey === key) {
			setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		} else {
			setSortKey(key);
			setSortDir(key === "name" ? "asc" : "desc");
		}
	};

	const sortOptions: { key: SortKey; label: string }[] = [
		{ key: "score", label: "Score" },
		{ key: "deviation", label: "Deviation" },
		{ key: "weight", label: "Weight" },
		{ key: "confidence", label: "Confidence" },
		{ key: "age", label: "Freshness" },
		{ key: "name", label: "Name" },
	];

	return (
		<div
			className="card animate-fade-in"
			style={{ animationDelay: "0.2s" }}
		>
			<div className="flex flex-col gap-4">
				<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
					<div>
						<h3
							className="text-xs font-semibold uppercase tracking-widest"
							style={{ color: "var(--color-text-tertiary)" }}
						>
							Provider Breakdown
						</h3>
						<div
							className="flex items-center gap-3 text-xs mt-2 flex-wrap"
							style={{ color: "var(--color-text-tertiary)" }}
						>
							<span>{data.providerCount} providers</span>
							<span
								className="hidden sm:inline"
								style={{ color: "var(--color-border)" }}
							>
								·
							</span>
							<span style={{ color: "var(--color-greed)" }}>
								{healthyCount} active
							</span>
							{staleCount > 0 && (
								<>
									<span
										className="hidden sm:inline"
										style={{ color: "var(--color-border)" }}
									>
										·
									</span>
									<span
										style={{
											color: "var(--color-neutral)",
										}}
									>
										{staleCount} stale
									</span>
								</>
							)}
							{errorCount > 0 && (
								<>
									<span
										className="hidden sm:inline"
										style={{ color: "var(--color-border)" }}
									>
										·
									</span>
									<span
										style={{ color: "var(--color-fear)" }}
									>
										{errorCount} errors
									</span>
								</>
							)}
							{outlierCount > 0 && (
								<>
									<span
										className="hidden sm:inline"
										style={{ color: "var(--color-border)" }}
									>
										·
									</span>
									<span>{outlierCount} outliers</span>
								</>
							)}
							<span
								className="hidden sm:inline"
								style={{ color: "var(--color-border)" }}
							>
								·
							</span>
							<span>
								Avg dev:{" "}
								<span
									className="font-mono"
									style={{
										color:
											avgDeviation > 0
												? "var(--color-greed)"
												: avgDeviation < 0
													? "var(--color-fear)"
													: "var(--color-neutral)",
									}}
								>
									{avgDeviation >= 0 ? "+" : ""}
									{avgDeviation}
								</span>
							</span>
							<span
								className="hidden sm:inline"
								style={{ color: "var(--color-border)" }}
							>
								·
							</span>
							<span>{within10} within ±10</span>
						</div>
					</div>
					<div className="flex items-center gap-2 flex-wrap">
						{sortOptions.map((opt) => (
							<button
								key={opt.key}
								onClick={() => handleSort(opt.key)}
								className={`sort-btn ${
									sortKey === opt.key
										? "sort-btn--active"
										: ""
								}`}
							>
								{opt.label}
								{sortKey === opt.key &&
									(sortDir === "asc" ? " ↑" : " ↓")}
							</button>
						))}
					</div>
				</div>

				<div className="provider-breakdown-table-wrapper">
					<table className="provider-breakdown-table">
						<thead>
							<tr>
								<th>Provider</th>
								<th className="text-right">Score</th>
								<th className="text-right">Deviation</th>
								<th className="text-right">Weight</th>
								<th className="text-right">Confidence</th>
								<th className="text-right">Freshness</th>
							</tr>
						</thead>
						<tbody>
							{sorted.map((p) => (
								<tr key={p.provider}>
									<td data-label="Provider">
										<div className="flex items-center gap-3 flex-1 min-w-0">
											<div
												className={`status-dot ${p.status}`}
												title={
													p.error ||
													(p.status === "stale"
														? "Stale"
														: "Healthy")
												}
											/>
											<div className="min-w-0">
												{p.source ? (
													<a
														href={p.source}
														target="_blank"
														rel="noopener noreferrer"
														className="text-sm font-medium truncate provider-link"
													>
														<span className="provider-link-text">
															{p.provider}
														</span>
														<span
															className="provider-link-icon"
															aria-hidden="true"
														>
															<svg
																width="12"
																height="12"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																strokeWidth="2"
																strokeLinecap="round"
																strokeLinejoin="round"
															>
																<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
																<polyline points="15 3 21 3 21 9" />
																<line
																	x1="10"
																	y1="14"
																	x2="21"
																	y2="3"
																/>
															</svg>
														</span>
													</a>
												) : (
													<p className="provider-link-text">
														{p.provider}
													</p>
												)}
												<div className="flex items-center gap-2 mt-0.5">
													<p
														className="text-xs"
														style={{
															color: "var(--color-text-tertiary)",
														}}
													>
														{p.error ? (
															<span
																style={{
																	color: "var(--color-fear)",
																}}
															>
																{p.error}
															</span>
														) : (
															<Timestamp
																iso={
																	p.timestamp
																}
																size="xs"
															/>
														)}
													</p>
													{p.isOutlier && (
														<span className="outlier-tag">
															Outlier
														</span>
													)}
												</div>
											</div>
										</div>
									</td>
									<td
										data-label="Score"
										className="text-right"
									>
										<p
											className="font-mono text-sm font-semibold"
											style={{
												color: p.error
													? "var(--color-text-tertiary)"
													: getSentimentColor(
															p.score,
															theme,
														),
											}}
										>
											{p.error ? "—" : p.score}
										</p>
									</td>
									<td
										data-label="Deviation"
										className="text-right"
									>
										<p
											className="font-mono text-xs font-medium"
											style={{
												color:
													p.deviation === null
														? "var(--color-text-tertiary)"
														: p.deviation > 0
															? "var(--color-greed)"
															: p.deviation < 0
																? "var(--color-fear)"
																: "var(--color-neutral)",
											}}
										>
											{p.deviation === null
												? "—"
												: `${p.deviation > 0 ? "+" : ""}${p.deviation}`}
										</p>
									</td>
									<td
										data-label="Weight"
										className="text-right"
									>
										<div className="flex items-center justify-end">
											<div className="weight-bar-track w-16">
												<div
													className="weight-bar-fill"
													style={{
														width: `${p.normalizedWeight * 100}%`,
														background:
															"var(--color-accent)",
													}}
												/>
											</div>
										</div>
									</td>
									<td
										data-label="Confidence"
										className="text-right"
									>
										<p
											className="font-mono text-xs"
											style={{
												color: "var(--color-text-tertiary)",
											}}
										>
											{p.confidence
												? `${Math.round(p.confidence * 100)}%`
												: "—"}
										</p>
									</td>
									<td
										data-label="Freshness"
										className="text-right"
									>
										<p
											className="text-xs"
											style={{
												color: "var(--color-text-tertiary)",
											}}
										>
											{p.ageMinutes === null
												? "—"
												: formatAge(p.ageMinutes)}
										</p>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
