# vps-metric-agent

Lightweight VPS metric agent built with Bun and plugin architecture.

## Features

- Plugin-based metric collection (`src/plugins/*`)
- 1 plugin = 1 metric domain (easy to read/maintain)
- Push-based delivery to custom ingest API (to be implemented later)
- Supports `dry-run` mode for local validation
- Can be compiled into standalone binary with Bun

## Current Plugins

- `cpu.plugin.ts` → `cpu_used_pct`
- `memory.plugin.ts` → `mem_total_kb`, `mem_available_kb`, `mem_used_kb`, `mem_used_pct`
- `load.plugin.ts` → `load1`, `load5`, `load15`
- `io.plugin.ts` → `net_rx_bytes_total`, `net_tx_bytes_total`, `net_rx_bytes_per_sec`, `net_tx_bytes_per_sec`
- `storage.plugin.ts` → root storage usage (`storage_root_*`)
- `uptime.plugin.ts` → `uptime_sec`
- `process.plugin.ts` → `process_count`

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `HOST_ID` | no | Host identifier sent in payload (fallback: `HOSTNAME`) |
| `INGEST_URL` | no | HTTP endpoint for metric ingest. If empty => dry-run |
| `AGENT_TOKEN` | no | Bearer token for ingest API |
| `DRY_RUN` | no | Force dry-run mode (`1` to enable) |

## Local Run

```bash
bun run src/index.ts
```

## Test

```bash
# run all tests
bun test

# CI-style (stop at first failure)
bun run test:ci
```

Test focus:
- parser correctness for each plugin
- malformed input fallback (no crash, sane defaults)
- plugin registry sanity (name + interval)

## Build Binary

```bash
# Linux x64
bun run build:linux-x64

# Linux arm64
bun run build:linux-arm64

# macOS arm64
bun run build:darwin-arm64

# Windows x64
bun run build:windows-x64
```

Output binaries are generated in `dist/`.

## Payload Format

The agent sends JSON payload per plugin:

```json
{
  "host_id": "vps-01",
  "plugin": "cpu",
  "metrics": {
    "cpu_used_pct": 27.3,
    "ts": 1760000000000
  }
}
```

## GitHub Actions

This repository includes CI workflow to build binaries for:

- linux-x64
- linux-arm64
- darwin-arm64
- windows-x64

Artifacts are uploaded from each workflow run.

## Notes

- Ingest API implementation intentionally deferred for next phase.
- Plugin layout now split by concern for readability and easier extension.
