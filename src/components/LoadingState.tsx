import { useRotatingLoadingMessage } from "../hooks/useLoadingMessage";

export function LoadingState() {
	const message = useRotatingLoadingMessage();

	return (
		<div className="flex flex-col items-center justify-center py-16 gap-4">
			<div className="w-12 h-12 border-4 border-border border-t-text-primary rounded-full animate-spin" />
			<p className="text-text-secondary text-sm">{message}</p>
		</div>
	);
}
