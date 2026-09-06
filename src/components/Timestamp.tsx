import { formatTimestamp } from "../utils/time";
import { useTimeTicker } from "../hooks/useTimeTicker";

const TIER_DOT: Record<string, string> = {
	fresh: "var(--color-greed)",
	stale: "var(--color-neutral)",
	outdated: "var(--color-fear)",
};

export function Timestamp({
	iso,
	size = "sm",
	showDot = false,
}: {
	iso: string;
	size?: "xs" | "sm";
	showDot?: boolean;
}) {
	const now = useTimeTicker(30_000);
	const { text, tooltip, tier } = formatTimestamp(iso, now);

	const color = "var(--color-text-tertiary)";
	const dotColor = TIER_DOT[tier] ?? "var(--color-text-tertiary)";

	const sizeClasses = {
		xs: "text-[10px] sm:text-xs",
		sm: "text-xs sm:text-sm",
	};

	return (
		<span
			className={`inline-flex items-center gap-1 ${sizeClasses[size]}`}
			style={{ color }}
			title={tooltip}
		>
			{showDot && (
				<span
					className="w-1.5 h-1.5 rounded-full"
					style={{ backgroundColor: dotColor }}
				/>
			)}
			{text}
		</span>
	);
}
