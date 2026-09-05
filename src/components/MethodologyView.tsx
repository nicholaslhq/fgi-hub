import { useTheme } from "../hooks/useTheme";
import { getSentimentColor } from "./SentimentSpectrum";
import { sentimentRange } from "../utils/sentiment";

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

function ScoreScale({ theme }: { theme: "light" | "dark" }) {
	const levels = [
		{ ...sentimentRange("Extreme Fear"), label: "Extreme Fear", score: 10 },
		{ ...sentimentRange("Fear"), label: "Fear", score: 30 },
		{ ...sentimentRange("Neutral"), label: "Neutral", score: 50 },
		{ ...sentimentRange("Greed"), label: "Greed", score: 70 },
		{
			...sentimentRange("Extreme Greed"),
			label: "Extreme Greed",
			score: 90,
		},
	];

	return (
		<div className="space-y-3">
			{levels.map((level) => (
				<div key={level.label} className="flex items-center gap-4">
					<div
						className="w-3 h-3 rounded-full shrink-0"
						style={{
							background: getSentimentColor(level.score, theme),
						}}
					/>
					<div className="flex-1">
						<span
							className="text-sm font-medium"
							style={{ color: "var(--color-text-primary)" }}
						>
							{level.label}
						</span>
						<span
							className="text-sm ml-2"
							style={{ color: "var(--color-text-tertiary)" }}
						>
							({level.min}–{level.max})
						</span>
					</div>
				</div>
			))}
		</div>
	);
}

function StrategyCard({
	strategy,
	description,
}: {
	strategy: string;
	description: string;
}) {
	return (
		<div
			className="rounded-xl p-4"
			style={{ background: "var(--color-bg-sunken)" }}
		>
			<span
				className="font-mono text-xs font-semibold uppercase"
				style={{ color: "var(--color-accent)" }}
			>
				{strategy}
			</span>
			<p
				className="text-sm mt-1"
				style={{ color: "var(--color-text-secondary)" }}
			>
				{description}
			</p>
		</div>
	);
}

function MetricDoc({
	name,
	definition,
	calculation,
	interpretation,
}: {
	name: string;
	definition: string;
	calculation: string;
	interpretation: string;
}) {
	return (
		<div
			className="rounded-xl p-5"
			style={{ background: "var(--color-bg-sunken)" }}
		>
			<h3
				className="text-sm font-semibold mb-2"
				style={{ color: "var(--color-text-primary)" }}
			>
				{name}
			</h3>
			<div
				className="space-y-2 text-sm"
				style={{ color: "var(--color-text-secondary)" }}
			>
				<p>
					<span
						className="font-medium"
						style={{ color: "var(--color-text-tertiary)" }}
					>
						Definition:{" "}
					</span>
					{definition}
				</p>
				<p>
					<span
						className="font-medium"
						style={{ color: "var(--color-text-tertiary)" }}
					>
						Calculation:{" "}
					</span>
					<code
						className="font-mono text-xs"
						style={{ color: "var(--color-text-primary)" }}
					>
						{calculation}
					</code>
				</p>
				<p>
					<span
						className="font-medium"
						style={{ color: "var(--color-text-tertiary)" }}
					>
						Interpretation:{" "}
					</span>
					{interpretation}
				</p>
			</div>
		</div>
	);
}

export function MethodologyView() {
	const { theme } = useTheme();

	return (
		<div className="space-y-8 animate-fade-in">
			<div className="text-center max-w-2xl mx-auto mb-12">
				<h1
					className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4"
					style={{ color: "var(--color-text-primary)" }}
				>
					Methodology
				</h1>
				<p
					className="text-base leading-relaxed"
					style={{ color: "var(--color-text-secondary)" }}
				>
					FGI Hub uses an Adaptive Robust Aggregation (ARA) framework
					that dynamically selects the optimal consensus strategy for
					each market based on real-time data quality, distribution
					characteristics, and provider reliability.
				</p>
			</div>

			<Section title="What is the Fear & Greed Index?">
				<p>
					The Fear & Greed Index is a sentiment indicator that
					measures the emotional state of market participants. It
					ranges from 0 (Extreme Fear) to 100 (Extreme Greed), helping
					investors identify potential market tops and bottoms driven
					by emotion.
				</p>
				<p>
					FGI Hub aggregates this index across multiple independent
					data providers for both stock and cryptocurrency markets,
					producing a more robust and less biased reading than any
					single source.
				</p>
			</Section>

			<Section title="Score Scale">
				<ScoreScale theme={theme} />
			</Section>

			<Section title="Markets Covered">
				<p>FGI Hub currently tracks two distinct markets:</p>
				<ul className="list-disc list-inside space-y-2 mt-2">
					<li>
						<span
							className="font-medium"
							style={{ color: "var(--color-text-primary)" }}
						>
							Stocks
						</span>{" "}
						— Equity market sentiment across major global indices.
					</li>
					<li>
						<span
							className="font-medium"
							style={{ color: "var(--color-text-primary)" }}
						>
							Crypto
						</span>{" "}
						— Cryptocurrency market sentiment across leading digital
						assets.
					</li>
				</ul>
				<p>
					Because stocks and crypto often exhibit different risk
					appetites, FGI Hub reports them separately while also
					providing an aggregated cross-market view.
				</p>
			</Section>

			<Section title="Data Freshness">
				<p>
					Provider data is refreshed on demand. Scores are
					timestamped, and any provider that has not updated within
					the last 15 minutes is excluded from the consensus. Within
					the freshness window, newer data carries proportionally more
					weight via exponential recency decay.
				</p>
			</Section>

			<Section title="Adaptive Robust Aggregation (ARA)">
				<p>
					The ARA framework operates in five sequential phases. At
					each phase, the algorithm characterizes the current data
					state and selects the most appropriate mathematical strategy
					— all decisions are deterministic, data-driven, and
					reproducible.
				</p>

				<div className="space-y-4 pt-2">
					<div>
						<span
							className="font-mono text-xs font-semibold uppercase"
							style={{ color: "var(--color-accent)" }}
						>
							Phase 1 — Validation & Weighting
						</span>
						<p
							className="text-sm mt-1"
							style={{ color: "var(--color-text-secondary)" }}
						>
							Each provider result is first validated (non-error,
							in-range, valid timestamp). Valid providers are then
							assigned a reliability weight combining three
							factors:
						</p>
						<p
							className="text-sm mt-1"
							style={{ color: "var(--color-text-secondary)" }}
						>
							<code
								className="font-mono"
								style={{ color: "var(--color-text-primary)" }}
							>
								wᵢ = confidenceᵢ × e^(−ageᵢ / τ) ×
								staleness_penaltyᵢ
							</code>
						</p>
						<p
							className="text-xs mt-1"
							style={{ color: "var(--color-text-tertiary)" }}
						>
							Where τ = 5 min sets the recency half-life,
							confidence comes from the provider, and staleness
							penalty gradually reduces weight for providers aged
							beyond 70% of the freshness window.
						</p>
					</div>

					<div>
						<span
							className="font-mono text-xs font-semibold uppercase"
							style={{ color: "var(--color-accent)" }}
						>
							Phase 2 — Outlier Detection
						</span>
						<p
							className="text-sm mt-1"
							style={{ color: "var(--color-text-secondary)" }}
						>
							Using the Median Absolute Deviation (MAD), the
							framework computes robust z-scores for each
							provider. Values exceeding a z-score of 3.5 are
							flagged as outliers — this is resistant to masking
							effects that plague standard deviation-based
							methods.
						</p>
					</div>

					<div>
						<span
							className="font-mono text-xs font-semibold uppercase"
							style={{ color: "var(--color-accent)" }}
						>
							Phase 3 — Multi-Strategy Estimation
						</span>
						<p
							className="text-sm mt-1"
							style={{ color: "var(--color-text-secondary)" }}
						>
							The framework computes four candidate estimators in
							parallel:
						</p>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
							<StrategyCard
								strategy="Weighted Mean"
								description="Efficiency-optimal when data is clean, confident, and low-dispersion."
							/>
							<StrategyCard
								strategy="Median"
								description="Maximum outlier resistance at the cost of some efficiency."
							/>
							<StrategyCard
								strategy="Trimmed Mean"
								description="Removes flagged outliers, then applies reliability-weighted averaging."
							/>
							<StrategyCard
								strategy="Bayesian Shrinkage"
								description="Small-sample regularization toward neutral (50) prior."
							/>
						</div>
					</div>

					<div>
						<span
							className="font-mono text-xs font-semibold uppercase"
							style={{ color: "var(--color-accent)" }}
						>
							Phase 4 — Quality Assessment
						</span>
						<p
							className="text-sm mt-1"
							style={{ color: "var(--color-text-secondary)" }}
						>
							Six quality signals are computed from the data:
							provider count, outlier ratio, robust coefficient of
							variation (MAD/median), mean provider confidence,
							effective sample size (Kish's formula), and maximum
							data age.
						</p>
					</div>

					<div>
						<span
							className="font-mono text-xs font-semibold uppercase"
							style={{ color: "var(--color-accent)" }}
						>
							Phase 5 — Adaptive Strategy Selection
						</span>
						<p
							className="text-sm mt-1"
							style={{ color: "var(--color-text-secondary)" }}
						>
							Based on the quality signals, the framework
							deterministically selects the most appropriate
							estimator. The decision rules are functions of data
							characteristics, not hardcoded to any single market
							condition:
						</p>
						<div className="space-y-2 mt-2">
							<div
								className="text-xs"
								style={{ color: "var(--color-text-tertiary)" }}
							>
								<strong
									style={{
										color: "var(--color-text-primary)",
									}}
								>
									n &lt; 3
								</strong>
								→ Bayesian shrinkage (small-sample
								regularization)
							</div>
							<div
								className="text-xs"
								style={{ color: "var(--color-text-tertiary)" }}
							>
								<strong
									style={{
										color: "var(--color-text-primary)",
									}}
								>
									Outlier ratio &ge; 40%
								</strong>
								→ Median (too many anomalies for averaging)
							</div>
							<div
								className="text-xs"
								style={{ color: "var(--color-text-tertiary)" }}
							>
								<strong
									style={{
										color: "var(--color-text-primary)",
									}}
								>
									Robust CV &gt; 0.25
								</strong>
								→ Median (high disagreement)
							</div>
							<div
								className="text-xs"
								style={{ color: "var(--color-text-tertiary)" }}
							>
								<strong
									style={{
										color: "var(--color-text-primary)",
									}}
								>
									Outliers present, CV &gt; 0.20
								</strong>
								→ Trimmed mean (remove outliers, then weight)
							</div>
							<div
								className="text-xs"
								style={{ color: "var(--color-text-tertiary)" }}
							>
								<strong
									style={{
										color: "var(--color-text-primary)",
									}}
								>
									Otherwise
								</strong>
								→ Confidence-weighted mean (efficiency-optimal)
							</div>
						</div>
					</div>
				</div>
			</Section>

			<Section title="Confidence &amp; Uncertainty">
				<p>
					Every consensus score is accompanied by a confidence metric
					(0–1) derived from the quality signals, and a 95% confidence
					interval computed using robust statistics (MAD-based
					standard error for robust strategies, Kish-weighted standard
					error for parametric strategies).
				</p>
				<div
					className="rounded-xl p-4 font-mono text-sm text-center mt-2"
					style={{
						background: "var(--color-bg-sunken)",
						color: "var(--color-text-primary)",
					}}
				>
					Confidence = (n/(n+2)) × (1−CV) × (1−2×outlier_ratio) ×
					mean_confidence × (effective_n/n) × stability
				</div>
				<p
					className="text-xs mt-1"
					style={{ color: "var(--color-text-tertiary)" }}
				>
					Each factor is clamped to [0, 1] and the product is clamped
					to [0, 1]. A score of 0.90 means high certainty that the
					true consensus falls within the reported range.
				</p>
			</Section>

			<Section title="Temporal Smoothing">
				<p>
					The framework applies Bayesian temporal smoothing: each new
					score is blended with the previous score using an alpha
					coefficient that increases with confidence. High-confidence
					reads trust the current data (α → 0.8), while low-confidence
					reads lean more on the prior (α → 0.3), preventing whipsaws.
				</p>
				<div
					className="rounded-xl p-4 font-mono text-sm text-center mt-2"
					style={{
						background: "var(--color-bg-sunken)",
						color: "var(--color-text-primary)",
					}}
				>
					Score = α × raw + (1−α) × previous, where α ∈ [0.3, 0.8]
				</div>
			</Section>

			<Section title="Cross-Market Synthesis">
				<p>
					For the overview tab, stock and crypto market scores are
					combined using confidence-weighted blending — each market's
					ARA confidence determines its contribution. A Bayesian
					regularization step toward neutral (50) provides additional
					stability since only two data points are available at this
					level.
				</p>
			</Section>

			<Section title="Metrics Dictionary">
				<p className="mb-6">
					Every metric displayed in the Markets tab is derived from
					the provider score dataset. Below is a comprehensive
					reference for each indicator, including its mathematical
					definition and practical interpretation.
				</p>
				<div className="grid grid-cols-1 gap-4">
					<MetricDoc
						name="Consensus Score"
						definition="The final aggregated Fear & Greed Index score (0–100) produced by the ARA framework. It represents the single best estimate of current market sentiment after weighting, outlier removal, and strategy selection."
						calculation="score = clamp(strategy_output, 0, 100), where strategy_output is selected from {weighted_mean, median, trimmed_mean, bayesian_shrinkage} by Phase 5 rules, then smoothed: smoothed = α × raw + (1−α) × previous."
						interpretation="0–20 = Extreme Fear (potential buying opportunity); 21–40 = Fear (cautious optimism); 41–60 = Neutral (no strong bias); 61–80 = Greed (increasing risk); 81–100 = Extreme Greed (potential selling opportunity)."
					/>
					<MetricDoc
						name="Strategy"
						definition="The aggregation method selected by the ARA framework's Phase 5 rules. It indicates which statistical estimator produced the final consensus score."
						calculation="Deterministic branching: n<3 → bayesian_shrinkage; outlierRatio≥0.4 → median; robustCV>0.25 → median; outliers+CV>0.20 → trimmed_mean; else → weighted_mean."
						interpretation="weighted_mean = clean, confident data. median = high disagreement or many outliers. trimmed_mean = moderate outliers with manageable dispersion. bayesian_shrinkage = very few providers (&lt;3). fallback = no valid providers."
					/>
					<MetricDoc
						name="Confidence"
						definition="A composite score (0–1) reflecting how reliable the consensus is. It combines the confidence interval width (primary signal, 60%), provider self-reported confidence (25%), and data quality metrics (15%)."
						calculation="confidence = clamp( [ciScore×0.60 + meanProviderConfidence×0.25 + qualityComposite×0.15], 0, 1 ), where ciScore = 1 - (ciUpper-ciLower)/100 and qualityComposite = sizeQuality×0.15 + dispersionQuality×0.35 + outlierQuality×0.25 + effectiveNQuality×0.25."
						interpretation=">0.70 = high confidence; the consensus is likely accurate. 0.45–0.70 = moderate confidence; treat the score as directional. <0.45 = low confidence; the consensus may be unreliable due to small sample, high disagreement, or stale data."
					/>
					<MetricDoc
						name="95% Confidence Interval (CI)"
						definition="A range [ciLower, ciUpper] within which the true market sentiment is expected to fall 95% of the time, assuming the current sample is representative."
						calculation="margin = 1.96 × SE, where SE = robustSigma / √n for median/MAD strategies, or SE = weightedStdDev / √effectiveN for parametric strategies. robustSigma = MAD / 0.6745."
						interpretation="Narrow intervals (width &lt; 10) indicate precise estimates. Wide intervals (width &gt; 20) signal high uncertainty. If the interval crosses the Neutral midpoint (50), the true sentiment could be either fearful or greedy."
					/>
					<MetricDoc
						name="Median"
						definition="The middle value of the active provider scores when sorted. A robust measure of central tendency unaffected by extreme values."
						calculation="median = sorted_scores[⌊n/2⌋] for odd n; average of sorted_scores[n/2−1] and sorted_scores[n/2] for even n."
						interpretation="When the strategy is median, this is the consensus. When displayed alongside the consensus, a large gap between median and consensus indicates the weighted average was pulled toward a cluster of high-confidence providers."
					/>
					<MetricDoc
						name="Standard Deviation (Std Dev)"
						definition="The average dispersion of active provider scores around their arithmetic mean. Measures typical deviation in score units."
						calculation="σ = √( Σ(scoreᵢ − mean)² / n ), where mean is the simple average of all active scores."
						interpretation="σ &lt; 10 = tight consensus; 10–20 = moderate spread; &gt;20 = high disagreement among providers. High std dev does not necessarily invalidate the consensus, but it warrants checking the outlier ratio and CI width."
					/>
					<MetricDoc
						name="Score Range"
						definition="The minimum and maximum scores across all active (non-error) providers, expressed as a span."
						calculation="range = [min(active_scores), max(active_scores)]"
						interpretation="Shows the full spectrum of opinion. A range of 20–80 indicates extreme disagreement. A range of 45–55 indicates strong consensus. Use with Range Delta for a single-number summary."
					/>
					<MetricDoc
						name="Range Delta"
						definition="The absolute difference between the highest and lowest active provider scores."
						calculation="delta = max(active_scores) − min(active_scores)"
						interpretation="0–15 = strong consensus. 16–30 = moderate spread. &gt;30 = high divergence; the consensus should be treated with caution and the CI width examined."
					/>
					<MetricDoc
						name="Interquartile Range (IQR)"
						definition="The spread of the middle 50% of provider scores (75th percentile minus 25th percentile). Resistant to outliers and reveals the core dispersion."
						calculation="IQR = percentile(sorted_scores, 75) − percentile(sorted_scores, 25), using linear interpolation between ranks."
						interpretation="IQR &lt; 10 = providers are tightly clustered. 10–20 = moderate core dispersion. &gt;20 = even the middle half disagree substantially. Compare IQR to Range Delta: a small IQR with a large delta means outliers are driving the extremes."
					/>
					<MetricDoc
						name="Agreement Index"
						definition="A normalized score (0–100%) quantifying how much providers agree. It is derived from the IQR: perfect agreement = 100%, total disagreement = 0%."
						calculation="agreement = round( (1 − IQR / 100) × 100 )%"
						interpretation="&gt;80% = strong provider consensus. 60–80% = moderate agreement. &lt;60% = fragmented sentiment; the consensus is an average of opposing views. Low agreement often coincides with median strategy selection."
					/>
					<MetricDoc
						name="Score Variance"
						definition="The average squared deviation of active provider scores from their mean. Unlike std dev, variance is not normalized back to score units."
						calculation="variance = Σ(scoreᵢ − mean)² / n"
						interpretation="Useful for comparing dispersion across markets or time periods without taking a square root. Lower variance = more homogeneous provider sentiment. High variance = heterogeneous views that may reflect genuine market uncertainty."
					/>
					<MetricDoc
						name="Outlier Ratio"
						definition="The percentage of active providers flagged as statistical outliers by the MAD-based robust z-score test (threshold: 3.5)."
						calculation="outlierRatio = round( (outlierCount / n) × 100 )%, where outlierCount is the number of providers with robust z-score > 3.5."
						interpretation="0% = no extreme views. 1–20% = normal variation. &gt;20% = significant minority of providers hold extreme sentiment; the consensus may be pulled toward the majority view and understate tail risk."
					/>
				</div>
			</Section>
		</div>
	);
}
