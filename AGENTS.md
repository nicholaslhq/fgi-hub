# Agent Guide — FGI Hub

## Project Overview
FGI Hub is a Fear & Greed Index aggregator that combines sentiment data from multiple
providers across stock and crypto markets. It uses an **Adaptive Robust Aggregation (ARA)**
framework that dynamically selects the optimal aggregation strategy based on data quality.

## Commands

| Command               | Description                          |
|-----------------------|--------------------------------------|
| `npm run dev`         | Start Vite dev server                |
| `npm run build`       | Type-check + production build        |
| `npm run lint`        | Run oxlint                           |
| `npm test`            | Run unit tests (vitest)              |
| `npm run test:watch`  | Watch mode for tests                 |
| `npm run test:coverage` | Run tests with coverage report     |

## Architecture

```
src/
  services/
    aggregation.ts       # ARA framework — core consensus computation
    index.ts             # Data fetching orchestration
    providers/           # Per-provider fetchers (mock)
  hooks/
    useFearGreed.ts      # React state management with temporal smoothing
  types/
    index.ts             # Shared types (ConsensusResult, ProviderScore, etc.)
  utils/
    formatters.ts        # Display helpers
  components/            # React UI components
```

## ARA Framework Phases

1. **Validation & Weighting** — Filters errors/NaN/out-of-range, assigns
   reliability weight: `wᵢ = confidence × e^(−age/τ)`
2. **Outlier Detection** — MAD-based robust z-scores, threshold 3.5
3. **Multi-Strategy Estimation** — Computes weighted mean, median,
   trimmed mean, and Bayesian shrinkage in parallel
4. **Quality Assessment** — 6 signals: n, outlier ratio, robust CV,
   mean confidence, effective n, max age
5. **Strategy Selection** — Deterministic rules map quality signals →
   one of: `weighted_mean`, `median`, `trimmed_mean`, `bayesian_shrinkage`,
   `single_provider`, `fallback`
6. **Confidence & CI** — Composite confidence score (0–1) and 95% CI
   using robust or parametric standard error

## Key Design Principle
No hardcoded single "best" formula. The framework selects from a family
of estimators based on data characteristics, making it robust across
outliers, missing data, small samples, skewed distributions, and
temporal volatility.
