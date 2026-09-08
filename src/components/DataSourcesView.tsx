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

export function DataSourcesView() {
	return (
		<div className="max-w-3xl mx-auto space-y-6">
			<div className="text-center mb-12">
				<h1
					className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4"
					style={{ color: "var(--color-text-primary)" }}
				>
					Data Sources
				</h1>
				<p
					className="text-base leading-relaxed"
					style={{ color: "var(--color-text-secondary)" }}
				>
					FGI Hub aggregates sentiment data from multiple external providers.
					Each source contributes a normalized fear and greed score along with
					confidence and recency metrics.
				</p>
			</div>

			<Section title="Provider Aggregation">
				<p>
					The platform collects real-time and near-real-time sentiment signals from
					various financial data providers. Each provider&apos;s score is normalized
					to a 0–100 scale and weighted by confidence and data freshness.
				</p>
			</Section>

			<Section title="Data Freshness">
				<p>
					Provider data is timestamped and evaluated for staleness. The Adaptive
					Robust Aggregation framework adjusts weights based on the age of each
					data point, ensuring that newer signals have greater influence on the
					final consensus.
				</p>
			</Section>

			<Section title="Transparency">
				<p>
					FGI Hub is committed to transparency. The provider breakdown view shows
					individual provider contributions, weights, and outlier status. Users
					can inspect how the consensus score is derived from the underlying
					sources.
				</p>
			</Section>

			<Section title="API Availability">
				<p>
					Some providers offer public APIs that can be accessed directly. FGI Hub
					does not redistribute proprietary data feeds; instead, it computes
					aggregated insights from publicly available endpoints and licensed data
					feeds.
				</p>
			</Section>
		</div>
	);
}
