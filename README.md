# FGI Hub

FGI Hub is a responsive market-sentiment dashboard that aggregates Fear & Greed sentiment signals for stock and cryptocurrency markets. It combines multiple providers through the Adaptive Robust Aggregation (ARA) framework, then presents the resulting consensus, uncertainty, provider health, and market comparison in a responsive interface.

The dashboard is designed for market monitoring and education. Its outputs are informational and are **not financial advice**.

## Features

- Separate consensus scores for stock and crypto markets
- Confidence-weighted cross-market sentiment overview
- Adaptive Robust Aggregation with six processing phases
- Reliability weighting based on provider confidence and data age
- MAD-based outlier detection and robust strategy selection
- Bayesian shrinkage for small samples
- Composite confidence scores and model-derived 95% confidence intervals
- Temporal smoothing when a previous score is available
- Live and simulated data acquisition modes
- Provider-level status, freshness, confidence, weight, and outlier diagnostics
- Sortable and filterable provider breakdown
- Responsive light and dark themes with system-theme support
- Overview, Markets, Methodology, About, Terms, Disclaimer, and Data Sources views
- Express API and static-server source (requires fixes before production deployment)

## Technology Stack

| Area                 | Current dependency             |
| -------------------- | ------------------------------ |
| UI                   | React 19.2.8 with TypeScript   |
| Build and dev server | Vite 8.2.2                     |
| Styling              | Tailwind CSS 4.3.3             |
| Server               | Express 5.2.1                  |
| Testing              | Vitest 4.1.11 with V8 coverage |
| Linting              | Oxlint 1.79.0                  |
| TypeScript           | 6.0.2                          |

The React Compiler is not enabled.

## Score Scale

All provider values are normalized to an integer score from 0 to 100.

|  Score | Label         | Interpretation                    |
| -----: | ------------- | --------------------------------- |
|   0–20 | Extreme Fear  | Very pessimistic market sentiment |
|  21–40 | Fear          | Pessimistic market sentiment      |
|  41–60 | Neutral       | Balanced market sentiment         |
|  61–80 | Greed         | Optimistic market sentiment       |
| 81–100 | Extreme Greed | Very optimistic market sentiment  |

A lower score indicates fear, while a higher score indicates greed. The score should be interpreted alongside confidence, the confidence interval, provider divergence, and data freshness.

## Data Acquisition Modes

`FGI_DATA_MODE` selects the client data path when Vite starts. The value is compiled into the browser bundle, so the development server or production build must be restarted after changing it.

| Mode             | Client behavior                                                                          | Data source                                                             |
| ---------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `mock` (default) | Probes the API and falls back to browser-side simulated providers when it is unavailable | Simulated sentiment, stale records, fixed outliers, and provider errors |
| `prod`           | Calls `/api/consensus/stock` and `/api/consensus/crypto`                                 | Server-side providers that fetch external APIs and public web pages     |

Mock data is useful for UI development and ARA stress testing. It is not a representation of current market conditions.

### Start in mock mode

PowerShell:

```powershell
$env:FGI_DATA_MODE = "mock"
npm run dev
```

Linux or macOS:

```bash
FGI_DATA_MODE=mock npm run dev
```

### Start in production-data development mode

PowerShell:

```powershell
$env:FGI_DATA_MODE = "prod"
npm run dev
```

Linux or macOS:

```bash
FGI_DATA_MODE=prod npm run dev
```

The Vite development server registers the consensus and health endpoints when the mode is `prod`. In `mock` mode, the browser hook first probes those endpoints and then uses the local mock providers if no API is available.

PowerShell retains environment variables for the lifetime of the shell. Clear `FGI_DATA_MODE` and restart Vite before switching modes.

## Quick Start

### Prerequisites

- A current Node.js LTS release
- npm

### Install dependencies

```powershell
npm install
```

### Run the development server

```powershell
npm run dev
```

Vite serves the client at `http://localhost:5173` by default.

On first load, the application requests both market consensus results. Use the refresh control to fetch a new provider set. The UI displays loading, error, and empty states and retains the last successful result while a refresh is in progress.

## Production Server

The production setup is intended to consist of a compiled Vite client and an Express server. The standalone server source defines the consensus API, static asset serving, and an SPA fallback, but the current dependency/build setup is not production-ready.

Current deployment status:

- `npm run build` completes successfully and creates the Vite client in `dist/`.
- `npm run build:server` fails under TypeScript 6.0.2 with `TS5112` because it passes a source file on the command line while `tsconfig.json` is present.
- An explicit compile with `--ignoreConfig` succeeds, but `npm start` then fails during Express route registration. Express 5/path-to-regexp rejects the source's `app.get("*")` fallback with `Missing parameter name at index 1`.
- After the wildcard route is corrected, the server's static path also needs adjustment: with the entry point at `dist/server/index.js`, the current `path.join(__dirname, "..", "dist")` resolves to `dist/dist` rather than the Vite `dist/` directory.

For now, use production-data Vite mode for local live-data development:

```powershell
$env:FGI_DATA_MODE = "prod"
npm run dev
```

```bash
FGI_DATA_MODE=prod npm run dev
```

The Vite middleware exposes the same consensus endpoints without the standalone server's wildcard route. Treat `npm start` as blocked until the Express fallback and static-path issues are fixed.

The source watcher can be invoked across platforms, but it reaches the same Express wildcard-route startup failure and is not a working standalone-server workaround:

```powershell
$env:FGI_DATA_MODE = "prod"
npx tsx --watch src/server/index.ts
```

```bash
FGI_DATA_MODE=prod npx tsx --watch src/server/index.ts
```

The packaged `dev:server` script uses POSIX environment syntax and is intended primarily for Linux and macOS shells.

## Application Views

### Overview

The Overview tab combines stock and crypto sentiment into a confidence-weighted cross-market assessment. It includes:

- A narrative description of market alignment or divergence
- Side-by-side stock and crypto scores on the sentiment spectrum
- A provider consensus card for each market
- Selected ARA strategy, confidence, and 95% confidence interval
- Active, stale, and failed provider totals
- The most recent successful refresh time
- Expandable provider details

### Markets

The Markets tab provides a deeper statistical decomposition for each market:

- Consensus, selected strategy, confidence, and confidence interval
- Raw median and standard deviation
- Score range, range delta, variance, and interquartile range
- Agreement index and MAD-based outlier ratio
- Sentiment-label distribution
- Automatically generated market insights
- Provider table with score, deviation, weight, confidence, and freshness
- Sorting by score, deviation, weight, confidence, freshness, or name
- Active, stale, and error status filters
- Outlier badges and source links where available

### Methodology

The in-application Methodology view explains the score scale, freshness model, ARA phases, strategy rules, uncertainty calculations, temporal smoothing, cross-market synthesis, and metrics dictionary. [`METHODOLOGY.md`](./METHODOLOGY.md) contains a longer ARA design reference, but some of its constants predate the current implementation; `src/services/aggregation.ts` is authoritative for current behavior.

### Information Views

The footer and mobile navigation provide access to About, Terms of Service, Disclaimer, and Data Sources views. The disclaimer states that FGI Hub is for informational and educational purposes only.

## Architecture

```text
React UI
  ├─ useFearGreed state and refresh orchestration
  ├─ Overview and cross-market synthesis
  ├─ Markets and provider diagnostics
  └─ Methodology and information views
          │
          ▼
Data acquisition layer
  ├─ Browser mock providers (mock mode)
  └─ Express consensus API (prod mode)
          │
          ▼
Server provider adapters
  ├─ Stock provider fetchers
  └─ Crypto provider fetchers
          │
          ▼
Adaptive Robust Aggregation
  ├─ Validation and reliability weighting
  ├─ MAD outlier detection
  ├─ Candidate estimator computation
  ├─ Quality assessment
  ├─ Strategy selection
  └─ Confidence, interval, and smoothing
          │
          ▼
ConsensusResult returned to the UI
```

The main implementation areas are:

- `src/hooks/useFearGreed.ts` — client state, API selection, refreshes, and previous-score handling
- `src/services/index.ts` — mock-market orchestration
- `src/services/index.server.ts` — live-provider orchestration
- `src/services/aggregation.ts` — ARA framework
- `src/services/providers/` — browser mock and server-side provider adapters
- `src/server/index.ts` — Express API and static server
- `src/components/` — dashboard views and reusable UI
- `src/types/index.ts` — shared provider, consensus, and strategy contracts

## Live Data Providers

Each market currently uses five server-side sources. Provider requests run concurrently and are isolated with `Promise.allSettled`, so one failed source does not prevent the remaining sources from contributing. Each external request has a 10-second timeout.

| Market | Provider            | Acquisition method  |
| ------ | ------------------- | ------------------- |
| Stock  | CNN Fear & Greed    | JSON API            |
| Stock  | CBOE Put/Call Ratio | Public HTML parsing |
| Stock  | FearGreedChart      | JSON API            |
| Stock  | FearGreedMeter      | Public HTML parsing |
| Stock  | CFGI                | Public HTML parsing |
| Crypto | Alternative.me      | JSON API            |
| Crypto | CoinMarketCap       | Public HTML parsing |
| Crypto | FearGreedChart      | JSON API            |
| Crypto | FearGreedMeter      | Public HTML parsing |
| Crypto | CFGI                | Public HTML parsing |

HTML-based adapters depend on the current public page structure. A provider can return an error record when a request times out, an endpoint is unavailable, or the expected data cannot be parsed.

Provider names, acquisition methods, source metadata, retrieval time, and freshness metadata are retained in `ProviderScore` where the source supplies them.

## Adaptive Robust Aggregation

ARA replaces a fixed arithmetic mean with a deterministic estimator selected from a family of statistical methods. The implementation is in `src/services/aggregation.ts`.

### 1. Validation and Reliability Weighting

A provider is excluded from computation when it has an error, a non-numeric or out-of-range score, an invalid timestamp, or a future timestamp. Error records remain in the returned provider list so the UI can report failures transparently.

For each valid provider, ARA computes:

```text
weightᵢ = confidenceᵢ
          × exp(-ageᵢ / τᵣ)
          × exp(-max(0, ageᵢ - W) / τₛ)
```

Current constants are:

| Constant                      |     Value | Purpose                                         |
| ----------------------------- | --------: | ----------------------------------------------- |
| Default confidence            |     `0.5` | Used when a provider omits confidence           |
| Recency decay constant `τᵣ`   | `120 min` | Gradually reduces influence as data ages        |
| Freshness window `W`          | `240 min` | Point after which an additional penalty applies |
| Staleness decay constant `τₛ` |  `60 min` | Accelerates decay after the freshness window    |

Unlike a hard age cutoff, this model continues to reduce the influence of old valid observations. The UI uses a separate one-hour threshold to label a provider as stale and a 24-hour threshold to label displayed data as outdated; those labels do not remove a record from aggregation.

### 2. Outlier Detection

ARA calculates the median and Median Absolute Deviation (MAD), then computes a modified robust z-score:

```text
modified_z = 0.6745 × |score - median| / MAD
```

A provider is flagged when its modified z-score is greater than `3.5`. When MAD is zero, no values are flagged because all deviations from the median are zero.

### 3. Candidate Estimators

ARA computes four candidate estimates:

| Estimator                 | Behavior                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| Reliability-weighted mean | Uses normalized provider reliability weights                                                     |
| Median                    | Uses the robust center of provider scores                                                        |
| Trimmed mean              | Removes flagged outliers, trims 20% from each tail when possible, and recomputes a weighted mean |
| Bayesian shrinkage        | Shrinks the weighted mean toward the neutral prior of 50 using three pseudo-observations         |

### 4. Quality Assessment

The framework evaluates six signals:

- Valid provider count
- Outlier ratio
- Robust coefficient of variation (`MAD / |median|`)
- Mean provider confidence
- Kish effective sample size
- Maximum provider age

The effective sample size decreases when reliability weights are concentrated in only a few providers.

### 5. Strategy Selection

Strategy selection is deterministic:

| Data condition                               | Selected strategy                          |
| -------------------------------------------- | ------------------------------------------ |
| No valid providers                           | No consensus; the service returns an error |
| One valid provider                           | `single_provider`                          |
| Two valid providers                          | `bayesian_shrinkage`                       |
| Outlier ratio ≥ 40%                          | `median`                                   |
| Outliers present and robust CV > 0.25        | `median`                                   |
| Outliers present and robust CV ≤ 0.25        | `trimmed_mean`                             |
| No outliers, robust CV > 0.25                | `median`                                   |
| No outliers, robust CV > 0.20                | `trimmed_mean`                             |
| No outliers, `n ≥ 7`, mean confidence < 0.60 | `trimmed_mean`                             |
| Otherwise                                    | `weighted_mean`                            |

The selected strategy and diagnostic values are included in every `ConsensusResult`.

### 6. Confidence and Uncertainty

The confidence score is a value from 0 to 1. It combines:

- Confidence-interval width: 60%
- Mean provider confidence: 25%
- Data-quality composite: 15%

The UI uses 70% and 45% as its high/moderate confidence color thresholds; the in-application methodology describes confidence above 70% as high, 45–70% as moderate, and below 45% as low.

The reported 95% interval uses a MAD-derived standard error when robust dispersion is available. Otherwise, it uses a reliability-weighted standard error and Kish effective sample size. Intervals are clamped to the valid 0–100 score range.

### Temporal Smoothing

When a previous market score is supplied, ARA blends it with the new raw score:

```text
α = clamp(0.3 + 0.5 × confidence, 0.3, 0.8)
smoothed = α × raw + (1 - α) × previous
```

Low-confidence updates retain more of the previous score; high-confidence updates respond more strongly. The stateless HTTP API currently creates each consensus independently, so smoothing is applied only where orchestration passes a previous score.

### Cross-Market Synthesis

The Overview tab combines stock and crypto using their ARA confidence values as relative weights. Because the synthesis has only two inputs, it applies Bayesian regularization toward neutral with four pseudo-observations. The result is an interpretive cross-market score and narrative, while the individual market results remain available separately.

## API

The server source defines these endpoints, and the `prod` Vite middleware exposes them during development. The standalone Express server is currently blocked at startup by the issues described in [Production Server](#production-server).

| Method | Endpoint                | Response                           |
| ------ | ----------------------- | ---------------------------------- |
| `GET`  | `/api/health`           | Server health status and timestamp |
| `GET`  | `/api/consensus/stock`  | Aggregated stock consensus         |
| `GET`  | `/api/consensus/crypto` | Aggregated crypto consensus        |

A consensus response has this shape:

```json
{
	"market": "stock",
	"score": 52,
	"label": "Neutral",
	"providerCount": 5,
	"lastUpdated": "2026-09-22T10:00:00.000Z",
	"providers": [],
	"confidence": 0.72,
	"ciLower": 45,
	"ciUpper": 59,
	"strategy": "weighted_mean",
	"details": {
		"n": 5,
		"outlierCount": 0,
		"median": 52,
		"weightedMean": 52,
		"trimmedMean": 52,
		"mad": 4,
		"robustCV": 0.077,
		"effectiveN": 4.8,
		"meanProviderConfidence": 0.84,
		"maxAgeMinutes": 12.5,
		"strategy": "weighted_mean",
		"score": 52,
		"confidence": 0.72,
		"ciLower": 45,
		"ciUpper": 59
	}
}
```

`providerCount` is the number of valid providers used in aggregation. The `providers` array can be larger because failed records are retained for transparency. If no valid provider remains for a market, the server returns HTTP `502` and the client displays its error state with a retry action.

## Configuration

FGI Hub reads runtime configuration from the process environment. Set these variables in the shell before starting Vite or Node; the project does not currently load `.env` values through a dotenv package.

| Variable        | Default | Applies to     | Description                                                                    |
| --------------- | ------: | -------------- | ------------------------------------------------------------------------------ |
| `FGI_DATA_MODE` |  `mock` | Vite client    | Selects mock fallback or live API data and is compiled into the browser bundle |
| `PORT`          |  `3001` | Express server | TCP port for the production server                                             |
| `FGI_CACHE_TTL` |    `60` | Reserved       | Documented cache TTL in `.env.example`; no caching layer currently consumes it |

`.env.example` is a configuration reference. For the current implementation, shell environment variables are the reliable way to configure Vite and the standalone server.

## Commands

| Command                 | Description                                                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`           | Start the Vite development server                                                                                                       |
| `npm run dev:server`    | Watch the Express server using POSIX environment syntax                                                                                 |
| `npm run build`         | Type-check and create the production Vite bundle                                                                                        |
| `npm run build:server`  | Intended server build; currently fails with TypeScript 6.0.2 (`TS5112`), so use the explicit `npx tsc ... --ignoreConfig` command above |
| `npm start`             | Run the compiled Express server                                                                                                         |
| `npm run preview`       | Preview the compiled client without API routes                                                                                          |
| `npm run lint`          | Run Oxlint                                                                                                                              |
| `npm test`              | Run the Vitest suite once                                                                                                               |
| `npm run test:watch`    | Run Vitest in watch mode                                                                                                                |
| `npm run test:coverage` | Run Vitest with V8 coverage reporting                                                                                                   |

## Testing and Quality Checks

The automated tests cover aggregation utilities, strategy selection, confidence calculation, temporal smoothing, invalid providers, small samples, outliers, stale data, confidence intervals, deterministic output, and stress scenarios. Utility tests also cover provider status counts and timestamp handling.

Run the standard checks before submitting a change:

```powershell
npm test
npm run lint
npm run build
```

Vitest is configured for a Node environment and discovers `src/**/*.test.ts`. Coverage is limited to `src/services/aggregation.ts` and emits text and LCOV reports.

## Project Structure

```text
.
├── public/                    Static icons and favicon
├── src/
│   ├── components/            Dashboard views and reusable UI
│   ├── hooks/                 Theme, refresh, time, and sizing state
│   ├── services/
│   │   ├── providers/         Mock and live provider adapters
│   │   ├── aggregation.ts     ARA implementation
│   │   ├── index.ts           Mock orchestration
│   │   └── index.server.ts    Live orchestration
│   ├── server/                Express API and static server
│   ├── types/                 Shared TypeScript contracts
│   ├── utils/                 Formatting, time, status, and error helpers
│   ├── App.tsx                Application composition and cross-market view
│   ├── index.css              Tailwind theme and custom visual system
│   └── main.tsx               React entry point
├── METHODOLOGY.md             Detailed ARA reference
├── vite.config.ts             Vite, Tailwind, tests, and API middleware
├── package.json               Scripts and dependencies
└── .env.example               Environment variable reference
```

## Operational Notes

- Live providers are external services and can change their schemas, rate limits, availability, or terms without notice.
- HTML parsing is more fragile than a versioned API and may require maintenance when a source changes its markup.
- Mock mode intentionally includes random scores and failure scenarios; repeated refreshes are expected to produce different values.
- A confidence score describes the internal quality of the available sample. It does not guarantee future market behavior.
- A confidence interval describes model uncertainty under the current sample assumptions; it is not a prediction range for future prices.
- The dashboard does not currently implement response caching, authentication, or API-key management.
- Review the in-application Disclaimer and the terms and policies of every third-party data source before production use.
