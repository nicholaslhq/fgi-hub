import { dataSources } from "../data/sources";
import type { DataSource } from "../data/sources";

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className="card animate-fade-in"
			style={{ animationDelay: "0.1s" }}
		>
			<h2
				className="font-display font-semibold text-xl mb-4"
				style={{ color: "var(--color-text-primary)" }}
			>
				{title}
			</h2>
			<div
				className="text-base leading-relaxed space-y-4"
				style={{ color: "var(--color-text-secondary)" }}
			>
				{children}
			</div>
		</div>
	);
}

function MethodBadge({ method }: { method: DataSource["method"] }) {
	const label =
		method === "api_json"
			? "JSON API"
			: method === "html_scrape"
				? "HTML Parsing"
				: method === "simulated"
					? "Simulated"
					: method;
	return (
		<span
			className="inline-block text-xs font-mono font-medium px-2 py-0.5 rounded"
			style={{
				color: "var(--color-text-primary)",
				background: "var(--color-bg-sunken)",
			}}
		>
			{label}
		</span>
	);
}

function DataSourceCard({ source }: { source: DataSource }) {
	return (
		<div
			className="rounded-xl p-4 border"
			style={{
				background: "var(--color-bg-sunken)",
				borderColor: "var(--color-border-subtle)",
			}}
		>
			<div className="flex items-start justify-between gap-3 mb-2">
				<h3
					className="font-medium text-sm"
					style={{ color: "var(--color-text-primary)" }}
				>
					{source.name}
				</h3>
				<MethodBadge method={source.method} />
			</div>
			<p
				className="text-sm leading-relaxed mb-2"
				style={{ color: "var(--color-text-secondary)" }}
			>
				{source.description}
			</p>
			{source.sourceUrl && (
				<a
					href={source.sourceUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="inline-flex items-center gap-1 text-xs"
					style={{ color: "var(--color-accent)" }}
				>
					<span>View source</span>
					<svg
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
						<polyline points="15 3 21 3 21 9" />
						<line x1="10" y1="14" x2="21" y2="3" />
					</svg>
				</a>
			)}
		</div>
	);
}

function MarketSources({
	market,
	sources,
}: {
	market: "stock" | "crypto";
	sources: DataSource[];
}) {
	const liveSources = sources.filter((s) => s.dataMode !== "mock_only");

	return (
		<div className="space-y-4">
			<h3
				className="font-display font-semibold text-lg"
				style={{ color: "var(--color-text-primary)" }}
			>
				{market === "stock" ? "Stocks" : "Crypto"}
			</h3>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{liveSources.map((source) => (
					<DataSourceCard key={source.name} source={source} />
				))}
			</div>
		</div>
	);
}

export function DataSourcesView() {
	const stockSources = dataSources.filter((s) => s.market === "stock");
	const cryptoSources = dataSources.filter((s) => s.market === "crypto");

	return (
		<div className="max-w-5xl mx-auto space-y-6">
			<div className="text-center mb-12">
				<h1
					className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4"
					style={{ color: "var(--color-text-primary)" }}
				>
					Data Sources
				</h1>
				<p
					className="text-base leading-relaxed max-w-2xl mx-auto"
					style={{ color: "var(--color-text-secondary)" }}
				>
					FGI Hub aggregates sentiment data from multiple external
					providers. Below is the complete list of all data sources,
					organized by market. Each source contributes a normalized
					fear and greed score along with confidence and recency
					metrics.
				</p>
			</div>

			<Section title="Provider Aggregation">
				<p>
					The platform collects real-time and near-real-time sentiment
					signals from various financial data providers. Each
					provider&apos;s score is normalized to a 0–100 scale and
					weighted by confidence and data freshness.
				</p>
			</Section>

			<Section title="Data Freshness">
				<p>
					Provider data is timestamped and evaluated for staleness.
					The Adaptive Robust Aggregation framework adjusts weights
					based on the age of each data point, ensuring that newer
					signals have greater influence on the final consensus.
				</p>
			</Section>

			<Section title="Transparency">
				<p>
					FGI Hub is committed to transparency. The provider breakdown
					view shows individual provider contributions, weights, and
					outlier status. Users can inspect how the consensus score is
					derived from the underlying sources.
				</p>
			</Section>

			<Section title="API Availability">
				<p>
					Some providers offer public APIs that can be accessed
					directly. FGI Hub does not redistribute proprietary data
					feeds; instead, it computes aggregated insights from
					publicly available endpoints and licensed data feeds.
				</p>
			</Section>

			<Section title="Complete Source List">
				<div className="space-y-10">
					<MarketSources market="stock" sources={stockSources} />
					<MarketSources market="crypto" sources={cryptoSources} />
				</div>
			</Section>
		</div>
	);
}
