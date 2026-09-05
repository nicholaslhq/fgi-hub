import { useEffect, useRef, useState } from "react";

export function useTimeTicker(intervalMs: number = 30_000): number {
	const [tick, setTick] = useState(() => Date.now());
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		intervalRef.current = setInterval(() => {
			setTick(Date.now());
		}, intervalMs);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [intervalMs]);

	return tick;
}
