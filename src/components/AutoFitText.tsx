import { useRef } from "react";
import { useAutoFitText } from "../hooks/useAutoFitText";

export function AutoFitText({
	text,
	className,
	style,
	minFontPx = 12,
	as = "span",
}: {
	text: string;
	className?: string;
	style?: React.CSSProperties;
	minFontPx?: number;
	as?: React.ElementType;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const { textRef, truncate } = useAutoFitText(text, containerRef, minFontPx);

	const Component = as;

	return (
		<div
			ref={containerRef}
			className={`auto-fit-text ${className ?? ""}`}
			style={style}
		>
			<Component
				ref={textRef as any}
				className="auto-fit-text__inner"
				style={{
					whiteSpace: "nowrap",
					overflow: truncate ? "hidden" : "visible",
					textOverflow: truncate ? "ellipsis" : "unset",
				}}
			>
				{text}
			</Component>
		</div>
	);
}
