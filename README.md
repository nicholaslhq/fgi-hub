# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Development

### Data Acquisition Mode

The `FGI_DATA_MODE` environment variable controls whether the app uses simulated
(mock) data or fetches live data from external APIs:

- `mock` (default) — the footer shows "Uses mock data for initial development"
  and the client uses browser-side mock providers.
- `prod` — the footer shows "Using live production data from external APIs", the
  `/api/consensus/:market` proxy routes are registered, and the client fetches
  real consensus results from the server-side providers.

Run the dev server in the desired mode:

```powershell
# Mock mode (default — no env var required)
npm run dev

# Mock mode (explicit)
$env:FGI_DATA_MODE="mock"; npm run dev

# Production / live data mode
$env:FGI_DATA_MODE="prod"; npm run dev
```

> PowerShell keeps session environment variables for the lifetime of the shell, so
> every `npm run dev` you start in the same tab inherits the value. To switch
> modes, clear the variable (`$env:FGI_DATA_MODE=""`) and **restart** the dev
> server — the mode is baked into the bundle at server startup.
