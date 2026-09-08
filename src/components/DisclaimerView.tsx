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

export function DisclaimerView() {
	return (
		<div className="max-w-3xl mx-auto space-y-6">
			<div className="text-center mb-12">
				<h1
					className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4"
					style={{ color: "var(--color-text-primary)" }}
				>
					Disclaimer
				</h1>
				<p
					className="text-base leading-relaxed"
					style={{ color: "var(--color-text-secondary)" }}
				>
					Please read this disclaimer carefully before using FGI Hub.
				</p>
			</div>

			<Section title="Not Financial Advice">
				<p>
					The content provided by FGI Hub is for informational and educational
					purposes only. It does not constitute financial, investment, tax, or
					legal advice. You should not treat any information on this site as a
					recommendation to buy, sell, or hold any security or other financial
					instrument.
				</p>
			</Section>

			<Section title="No Guarantee of Accuracy">
				<p>
					While we strive to provide accurate and up-to-date information, FGI Hub
					makes no representations or warranties of any kind, express or implied,
					about the completeness, accuracy, reliability, suitability, or
					availability of the data and analysis presented.
				</p>
			</Section>

			<Section title="Risk Disclosure">
				<p>
					Trading and investing in financial markets involve significant risk of
					loss and are not suitable for every investor. Past performance is not
					indicative of future results. Always conduct your own research and
					consult with a qualified financial advisor before making investment
					decisions.
				</p>
			</Section>

			<Section title="Third-Party Data">
				<p>
					FGI Hub aggregates data from third-party providers. We do not endorse or
					verify the accuracy of any third-party data. The sentiment scores and
					analysis presented are derived from external sources and may contain
					errors or delays.
				</p>
			</Section>
		</div>
	);
}
