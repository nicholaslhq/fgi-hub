import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const THEME_KEY = "fgi-hub-theme";

function getSystemTheme(): Theme {
	if (typeof window === "undefined") return "light";
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function getStoredTheme(): Theme | null {
	if (typeof window === "undefined") return null;
	const stored = localStorage.getItem(THEME_KEY);
	if (stored === "light" || stored === "dark") return stored;
	return null;
}

export function useTheme() {
	const [theme, setTheme] = useState<Theme>(
		() => getStoredTheme() ?? getSystemTheme(),
	);

	useEffect(() => {
		const root = document.documentElement;
		const isDark = theme === "dark";
		root.classList.toggle("dark", isDark);
	}, [theme]);

	useEffect(() => {
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = (e: MediaQueryListEvent) => {
			const stored = getStoredTheme();
			if (!stored) {
				setTheme(e.matches ? "dark" : "light");
			}
		};
		media.addEventListener("change", handler);
		return () => media.removeEventListener("change", handler);
	}, []);

	const toggleTheme = () => {
		setTheme((prev) => (prev === "light" ? "dark" : "light"));
		localStorage.setItem(THEME_KEY, theme === "light" ? "dark" : "light");
	};

	return { theme, toggleTheme };
}
