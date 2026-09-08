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

export function TermsView() {
	return (
		<div className="max-w-3xl mx-auto space-y-6">
			<div className="text-center mb-12">
				<h1
					className="font-display font-bold text-3xl sm:text-4xl tracking-tight mb-4"
					style={{ color: "var(--color-text-primary)" }}
				>
					Terms of Service
				</h1>
				<p
					className="text-base leading-relaxed"
					style={{ color: "var(--color-text-secondary)" }}
				>
					By accessing or using FGI Hub, you agree to be bound by these terms.
				</p>
			</div>

			<Section title="Acceptance of Terms">
				<p>
					These Terms of Service govern your use of the FGI Hub website and
					services. By using our site, you accept these terms in full. If you
					disagree with any part of these terms, you must not use our services.
				</p>
			</Section>

			<Section title="Use License">
				<p>
					Permission is granted to temporarily view the materials on FGI Hub for
					personal, non-commercial transitory viewing only. This is the grant of
					a license, not a transfer of title.
				</p>
			</Section>

			<Section title="Disclaimer">
				<p>
					The materials on FGI Hub are provided on an &apos;as is&apos; basis.
					FGI Hub makes no warranties, expressed or implied, and hereby disclaims
					and negates all other warranties including, without limitation, implied
					warranties or conditions of merchantability, fitness for a particular
					purpose, or non-infringement of intellectual property or other violation
					of rights.
				</p>
			</Section>

			<Section title="Limitations">
				<p>
					In no event shall FGI Hub or its suppliers be liable for any damages
					(including, without limitation, damages for loss of data or profit, or
					due to business interruption) arising out of the use or inability to use
					the materials on FGI Hub.
				</p>
			</Section>
		</div>
	);
}
