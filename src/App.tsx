import { useFearGreed } from "./hooks/useFearGreed";
import { useTheme } from "./hooks/useTheme";
import { ThemeToggle } from "./components/ThemeToggle";
import {
	ScoreDisplay,
	SentimentSpectrum,
	getSentimentColor,
} from "./components/SentimentSpectrum";
import { ProviderConsensus } from "./components/ProviderConsensus";
import { SystemStatus } from "./components/SystemStatus";
import { RefreshButton } from "./components/RefreshButton";
import { MarketsView } from "./components/MarketsView";
import { MethodologyView } from "./components/MethodologyView";
import type { ConsensusResult } from "./types";
import { sentimentLabel } from "./utils/sentiment";
import React, { useState } from "react";

function MarketHero({
	data,
	market,
	theme,
}: {
	data: ConsensusResult;
	market: "stock" | "crypto";
	theme: "light" | "dark";
}) {
	return (
		<div className="flex-1 min-w-0">
			<ScoreDisplay
				score={data.score}
				label={data.label}
				market={market === "stock" ? "Stocks" : "Crypto"}
				timestamp={data.lastUpdated}
				size="lg"
				theme={theme}
			/>
			<div className="mt-8">
				<SentimentSpectrum score={data.score} theme={theme} />
			</div>
		</div>
	);
}

function MarketComparison({
	stock,
	crypto,
	theme,
}: {
	stock: ConsensusResult;
	crypto: ConsensusResult;
	theme: "light" | "dark";
}) {
	const stockLabel = sentimentLabel(stock.score);
	const stockGreed = stockLabel === "Greed" || stockLabel === "Extreme Greed";
	const stockFear = stockLabel === "Fear" || stockLabel === "Extreme Fear";
	const stockNeutral = stockLabel === "Neutral";

	const cryptoLabel = sentimentLabel(crypto.score);
	const cryptoGreed =
		cryptoLabel === "Greed" || cryptoLabel === "Extreme Greed";
	const cryptoFear = cryptoLabel === "Fear" || cryptoLabel === "Extreme Fear";
	const cryptoNeutral = cryptoLabel === "Neutral";

	const delta = stock.score - crypto.score;

	const deltaLabel =
		stock.score === crypto.score
			? "Markets aligned"
			: stockGreed && cryptoGreed
				? stock.score >= crypto.score
					? "Stocks are more greedy"
					: "Crypto is more greedy"
				: stockFear && cryptoFear
					? stock.score <= crypto.score
						? "Stocks are more fearful"
						: "Crypto is more fearful"
					: stockNeutral && cryptoNeutral
						? "Markets differ"
						: stockGreed && cryptoFear
							? "Stocks are more greedy"
							: stockFear && cryptoGreed
								? "Crypto is more greedy"
								: stockGreed
									? "Stocks are more greedy"
									: cryptoGreed
										? "Crypto is more greedy"
										: stockFear
											? "Stocks are more fearful"
											: "Crypto is more fearful";

	const isFearComparison = deltaLabel.includes("fearful");

	const displayDelta = isFearComparison ? -Math.abs(delta) : Math.abs(delta);

	const deltaColor =
		stock.score === crypto.score
			? getSentimentColor(50, theme)
			: stockGreed && cryptoGreed
				? getSentimentColor(Math.max(stock.score, crypto.score), theme)
				: stockFear && cryptoFear
					? getSentimentColor(
							Math.min(stock.score, crypto.score),
							theme,
						)
					: stockNeutral && cryptoNeutral
						? getSentimentColor(50, theme)
						: stockGreed || cryptoGreed
							? getSentimentColor(
									Math.max(stock.score, crypto.score),
									theme,
								)
							: getSentimentColor(
									Math.min(stock.score, crypto.score),
									theme,
								);

	return (
		<div
			className="card animate-fade-in"
			style={{ animationDelay: "0.1s" }}
		>
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 sm:mb-10">
				<h2
					className="text-xs font-mono font-semibold uppercase tracking-widest"
					style={{ color: "var(--color-text-tertiary)" }}
				>
					Cross-Market Sentiment
				</h2>
				<div className="flex items-center gap-3">
					<span
						className="text-sm font-medium"
						style={{ color: deltaColor }}
					>
						{deltaLabel}
					</span>
					{displayDelta !== 0 && (
						<span
							className="font-mono text-sm font-semibold px-2 py-0.5 rounded-md"
							style={{
								color: deltaColor,
								background: "var(--color-bg-sunken)",
							}}
						>
							{displayDelta > 0 ? "+" : ""}
							{displayDelta}
						</span>
					)}
				</div>
			</div>
			<div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
				<MarketHero data={stock} market="stock" theme={theme} />
				<div
					className="hidden lg:flex flex-col items-center justify-center"
					style={{ width: "1px", background: "var(--color-border)" }}
				/>
				<div
					className="lg:hidden"
					style={{ height: "1px", background: "var(--color-border)" }}
				/>
				<MarketHero data={crypto} market="crypto" theme={theme} />
			</div>
		</div>
	);
}

function getAggregatedSentiment(
	stock: ConsensusResult,
	crypto: ConsensusResult,
	theme: "light" | "dark",
) {
	// ═══════════════════════════════════════════════════════════════
	// PHASE 1: Per-Market Characterization
	//    Each market's ARA consensus confidence (0–1) quantifies
	//    how reliable the per-market score is.
	// ═══════════════════════════════════════════════════════════════

	const stockDeviation = stock.score - 50;
	const cryptoDeviation = crypto.score - 50;
	const stockIntensity = Math.abs(stockDeviation);
	const cryptoIntensity = Math.abs(cryptoDeviation);

	// Cross-market confidence levels (derived from per-market ARA)

	// ═══════════════════════════════════════════════════════════════
	// PHASE 2: Cross-Market Synthesis
	//    Confidence-weighted blend with Bayesian regularization
	//    toward neutral (50). Only 2 data points, so shrinkage
	//    strength is higher than per-market aggregation.
	// ═══════════════════════════════════════════════════════════════

	const spread = Math.abs(stock.score - crypto.score);

	const crossMarketShrinkage = 4;
	const stockConfScaled = Math.round(stock.confidence * 1000);
	const cryptoConfScaled = Math.round(crypto.confidence * 1000);
	const totalConfScaled = stockConfScaled + cryptoConfScaled;
	const numerator =
		2 *
			(stock.score * stockConfScaled + crypto.score * cryptoConfScaled) +
		50 * crossMarketShrinkage * 1000;
	const denominator = 2 * totalConfScaled + crossMarketShrinkage * 1000;
	const aggregatedScore = Math.round(numerator / denominator);

	// ═══════════════════════════════════════════════════════════════
	// PHASE 3: Dynamic Classification
	// ═══════════════════════════════════════════════════════════════

	const isAligned = stock.label === crypto.label;
	const dominantMarket =
		stockIntensity >= cryptoIntensity ? "stock" : "crypto";
	const spreadLevel = getSpreadLevel(spread);
	const avgConfidence = (stock.confidence + crypto.confidence) / 2;
	const consensusQuality = getConsensusQuality(avgConfidence);

	// ═══════════════════════════════════════════════════════════════
	// PHASE 4: Composable Dynamic Description
	// ═══════════════════════════════════════════════════════════════

	const description = (
		<>
			{describeCrossMarket(
				stock,
				crypto,
				isAligned,
				spreadLevel,
				dominantMarket,
				theme,
			)}{" "}
			{describeSynthesis(
				spreadLevel,
				consensusQuality,
				aggregatedScore,
				theme,
			)}
		</>
	);

	const aggregatedLabel = sentimentLabel(aggregatedScore);

	return {
		score: aggregatedScore,
		label: aggregatedLabel,
		description,
	};
}

// ═══════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════

function getSpreadLevel(
	spread: number,
): "unified" | "drifting" | "diverging" | "sharply split" {
	if (spread <= 10) return "unified";
	if (spread <= 20) return "drifting";
	if (spread <= 35) return "diverging";
	return "sharply split";
}

function getConsensusQuality(
	avgConfidence: number,
): "strong" | "moderate" | "mixed" {
	if (avgConfidence > 0.75) return "strong";
	if (avgConfidence > 0.45) return "moderate";
	return "mixed";
}

function describeCrossMarket(
	stock: ConsensusResult,
	crypto: ConsensusResult,
	isAligned: boolean,
	spreadLevel: string,
	dominantMarket: "stock" | "crypto",
	theme: "light" | "dark",
): React.ReactNode {
	const dominantData = dominantMarket === "stock" ? stock : crypto;
	const dominantColor = getSentimentColor(dominantData.score, theme);
	const dominantName = dominantMarket === "stock" ? "Stocks" : "Crypto";

	switch (spreadLevel) {
		case "unified":
			return isAligned ? (
				<>
					Both markets are tightly aligned, reinforcing a unified
					sentiment picture.
				</>
			) : (
				<>
					Despite differing labels, both markets are closely aligned
					in score, suggesting similar underlying sentiment.
				</>
			);
		case "drifting":
			return isAligned ? (
				<>
					Both markets share the same sentiment regime but express it
					with differing intensity.
				</>
			) : (
				<>
					The markets are drifting apart, with{" "}
					<span style={{ color: dominantColor }}>{dominantName}</span>{" "}
					leading sentiment direction.
				</>
			);
		case "diverging":
			return (
				<>
					The markets are diverging, with{" "}
					<span style={{ color: dominantColor }}>{dominantName}</span>{" "}
					pulling sentiment in its direction.
				</>
			);
		case "sharply split":
			return (
				<>
					Markets are sharply split, sending conflicting signals
					across asset classes with{" "}
					<span style={{ color: dominantColor }}>{dominantName}</span>{" "}
					dominating.
				</>
			);
	}
}

function describeSynthesis(
	spreadLevel: string,
	consensusQuality: string,
	aggregatedScore: number,
	theme: "light" | "dark",
): React.ReactNode {
	const color = getSentimentColor(aggregatedScore, theme);
	const label = sentimentLabel(aggregatedScore).toLowerCase();

	switch (spreadLevel) {
		case "unified":
			return (
				<>
					With {consensusQuality} consensus, markets present a unified{" "}
					<span style={{ color }}>{label}</span> outlook.
				</>
			);
		case "drifting":
			return (
				<>
					With {consensusQuality} consensus, the aggregate outlook
					remains <span style={{ color }}>{label}</span>, though
					slight divergence warrants attention.
				</>
			);
		case "diverging":
			return (
				<>
					The {consensusQuality} cross-market consensus suggests a
					contested <span style={{ color }}>{label}</span> environment
					where asset classes are processing different signals.
				</>
			);
		case "sharply split":
			return (
				<>
					This fragmented consensus reflects deep uncertainty,
					producing a contested <span style={{ color }}>{label}</span>{" "}
					cross-market picture.
				</>
			);
	}
}

function AppContent() {
	const { stock, crypto, status, lastRefreshed, error, refresh } =
		useFearGreed();
	const { theme, toggleTheme } = useTheme();
	const [activeTab, setActiveTab] = useState<
		"overview" | "markets" | "methodology"
	>("overview");
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const renderTabContent = () => {
		if (activeTab === "methodology") {
			return <MethodologyView />;
		}

		if (status === "loading") {
			return (
				<div className="flex flex-col items-center justify-center py-20 sm:py-32 gap-8">
					<div className="relative w-16 h-16 sm:w-20 sm:h-20">
						<div
							className="absolute inset-0 rounded-full"
							style={{
								border: "2px solid var(--color-border)",
							}}
						/>
						<div
							className="absolute inset-0 rounded-full animate-spin"
							style={{
								border: "2px solid transparent",
								borderTopColor: "var(--color-accent)",
								borderRightColor: "var(--color-accent)",
							}}
						/>
					</div>
					<div className="text-center">
						<p
							className="text-base font-medium"
							style={{ color: "var(--color-text-secondary)" }}
						>
							Aggregating sentiment data...
						</p>
					</div>
				</div>
			);
		}

		if (status === "error") {
			return (
				<div className="flex flex-col items-center justify-center py-20 sm:py-32 gap-8 animate-fade-in">
					<div
						className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center"
						style={{ background: "var(--color-fear-soft)" }}
					>
						<svg
							width="32"
							height="32"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							style={{ color: "var(--color-fear)" }}
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="12" y1="8" x2="12" y2="12" />
							<line x1="12" y1="16" x2="12.01" y2="16" />
						</svg>
					</div>
					<div className="text-center max-w-md px-4">
						<p
							className="font-display font-semibold text-xl"
							style={{ color: "var(--color-text-primary)" }}
						>
							Unable to load sentiment data
						</p>
						<p
							className="text-base mt-3"
							style={{ color: "var(--color-text-tertiary)" }}
						>
							{error || "Unknown error"}
						</p>
					</div>
					<button onClick={refresh} className="btn btn-primary">
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M21 12a9 9 0 11-6.219-8.56" />
							<polyline points="21 3 21 9 15 9" />
						</svg>
						Retry
					</button>
				</div>
			);
		}

		if (status === "idle") {
			return (
				<div className="flex flex-col items-center justify-center py-20 sm:py-32 gap-8 animate-fade-in">
					<div
						className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center"
						style={{
							background: "var(--color-bg-sunken)",
							border: "1px solid var(--color-border)",
						}}
					>
						<svg
							width="40"
							height="40"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							style={{ color: "var(--color-text-tertiary)" }}
						>
							<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
						</svg>
					</div>
					<div className="text-center max-w-sm px-4">
						<p
							className="font-display font-semibold text-xl"
							style={{ color: "var(--color-text-primary)" }}
						>
							No sentiment data loaded
						</p>
						<p
							className="text-base mt-3"
							style={{ color: "var(--color-text-tertiary)" }}
						>
							Click refresh to aggregate the latest Fear & Greed
							indices from multiple providers.
						</p>
					</div>
					<button onClick={refresh} className="btn btn-primary">
						<svg
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M21 12a9 9 0 11-6.219-8.56" />
							<polyline points="21 3 21 9 15 9" />
						</svg>
						Load Data
					</button>
				</div>
			);
		}

		if (status === "success" && stock && crypto) {
			if (activeTab === "markets") {
				return (
					<MarketsView stock={stock} crypto={crypto} theme={theme} />
				);
			}

			return (
				<div className="space-y-4 sm:space-y-6">
					<div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
						<h1
							className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4"
							style={{ color: "var(--color-text-primary)" }}
						>
							Overview
						</h1>
						{(() => {
							const aggregated = getAggregatedSentiment(
								stock,
								crypto,
								theme,
							);

							return (
								<p
									className="text-base leading-relaxed"
									style={{
										color: "var(--color-text-secondary)",
									}}
								>
									{aggregated.description}
								</p>
							);
						})()}
					</div>

					<MarketComparison
						stock={stock}
						crypto={crypto}
						theme={theme}
					/>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
						<ProviderConsensus
							data={stock}
							market="stock"
							theme={theme}
						/>
						<ProviderConsensus
							data={crypto}
							market="crypto"
							theme={theme}
						/>
					</div>

					<SystemStatus
						stock={stock}
						crypto={crypto}
						lastRefreshed={lastRefreshed}
					/>
				</div>
			);
		}

		return (
			<div className="flex flex-col items-center justify-center py-20 sm:py-32 gap-4 animate-fade-in">
				<p
					className="text-base font-medium"
					style={{ color: "var(--color-text-secondary)" }}
				>
					Data is loading or unavailable for this view.
				</p>
				<button onClick={refresh} className="btn btn-primary">
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M21 12a9 9 0 11-6.219-8.56" />
						<polyline points="21 3 21 9 15 9" />
					</svg>
					Refresh
				</button>
			</div>
		);
	};

	return (
		<div
			className="min-h-screen flex flex-col"
			style={{ background: "var(--color-bg-base)" }}
		>
			<header
				className="sticky top-0 z-50"
				style={{
					background: "var(--color-bg-base)",
					borderBottom: "1px solid var(--color-border)",
				}}
			>
				<div
					className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12"
					style={{ marginLeft: "auto", marginRight: "auto" }}
				>
					<div className="flex items-center justify-between h-14 sm:h-20">
						<div className="flex items-center gap-3 md:hidden">
							<button
								className="icon-btn"
								onClick={() =>
									setMobileMenuOpen((prev) => !prev)
								}
								aria-label={
									mobileMenuOpen
										? "Close navigation menu"
										: "Open navigation menu"
								}
								aria-expanded={mobileMenuOpen}
								title={mobileMenuOpen ? "Close menu" : "Menu"}
							>
								<span
									className={`menu-icon-wrapper ${
										mobileMenuOpen ? "is-open" : "is-closed"
									}`}
								>
									<svg
										className="menu-icon"
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										aria-hidden="true"
									>
										<line
											className="menu-line menu-line--top"
											x1="3"
											y1="6"
											x2="21"
											y2="6"
										/>
										<line
											className="menu-line menu-line--middle"
											x1="3"
											y1="12"
											x2="21"
											y2="12"
										/>
										<line
											className="menu-line menu-line--bottom"
											x1="3"
											y1="18"
											x2="21"
											y2="18"
										/>
									</svg>
								</span>
							</button>
						</div>

						<div className="hidden md:flex items-center gap-3">
							<div className="flex items-center gap-3">
								<svg
									width="28"
									height="28"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									style={{ color: "var(--color-accent)" }}
								>
									<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
								</svg>
								<span
									className="font-mono font-semibold uppercase tracking-widest"
									style={{
										color: "var(--color-text-primary)",
									}}
								>
									FGI Hub
								</span>
							</div>
						</div>

						<div className="flex md:hidden items-center gap-2">
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								style={{ color: "var(--color-accent)" }}
							>
								<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
							</svg>
							<span
								className="font-mono font-semibold uppercase tracking-widest text-sm"
								style={{
									color: "var(--color-text-primary)",
								}}
							>
								FGI Hub
							</span>
						</div>

						<nav className="hidden md:flex items-center gap-1">
							<button
								className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
								onClick={() => setActiveTab("overview")}
							>
								Overview
							</button>
							<button
								className={`nav-link ${activeTab === "markets" ? "active" : ""}`}
								onClick={() => setActiveTab("markets")}
							>
								Markets
							</button>
							<button
								className={`nav-link ${activeTab === "methodology" ? "active" : ""}`}
								onClick={() => setActiveTab("methodology")}
							>
								Methodology
							</button>
						</nav>

						<div className="flex items-center gap-2 sm:gap-3">
							<ThemeToggle theme={theme} onToggle={toggleTheme} />
							<RefreshButton
								onClick={refresh}
								isLoading={status === "loading"}
							/>
						</div>
					</div>
				</div>

				<div
					className={`mobile-menu md:hidden ${mobileMenuOpen ? "is-open" : "is-closed"}`}
					style={{ background: "var(--color-bg-base)" }}
				>
					<div
						className="max-w-7xl mx-auto px-4 py-3"
						style={{
							borderBottom: "1px solid var(--color-border)",
							marginLeft: "auto",
							marginRight: "auto",
						}}
					>
						<nav className="flex flex-col gap-1">
							<button
								className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
								onClick={() => {
									setActiveTab("overview");
									setMobileMenuOpen(false);
								}}
							>
								Overview
							</button>
							<button
								className={`nav-link ${activeTab === "markets" ? "active" : ""}`}
								onClick={() => {
									setActiveTab("markets");
									setMobileMenuOpen(false);
								}}
							>
								Markets
							</button>
							<button
								className={`nav-link ${activeTab === "methodology" ? "active" : ""}`}
								onClick={() => {
									setActiveTab("methodology");
									setMobileMenuOpen(false);
								}}
							>
								Methodology
							</button>
						</nav>
					</div>
				</div>
			</header>

			<main
				className="flex-1 w-full max-w-7xl px-6 sm:px-8 lg:px-12 py-12 sm:py-20"
				style={{ marginLeft: "auto", marginRight: "auto" }}
			>
				{renderTabContent()}
			</main>

			<footer
				className="py-4 sm:py-6 px-6 sm:px-8 lg:px-12"
				style={{
					borderTop: "1px solid var(--color-border)",
					background: "var(--color-bg-raised)",
				}}
			>
				<div
					className="max-w-7xl mx-auto"
					style={{ marginLeft: "auto", marginRight: "auto" }}
				>
					<div className="flex flex-col items-center justify-center gap-4 text-center">
						<div className="flex items-center gap-2">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								style={{ color: "var(--color-text-tertiary)" }}
							>
								<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
							</svg>
							<span
								className="text-xs font-semibold"
								style={{ color: "var(--color-text-secondary)" }}
							>
								FGI Hub aggregates multiple sentiment sources
							</span>
						</div>
						<p
							className="text-xs"
							style={{ color: "var(--color-text-tertiary)" }}
						>
							Uses mock data for initial development. Data is
							simulated and not from live APIs.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}

export default function App() {
	return <AppContent />;
}
