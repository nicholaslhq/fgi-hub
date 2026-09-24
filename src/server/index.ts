import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchStockConsensusProd, fetchCryptoConsensusProd } from "../services/index.server.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/consensus/stock", async (_req, res) => {
	try {
		const result = await fetchStockConsensusProd();
		res.json(result);
	} catch {
		res.status(502).json({ error: "Failed to aggregate stock consensus" });
	}
});

app.get("/api/consensus/crypto", async (_req, res) => {
	try {
		const result = await fetchCryptoConsensusProd();
		res.json(result);
	} catch {
		res.status(502).json({ error: "Failed to aggregate crypto consensus" });
	}
});

app.get("/api/health", (_req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const distPath = path.join(__dirname, "..");
app.use(express.static(distPath));

app.get("/{*path}", (_req, res) => {
	res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
	console.error(`FGI Hub server running on port ${PORT}`);
});
