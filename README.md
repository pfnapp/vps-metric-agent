# vps-metric-agent

Lightweight VPS metric agent built with Bun and plugin architecture.

## ✨ Highlights

- ⚡ Lightweight binary agent (Bun-compiled)
- 🧩 Plugin-based metrics (1 plugin = 1 concern)
- 📤 Push model to your ingest API endpoint
- 🧪 Strong test baseline (unit + integration + golden fixtures)
- 🏗️ CI builds multi-platform binaries (Linux/macOS/Windows)

---

## 1) Install & Use (for users)

### Install from Release Binary

Simple one-liner via `curl` (direct from this repo raw):

```bash
# user install (recommended, no root)
curl -fsSL https://raw.githubusercontent.com/pfnapp/vps-metric-agent/main/install.sh | bash -s -- --user

# system install (/usr/local/bin, needs sudo/root)
curl -fsSL https://raw.githubusercontent.com/pfnapp/vps-metric-agent/main/install.sh | bash -s -- --system

# install specific version
curl -fsSL https://raw.githubusercontent.com/pfnapp/vps-metric-agent/main/install.sh | bash -s -- --version v0.2.0 --user

# overwrite existing binary
curl -fsSL https://raw.githubusercontent.com/pfnapp/vps-metric-agent/main/install.sh | bash -s -- --user --force
```

Default behavior is safe: if binary already exists, installer stops with error.
Use `--force` only when you intentionally want to replace it.

Raw script URL:
`https://raw.githubusercontent.com/pfnapp/vps-metric-agent/main/install.sh`

**Root required?**
- **No** for user install (`~/.local/bin`) ✅
- **Yes** only for system-wide install to `/usr/local/bin` (`--system`) ✅

---

### Configure

Environment variables:

| Variable | Required | Description |
|---|---|---|
| `HOST_ID` | no | Host identifier sent in payload (fallback: `HOSTNAME`) |
| `INGEST_URL` | no | HTTP endpoint for metric ingest. If empty => dry-run |
| `AGENT_TOKEN` | no | Bearer token for ingest API |
| `DRY_RUN` | no | Force dry-run mode (`1` to enable) |

---

### Run

```bash
vps-metric-agent
```

Or from source:

```bash
bun run src/index.ts
```

---

### Current Metrics / Plugins

- `cpu.plugin.ts` → `cpu_used_pct`
- `memory.plugin.ts` → `mem_total_kb`, `mem_available_kb`, `mem_used_kb`, `mem_used_pct`
- `load.plugin.ts` → `load1`, `load5`, `load15`
- `io.plugin.ts` → `net_rx_bytes_total`, `net_tx_bytes_total`, `net_rx_bytes_per_sec`, `net_tx_bytes_per_sec`
- `storage.plugin.ts` → root storage usage (`storage_root_*`)
- `uptime.plugin.ts` → `uptime_sec`
- `process.plugin.ts` → `process_count`

Payload format per plugin:

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

---

## 2) Contributing (for developers)

### Local Development

```bash
bun run src/index.ts
```

### Tests

```bash
# run all tests
bun test

# CI style (stop at first failure)
bun run test:ci
```

Test scope:
- parser correctness per plugin
- malformed input fallback (no crash)
- plugin registry sanity
- collect() integration with mocked runtime
- golden `/proc` fixtures regression (`test/fixtures/proc/`)

### Build Binary

```bash
bun run build:linux-x64
bun run build:linux-arm64
bun run build:darwin-arm64
bun run build:windows-x64
```

Output binaries are in `dist/`.

### CI / Release Notes

- GitHub Actions builds binaries for linux-x64, linux-arm64, darwin-arm64, windows-x64
- Release automation uses Release Please workflow
- If `RELEASE_PLEASE_TOKEN` is not configured, release workflow is skipped (non-failing)
- Branch protection on `main` requires passing `test` check
