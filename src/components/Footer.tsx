const DATA_MODE_LABELS: Record<string, string> = {
	prod: "Using live production data from external APIs.",
	mock: "Uses mock data for initial development. Data is simulated and not from live APIs.",
};

const DATA_SOURCE_ERROR_LABEL = "Unable to load live production data — API endpoints unavailable";
const DATA_SOURCE_LOADING_LABEL = "Loading live production data...";

export function Footer({
	onNavigate,
	dataMode,
	apiAvailable,
	status,
}: {
	onNavigate?: (
		tab:
			| "overview"
			| "markets"
			| "methodology"
			| "about"
			| "terms"
			| "disclaimer"
			| "datasources",
	) => void;
	dataMode?: string;
	apiAvailable?: boolean | null;
	status?: string;
}) {
	const mode = dataMode ?? __FGI_DATA_MODE__;
	const isProdMode = mode === "prod";

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const handleNavigate = (tab: Parameters<NonNullable<typeof onNavigate>>[0]) => {
		scrollToTop();
		onNavigate?.(tab);
	};

	let label: string;
	if (status === "error") {
		label = isProdMode
			? DATA_SOURCE_ERROR_LABEL
			: DATA_MODE_LABELS.mock;
	} else if (status === "loading" || apiAvailable === null) {
		label = DATA_SOURCE_LOADING_LABEL;
	} else if (isProdMode) {
		label = DATA_MODE_LABELS.prod;
	} else {
		label = apiAvailable
			? DATA_MODE_LABELS.prod
			: DATA_MODE_LABELS.mock;
	}

	return (
		<footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-raised)]">
			<div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 sm:py-12">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
					<nav aria-label="Footer navigation">
						<h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-4">
							Navigation
						</h4>
						<ul className="space-y-1">
							<li>
								<button
									type="button"
									className="footer-link"
									onClick={() => handleNavigate("overview")}
								>
									Overview
								</button>
							</li>
							<li>
								<button
									type="button"
									className="footer-link"
									onClick={() => handleNavigate("markets")}
								>
									Markets
								</button>
							</li>
							<li>
								<button
									type="button"
									className="footer-link"
									onClick={() => handleNavigate("methodology")}
								>
									Methodology
								</button>
							</li>
						</ul>
					</nav>

					<nav aria-label="Legal navigation">
						<h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-4">
							Legal
						</h4>
						<ul className="space-y-1">
							<li>
								<button
									type="button"
									className="footer-link"
									onClick={() => handleNavigate("disclaimer")}
								>
									Disclaimer
								</button>
							</li>
							<li>
								<button
									type="button"
									className="footer-link"
									onClick={() => handleNavigate("terms")}
								>
									Terms of Service
								</button>
							</li>
							<li>
								<button
									type="button"
									className="footer-link"
									onClick={() => handleNavigate("datasources")}
								>
									Data Sources
								</button>
							</li>
						</ul>
					</nav>

					<nav aria-label="Connect" className="sm:col-span-2 lg:col-span-1">
						<h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-4">
							Connect
						</h4>
						<ul className="space-y-1">
							<li>
								<a
									href="https://github.com"
									target="_blank"
									rel="noopener noreferrer"
									className="footer-link"
								>
									GitHub
								</a>
							</li>
							<li>
								<button
									type="button"
									className="footer-link"
									onClick={() => handleNavigate("about")}
								>
									About
								</button>
							</li>
						</ul>
					</nav>
				</div>

				<div className="mt-8 sm:mt-12 pt-6 border-t border-[var(--color-border-subtle)]">
					<div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
						<div className="flex items-center gap-2 justify-center sm:justify-start">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="text-[var(--color-text-tertiary)]"
								aria-hidden="true"
							>
								<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
							</svg>
							<span className="text-sm font-semibold text-[var(--color-text-secondary)]">
								FGI Hub aggregates multiple sentiment sources
							</span>
						</div>

						<span className="text-xs text-[var(--color-text-tertiary)]">
							© {new Date().getUTCFullYear()} FGI Hub. All rights reserved.
						</span>
					</div>

					<p className="mt-4 text-xs text-[var(--color-text-tertiary)] text-center sm:text-left">
						{label}
					</p>
				</div>
			</div>
		</footer>
	);
}