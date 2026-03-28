# vps-metric-agent

Lightweight VPS metric agent built with Bun and plugin architecture.

## Features

- Plugin-based metric collection (`src/plugins/*`)
- Very small runtime footprint
- Push-based delivery to custom ingest API (to be implemented later)
- Supports `dry-run` mode for local validation
- Can be compiled into a standalone binary with Bun

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

The agent sends this JSON payload to ingest API:

```json
{
  "host_id": "vps-01",
  "plugin": "system",
  "metrics": {
    "cpu_used_pct": 27.3,
    "mem_used_pct": 61.2,
    "load1": 0.45,
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
- Current plugins: `system`, `disk`.
