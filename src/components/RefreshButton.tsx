import { useEffect, useState } from "react";

export function RefreshButton({
	onClick,
	isLoading,
	isStale,
}: {
	onClick: () => void;
	isLoading: boolean;
	isStale?: boolean;
}) {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		setPrefersReducedMotion(mediaQuery.matches);
		const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
		mediaQuery.addEventListener("change", handler);
		return () => mediaQuery.removeEventListener("change", handler);
	}, []);

	return (
		<button
			onClick={onClick}
			disabled={isLoading}
			className="icon-btn relative"
			aria-label={isStale ? "Refresh sentiment data (data is stale)" : "Refresh sentiment data"}
			title={isStale ? "Data is stale — click to refresh" : "Refresh"}
			style={{
				animationPlayState: isStale && !isLoading && !prefersReducedMotion ? "running" : "paused",
			}}
		>
			{isStale && (
				<span className="stale-pulse-ring" aria-hidden="true" />
			)}
			<svg
				className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				strokeWidth={2}
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M20 4v5h-.582m-15.356 2A8.001 8.001 0 0119.418 9m0 0H15m-11 11v-5h.581m0 0a8.003 8.003 0 0015.357-2m-15.357 2H9"
				/>
			</svg>
		</button>
	);
}