import { useEffect, useRef, useState } from "react";
import { getLoadingMessage, getRandomLoadingMessage } from "../utils/loadingMessages";

export function useRotatingLoadingMessage(
	intervalMs: number = 3_000,
): string {
	const [index, setIndex] = useState(() => Math.floor(Math.random() * 1000));
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		intervalRef.current = setInterval(() => {
			setIndex((prev) => prev + 1);
		}, intervalMs);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [intervalMs]);

	return getLoadingMessage(index);
}

export function useLoadingMessage(): string {
	return getRandomLoadingMessage();
}
