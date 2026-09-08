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

export function AboutView({
	onNavigate,
}: {
	onNavigate?: (tab: "overview" | "markets" | "methodology" | "about" | "terms" | "disclaimer" | "datasources") => void;
}) {
	return (
		<div className="max-w-3xl mx-auto space-y-6">
			<div className="text-center mb-12">
				<h1
					className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4"
					style={{ color: "var(--color-text-primary)" }}
				>
					About FGI Hub
				</h1>
				<p
					className="text-base leading-relaxed"
					style={{ color: "var(--color-text-secondary)" }}
				>
					FGI Hub aggregates fear and greed sentiment data from multiple providers
					across stock and crypto markets, using an Adaptive Robust Aggregation
					framework to compute a consensus index.
				</p>
			</div>

			<Section title="What is the Fear & Greed Index?">
				<p>
					The Fear & Greed Index is a sentiment indicator that measures the emotional
					state of market participants. It ranges from 0 (Extreme Fear) to 100
					(Extreme Greed), helping traders and investors gauge market psychology.
				</p>
			</Section>

			<Section title="How Does FGI Hub Work?">
				<p>
					FGI Hub collects data from multiple sentiment providers, validates the
					inputs, detects outliers, and applies a multi-strategy aggregation
					framework. The system dynamically selects the optimal estimation method
					based on data quality signals, producing a robust consensus score.
				</p>
			</Section>

			<Section title="Data Sources">
				<p>
					FGI Hub aggregates sentiment from various external APIs and data providers.
					Each source contributes a normalized score along with a confidence metric
					and timestamp. 					For a complete list of sources, see the{" "}
					<button
						type="button"
						onClick={() => onNavigate?.("datasources")}
						className="inline-link"
					>
						Data Sources
					</button>{" "}
					page.
				</p>
			</Section>
		</div>
	);
}
