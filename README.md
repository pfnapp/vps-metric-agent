# vps-metric-agent

Lightweight VPS metric agent built with Bun and plugin architecture.

## ✨ Highlights

- ⚡ Lightweight binary agent (Bun-compiled)
- 🧩 Plugin-based metrics (1 plugin = 1 concern)
- 📤 Push mode to your ingest API endpoint
- 🔔 Standalone notify mode (Telegram / Discord)
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

Raw script URL:
`https://raw.githubusercontent.com/pfnapp/vps-metric-agent/main/install.sh`

**Root required?**
- **No** for user install (`~/.local/bin`) ✅
- **Yes** only for system-wide install to `/usr/local/bin` (`--system`) ✅

---

## 2) Configuration

### Config sources & precedence

Lowest to highest priority:

1. Built-in defaults
2. `/etc/vps-metric-agent/config.yaml`
3. `~/.config/vps-metric-agent/config.yaml`
4. `--config /path/to/config.yaml`
5. Environment variable overrides

### Config file example

See full sample: `config/config.example.yaml`

### Main modes

- `push` → send metrics to ingest endpoint
- `notify` → only send alert notifications (standalone, no ingest)
- `hybrid` → both push + notify

### Env vars (common)

| Variable | Description |
|---|---|
| `HOST_ID` | Override host identifier |
| `INGEST_URL` | Override ingest URL |
| `AGENT_TOKEN` | Bearer token used by ingest output |
| `DRY_RUN=1` | Disable ingest output |
| `AGENT_MODE` | Override mode (`push`/`notify`/`hybrid`) |
| `STATE_FILE` | Custom alert state file path |
| `ALERT_COOLDOWN_SEC` | Override cooldown |
| `ALERT_SEND_RECOVERY` | Override recovery send (`true/false`) |
| `TG_BOT_TOKEN` | Telegram bot token |
| `TG_CHAT_ID` | Telegram chat target |
| `DISCORD_WEBHOOK_URL` | Discord webhook target |

---

## 3) Run

```bash
vps-metric-agent
```

From source:

```bash
bun run src/index.ts
```

Useful flags:

```bash
# print merged config and exit
vps-metric-agent --print-effective-config

# load explicit config file
vps-metric-agent --config /etc/vps-metric-agent/config.yaml

# send one test notification and exit
vps-metric-agent --test-notify
```

---

## 4) Current Metrics / Plugins

- `cpu.plugin.ts` → `cpu_used_pct`
- `memory.plugin.ts` → `mem_total_kb`, `mem_available_kb`, `mem_used_kb`, `mem_used_pct`
- `load.plugin.ts` → `load1`, `load5`, `load15`
- `io.plugin.ts` → `net_rx_bytes_total`, `net_tx_bytes_total`, `net_rx_bytes_per_sec`, `net_tx_bytes_per_sec`
- `storage.plugin.ts` → root storage usage (`storage_root_*`)
- `uptime.plugin.ts` → `uptime_sec`
- `process.plugin.ts` → `process_count`

Push payload format per plugin:

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

## 5) Contributing (for developers)

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
- config loader & env overrides
- alert evaluation (`for_sec`, cooldown, recovery)
- notifier fanout behavior
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
