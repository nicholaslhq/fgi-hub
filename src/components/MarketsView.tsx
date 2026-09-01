import { useMemo } from "react";
import type { ConsensusResult } from "../types";
import {
	formatStrategyName,
	formatStrategyDescription,
} from "../utils/formatters";
import { getSentimentColor } from "./SentimentSpectrum";
import { sentimentLabel } from "../utils/sentiment";
import { AutoFitText } from "./AutoFitText";

function mean(values: number[]): number {
	return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function median(values: number[]): number {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2
		? sorted[mid]
		: Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function stdDev(values: number[]): number {
	const avg = mean(values);
	const squareDiffs = values.map((v) => (v - avg) ** 2);
	return Math.round(
		Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length),
	);
}

function variance(values: number[]): number {
	if (values.length === 0) return 0;
	const avg = values.reduce((a, b) => a + b, 0) / values.length;
	return values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
}

function percentile(values: number[], p: number): number {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const idx = (sorted.length - 1) * (p / 100);
	const lower = Math.floor(idx);
	const upper = Math.ceil(idx);
	if (lower === upper) return sorted[lower];
	return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

function DistributionBar({
	providers,
	theme,
}: {
	providers: ConsensusResult["providers"];
	theme: "light" | "dark";
}) {
	const activeProviders = providers.filter((p) => !p.error);
	const buckets = [0, 0, 0, 0, 0];
	activeProviders.forEach((p) => {
		const label = sentimentLabel(p.score);
		switch (label) {
			case "Extreme Fear":
				buckets[0]++;
				break;
			case "Fear":
				buckets[1]++;
				break;
			case "Neutral":
				buckets[2]++;
				break;
			case "Greed":
				buckets[3]++;
				break;
			case "Extreme Greed":
				buckets[4]++;
				break;
		}
	});
	const colors = [
		getSentimentColor(10, theme),
		getSentimentColor(30, theme),
		getSentimentColor(50, theme),
		getSentimentColor(70, theme),
		getSentimentColor(90, theme),
	];
	const labels = [
		"Extreme Fear",
		"Fear",
		"Neutral",
		"Greed",
		"Extreme Greed",
	];

	return (
		<div className="space-y-3">
			{buckets.map((count, i) => (
				<div key={labels[i]} className="flex items-center gap-3">
					<span
						className="text-xs font-medium w-24 text-right"
						style={{ color: "var(--color-text-secondary)" }}
					>
						{labels[i]}
					</span>
					<div
						className="flex-1 h-3 rounded-full overflow-hidden"
						style={{ background: "var(--color-bg-sunken)" }}
					>
						<div
							className="h-full rounded-full transition-all duration-500"
							style={{
								width: `${(count / activeProviders.length) * 100}%`,
								background: colors[i],
								minWidth: count > 0 ? "4px" : 0,
							}}
						/>
					</div>
					<span
						className="text-xs font-mono w-6 text-right"
						style={{ color: "var(--color-text-tertiary)" }}
					>
						{count}
					</span>
				</div>
			))}
		</div>
	);
}

function MetricCard({
	label,
	value,
	sub,
	highlight,
}: {
	label: string;
	value: React.ReactNode;
	sub?: string;
	highlight?: boolean;
}) {
	return (
		<div
			className={`rounded-xl p-4 metric-card ${highlight ? "metric-card--highlight" : "metric-card--default"}`}
		>
			<p
				className="text-xs font-medium uppercase tracking-wider mb-1"
				style={{ color: "var(--color-text-tertiary)" }}
			>
				{label}
			</p>
			<div
				className="text-2xl font-bold font-mono"
				style={{ color: "var(--color-text-primary)" }}
			>
				{value}
			</div>
			{sub && (
				<p
					className="text-xs mt-1"
					style={{ color: "var(--color-text-tertiary)" }}
				>
					{sub}
				</p>
			)}
		</div>
	);
}

function ProviderInsightRow({
	provider,
}: {
	provider: ConsensusResult["providers"][0];
}) {
	const statusColor = useMemo(() => {
		if (provider.error) return "var(--color-fear)";
		return Date.now() - new Date(provider.timestamp).getTime() > 15 * 60_000
			? "var(--color-neutral)"
			: "var(--color-greed)";
	}, [provider.error, provider.timestamp]);

	return (
		<div
			className="flex items-center justify-between py-3 border-b last:border-0"
			style={{ borderColor: "var(--color-border-subtle)" }}
		>
			<div className="flex items-center gap-3">
				<div
					className="w-2.5 h-2.5 rounded-full"
					style={{ background: statusColor }}
				/>
				<div>
					<p
						className="text-sm font-medium"
						style={{ color: "var(--color-text-primary)" }}
					>
						{provider.provider}
					</p>
					<p
						className="text-xs"
						style={{ color: "var(--color-text-tertiary)" }}
					>
						{provider.error
							? provider.error
							: `Updated ${new Date(provider.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`}
					</p>
				</div>
			</div>
			<div className="text-right">
				<p
					className="text-sm font-bold font-mono"
					style={{ color: "var(--color-text-primary)" }}
				>
					{provider.error ? "—" : provider.score}
				</p>
				{provider.confidence && !provider.error ? (
					<p
						className="text-xs"
						style={{ color: "var(--color-text-tertiary)" }}
					>
						{(provider.confidence * 100).toFixed(0)}% confidence
					</p>
				) : null}
			</div>
		</div>
	);
}

function Insights({ data }: { data: ConsensusResult }) {
	const providers = data.providers.filter((p) => !p.error);
	const scores = providers.map((p) => p.score);
	const sd = stdDev(scores);
	const extremes = scores.length
		? {
				min: Math.min(...scores),
				max: Math.max(...scores),
				minProvider:
					data.providers.find((p) => p.score === Math.min(...scores))
						?.provider ?? "—",
				maxProvider:
					data.providers.find((p) => p.score === Math.max(...scores))
						?.provider ?? "—",
			}
		: null;

	const staleCount = useMemo(
		() =>
			data.providers.filter(
				(p) =>
					!p.error &&
					Date.now() - new Date(p.timestamp).getTime() > 15 * 60_000,
			).length,
		[data.providers],
	);
	const errorCount = data.providers.filter((p) => p.error).length;

	const strategyLabel = (s: string) =>
		s
			.split("_")
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(" ");

	const insights: string[] = [];
	if (extremes && extremes.max - extremes.min > 30) {
		insights.push(
			`High divergence: ${extremes.maxProvider} (${extremes.max}) vs ${extremes.minProvider} (${extremes.min})`,
		);
	}
	if (data.details && Math.abs(data.details.weightedMean - data.score) > 5) {
		insights.push(
			`Weighted mean (${data.details.weightedMean}) differs from consensus (${data.score})`,
		);
	}
	if (data.details?.outlierCount > 0) {
		insights.push(
			`${data.details.outlierCount} outlier${data.details.outlierCount !== 1 ? "s" : ""} detected and ${strategyLabel(data.strategy)} strategy applied`,
		);
	}
	if (staleCount > 0) {
		insights.push(
			`${staleCount} provider${staleCount !== 1 ? "s" : ""} reporting stale data`,
		);
	}
	if (errorCount > 0) {
		insights.push(
			`${errorCount} provider${errorCount !== 1 ? "s" : ""} currently failing`,
		);
	}
	if (sd > 20) {
		insights.push(`High volatility across providers (σ=${sd})`);
	}
	if (data.details && data.details.n >= 5 && sd < 10) {
		insights.push("Strong consensus across a broad provider set");
	}
	if (data.confidence !== undefined && data.confidence < 0.45) {
		insights.push(
			`Low data quality confidence (${Math.round(data.confidence * 100)}%) — consensus may be unreliable`,
		);
	}
	if (data.details && data.details.maxAgeMinutes > 7) {
		insights.push(
			`Data age gap: newest provider ${data.details.maxAgeMinutes} min behind freshness window`,
		);
	}

	return (
		<div
			className="card animate-fade-in"
			style={{ animationDelay: "0.15s" }}
		>
			<h3
				className="text-xs font-semibold uppercase tracking-widest mb-4"
				style={{ color: "var(--color-text-tertiary)" }}
			>
				Market Insights
			</h3>
			{insights.length ? (
				<ul className="space-y-2">
					{insights.map((text, i) => (
						<li
							key={i}
							className="flex items-start gap-2 text-sm"
							style={{ color: "var(--color-text-secondary)" }}
						>
							<span style={{ color: "var(--color-accent)" }}>
								›
							</span>
							{text}
						</li>
					))}
				</ul>
			) : (
				<p
					className="text-sm"
					style={{ color: "var(--color-text-muted)" }}
				>
					No significant insights detected for this market at this
					time.
				</p>
			)}
		</div>
	);
}

export function MarketSection({
	title,
	data,
	theme,
}: {
	title: string;
	data: ConsensusResult | null;
	theme: "light" | "dark";
}) {
	const providers = data?.providers ?? [];
	const scores = providers.filter((p) => !p.error).map((p) => p.score);

	const derivedMetrics = useMemo(() => {
		if (scores.length === 0) {
			return {
				range: "—",
				delta: "—",
				iqr: "—",
				agreement: "—",
				variance: "—",
				outlierRatio: "—",
			};
		}
		const sorted = [...scores].sort((a, b) => a - b);
		const min = sorted[0];
		const max = sorted[sorted.length - 1];
		const q1 = percentile(sorted, 25);
		const q3 = percentile(sorted, 75);
		const iqrVal = q3 - q1;
		const varVal = variance(scores);
		const outlierRatio =
			data?.details && data.details.n > 0
				? Math.round((data.details.outlierCount / data.details.n) * 100)
				: 0;

		return {
			range: `${min}-${max}`,
			delta: max - min,
			iqr: Math.round(iqrVal),
			agreement: `${Math.round((1 - iqrVal / 100) * 100)}%`,
			variance: Math.round(varVal),
			outlierRatio: `${outlierRatio}%`,
		};
	}, [scores, data?.details]);

	return (
		<div className="space-y-6 animate-fade-in">
			<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
				<div>
					<h2
						className="font-display font-bold text-2xl sm:text-3xl tracking-tight"
						style={{ color: "var(--color-text-primary)" }}
					>
						{title}
					</h2>
					<p
						className="text-sm mt-1"
						style={{ color: "var(--color-text-tertiary)" }}
					>
						{data?.providerCount ?? 0} providers reporting
						{data?.lastUpdated
							? ` · Updated ${new Date(data.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
							: ""}
					</p>
				</div>
				{data && (
					<span
						className="text-sm font-semibold px-3 py-1.5 rounded-lg"
						style={{
							background: "var(--color-bg-sunken)",
							color: getSentimentColor(data.score, theme),
							border: "1px solid var(--color-border)",
						}}
					>
						{data.label}
					</span>
				)}
			</div>

			{data && scores.length > 0 ? (
				<>
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
						<MetricCard
							label="Consensus"
							value={data.score}
							highlight
						/>
						<MetricCard
							label="Strategy"
							value={
								<AutoFitText
									text={formatStrategyName(data.strategy)}
								/>
							}
							sub={formatStrategyDescription(data.strategy)}
						/>
						<MetricCard
							label="Confidence"
							value={`${Math.round((data.confidence ?? 0) * 100)}%`}
							sub="data quality metric"
						/>
						<MetricCard
							label="95% CI"
							value={
								data.ciLower !== undefined &&
								data.ciUpper !== undefined
									? `${data.ciLower}-${data.ciUpper}`
									: "—"
							}
							sub="confidence interval"
						/>
						<MetricCard
							label="Raw Median"
							value={data.details?.median ?? median(scores)}
							sub="unsmoothed center"
						/>
						<MetricCard
							label="Std Dev"
							value={stdDev(scores)}
							sub="volatility"
						/>
						<MetricCard
							label="Score Range"
							value={derivedMetrics.range}
							sub="min-max spread"
						/>
						<MetricCard
							label="Range Delta"
							value={derivedMetrics.delta}
							sub="max − min"
						/>
						<MetricCard
							label="IQR"
							value={derivedMetrics.iqr}
							sub="interquartile range"
						/>
						<MetricCard
							label="Score Variance"
							value={derivedMetrics.variance}
							sub="dispersion"
						/>
						<MetricCard
							label="Agreement Index"
							value={derivedMetrics.agreement}
							sub="provider consensus"
						/>
						<MetricCard
							label="Outlier Ratio"
							value={derivedMetrics.outlierRatio}
							sub="MAD-based outliers"
						/>
					</div>

					<div
						className="card animate-fade-in"
						style={{ animationDelay: "0.1s" }}
					>
						<h3
							className="text-xs font-semibold uppercase tracking-widest mb-4"
							style={{ color: "var(--color-text-tertiary)" }}
						>
							Score Distribution
						</h3>
						<DistributionBar providers={providers} theme={theme} />
					</div>

					<Insights data={data} />

					<div
						className="card animate-fade-in"
						style={{ animationDelay: "0.2s" }}
					>
						<h3
							className="text-xs font-semibold uppercase tracking-widest mb-4"
							style={{ color: "var(--color-text-tertiary)" }}
						>
							Provider Breakdown
						</h3>
						<div>
							{providers.map((p) => (
								<ProviderInsightRow
									key={p.provider}
									provider={p}
								/>
							))}
						</div>
					</div>
				</>
			) : (
				<div
					className="card animate-fade-in flex flex-col items-center justify-center py-16"
					style={{ animationDelay: "0.1s" }}
				>
					<p style={{ color: "var(--color-text-muted)" }}>
						No data available for {title.toLowerCase()}
					</p>
				</div>
			)}
		</div>
	);
}

export function MarketsView({
	stock,
	crypto,
	theme,
}: {
	stock: ConsensusResult | null;
	crypto: ConsensusResult | null;
	theme: "light" | "dark";
}) {
	return (
		<div className="space-y-16 sm:space-y-24 animate-fade-in">
			<div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
				<h1
					className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4"
					style={{ color: "var(--color-text-primary)" }}
				>
					Markets
				</h1>
				<p
					className="text-base leading-relaxed"
					style={{ color: "var(--color-text-secondary)" }}
				>
					Comprehensive market-level analysis featuring detailed
					statistical decompositions, cross-provider sentiment
					distributions, and algorithmically generated insights.
				</p>
			</div>

			<MarketSection title="Stock Market" data={stock} theme={theme} />
			<div style={{ height: "1px", background: "var(--color-border)" }} />
			<MarketSection title="Crypto Market" data={crypto} theme={theme} />
		</div>
	);
}
