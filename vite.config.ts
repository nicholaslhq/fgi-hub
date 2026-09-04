import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

function serverMiddleware(): Plugin {
	return {
		name: "fgi-hub:server-middleware",
		configureServer(server) {
			const dataMode = process.env.FGI_DATA_MODE || "mock";

			if (dataMode === "prod") {
				server.middlewares.use(
					"/api",
					async (
						req: IncomingMessage,
						res: ServerResponse,
						next: () => void,
					) => {
						const url = new URL(
							req.url || "",
							`http://${req.headers.host || "localhost"}`,
						);
						const path = url.pathname.replace(/^\/api/, "");

						if (
							path === "/consensus/stock" ||
							path === "/consensus/crypto"
						) {
							try {
								const mod = await import(
									"./src/services/index.server.js"
								);
								const result =
									path === "/consensus/stock"
										? await mod.fetchStockConsensusProd()
										: await mod.fetchCryptoConsensusProd();
								res.setHeader("Content-Type", "application/json");
								res.end(JSON.stringify(result));
							} catch (err) {
								res.statusCode = 502;
								res.setHeader("Content-Type", "application/json");
								res.end(
									JSON.stringify({
										error:
											err instanceof Error
												? err.message
												: "Failed to aggregate consensus",
									}),
								);
							}
						} else if (path === "/health") {
							res.setHeader("Content-Type", "application/json");
							res.end(JSON.stringify({ status: "ok" }));
						} else {
							next();
						}
					},
				);
			}
		},
	};
}

export default defineConfig({
	plugins: [react(), tailwindcss(), serverMiddleware()],
	test: {
		environment: "node",
		include: ["src/**/*.test.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "lcov"],
			include: ["src/services/aggregation.ts"],
		},
	},
});
