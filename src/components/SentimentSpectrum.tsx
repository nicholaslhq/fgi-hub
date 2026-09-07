import type React from "react";
import type { ProviderScore } from "../types";
import { isStale } from "../utils/time";
import { Timestamp } from "./Timestamp";

export function getSentimentColor(
	score: number,
	theme: "light" | "dark",
): string {
	const colors =
		theme === "dark"
			? {
					fear: [248, 113, 113] as [number, number, number],
					neutral: [250, 204, 21] as [number, number, number],
					greed: [52, 211, 153] as [number, number, number],
				}
			: {
					fear: [220, 38, 38] as [number, number, number],
					neutral: [202, 138, 4] as [number, number, number],
					greed: [5, 150, 105] as [number, number, number],
				};

	const t = score <= 50 ? score / 50 : (score - 50) / 50;
	const from = score <= 50 ? colors.fear : colors.neutral;
	const to = score <= 50 ? colors.neutral : colors.greed;

	const r = Math.round(from[0] + (to[0] - from[0]) * t);
	const g = Math.round(from[1] + (to[1] - from[1]) * t);
	const b = Math.round(from[2] + (to[2] - from[2]) * t);

	return `rgb(${r}, ${g}, ${b})`;
}

export function SentimentSpectrum({
	score,
	theme,
}: {
	score: number;
	theme: "light" | "dark";
}) {
	return (
		<div className="spectrum-container mt-8">
			<div className="spectrum-track">
				<div className="spectrum-zones">
					<div className="spectrum-zone-fear" />
					<div className="spectrum-zone-neutral" />
					<div className="spectrum-zone-greed" />
				</div>
				<div className="spectrum-marker" style={{ left: `${score}%` }}>
					<div className="spectrum-marker-line" />
					<div
						className="spectrum-marker-dot"
						style={
							{
								"--pulse-color": getSentimentColor(
									score,
									theme,
								),
								backgroundColor: getSentimentColor(
									score,
									theme,
								),
							} as React.CSSProperties
						}
					/>
				</div>
			</div>
			<div className="spectrum-tick-labels">
				<span>0</span>
				<span>25</span>
				<span>50</span>
				<span>75</span>
				<span>100</span>
			</div>
			<div className="spectrum-labels">
				<span>Fear</span>
				<span>Neutral</span>
				<span>Greed</span>
			</div>
		</div>
	);
}

export function ScoreDisplay({
	score,
	label,
	market,
	timestamp,
	size = "lg",
	theme,
}: {
	score: number;
	label: string;
	market: string;
	timestamp: string;
	size?: "sm" | "md" | "lg";
	theme: "light" | "dark";
}) {
	const color = getSentimentColor(score, theme);
	const sizeClasses = {
		sm: "text-4xl sm:text-5xl",
		md: "text-5xl sm:text-6xl",
		lg: "text-6xl sm:text-7xl lg:text-8xl",
	};

	return (
		<div className="flex flex-col items-start">
			<div className="flex items-baseline gap-3 sm:gap-4">
				<span
					className={`score-value ${sizeClasses[size]}`}
					style={{ color }}
				>
					{score}
				</span>
				<span className="score-label" style={{ color }}>
					{label}
				</span>
			</div>
			<div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4">
				<span className="market-tag">{market}</span>
				<Timestamp iso={timestamp} size="xs" showDot />
			</div>
		</div>
	);
}

export function ProviderRow({
	provider,
	theme,
}: {
	provider: ProviderScore;
	theme: "light" | "dark";
}) {
	const hasError = !!provider.error;
	const stale = !hasError && isStale(provider.timestamp);
	const color = stale
		? theme === "dark"
			? "rgb(250, 204, 21)"
			: "rgb(202, 138, 4)"
		: getSentimentColor(provider.score, theme);
	const status = hasError ? "error" : stale ? "stale" : "active";

	const titleClassName = "text-sm font-medium truncate provider-link";
	const titleStyle = { color: "var(--color-text-primary)" };

	return (
		<div className="provider-row">
			<div className="flex items-center gap-3 flex-1 min-w-0">
				<div
					className={`status-dot ${status}`}
					title={provider.error || (stale ? "Stale" : "Active")}
				/>
				<div className="min-w-0">
					{provider.source ? (
						<a
							href={provider.source}
							target="_blank"
							rel="noopener noreferrer"
							className={titleClassName}
							style={titleStyle}
						>
							<span className="provider-link-text">{provider.provider}</span>
							<span className="provider-link-icon" aria-hidden="true">
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
									<line x1="10" y1="14" x2="21" y2="3" />
								</svg>
							</span>
						</a>
					) : (
						<p className={titleClassName} style={titleStyle}>
							{provider.provider}
						</p>
					)}
					<p
						className="text-xs mt-0.5"
						style={{ color: "var(--color-text-tertiary)" }}
					>
						{provider.error ? (
							<span style={{ color: "var(--color-fear)" }}>
								{provider.error}
							</span>
						) : (
							<Timestamp iso={provider.timestamp} size="xs" />
						)}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-3 sm:gap-4">
				{!hasError && (
					<div className="provider-bar-track hidden sm:block">
						<div
							className="provider-bar-fill"
							style={{
								width: `${provider.score}%`,
								backgroundColor: color,
							}}
						/>
					</div>
				)}
				<div className="text-right w-14 sm:w-16">
					<p
						className="font-mono text-sm font-semibold"
						style={{ color: "var(--color-text-primary)" }}
					>
						{hasError ? "—" : provider.score}
					</p>
					{provider.confidence && !provider.error ? (
						<p
							className="text-xs"
							style={{ color: "var(--color-text-tertiary)" }}
						>
							{(provider.confidence * 100).toFixed(0)}%
						</p>
					) : null}
				</div>
			</div>
		</div>
	);
}
