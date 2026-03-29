import { homedir } from "node:os";
import { join } from "node:path";
import { evaluateAlerts } from "./alerts";
import { loadConfig } from "./config";
import { notifyAll } from "./notifiers";
import { defaultPlugins } from "./plugins";
import { loadState, saveState } from "./state";
import { AppConfig, MetricPlugin, MetricRecord } from "./types";

interface CliArgs {
  configPath?: string;
  printEffectiveConfig: boolean;
  testNotify: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    printEffectiveConfig: false,
    testNotify: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--config") {
      args.configPath = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--print-effective-config") {
      args.printEffectiveConfig = true;
      continue;
    }
    if (arg === "--test-notify") {
      args.testNotify = true;
      continue;
    }
  }

  return args;
}

function resolveHostId(cfg: AppConfig): string {
  if (cfg.agent.host_id && cfg.agent.host_id !== "auto") return cfg.agent.host_id;
  return process.env.HOST_ID || process.env.HOSTNAME || "unknown-host";
}

function defaultStatePath(): string {
  const userState = join(homedir(), ".local/state/vps-metric-agent/state.json");
  const systemState = "/var/lib/vps-metric-agent/state.json";
  const isRoot = typeof process.getuid === "function" ? process.getuid() === 0 : false;
  return isRoot ? systemState : userState;
}

function shouldPush(cfg: AppConfig): boolean {
  if (cfg.agent.mode === "notify") return false;
  return cfg.outputs.ingest.enabled;
}

function shouldNotify(cfg: AppConfig): boolean {
  if (cfg.agent.mode === "push") return false;
  return cfg.outputs.telegram.enabled || cfg.outputs.discord.enabled;
}

async function sendMetric(cfg: AppConfig, hostId: string, plugin: string, metrics: Record<string, unknown>) {
  const ingestUrl = cfg.outputs.ingest.url || "";
  if (!shouldPush(cfg) || !ingestUrl) {
    console.log(`[dry-run] ${plugin}`, JSON.stringify(metrics));
    return;
  }

  const tokenEnv = cfg.outputs.ingest.token_env || "AGENT_TOKEN";
  const token = process.env[tokenEnv] || "";

  const response = await fetch(ingestUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      host_id: hostId,
      plugin,
      metrics,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ingest failed ${response.status}: ${body}`);
  }
}

function effectiveIntervalSec(plugin: MetricPlugin, cfg: AppConfig): number {
  if (!cfg.collect.interval_sec || cfg.collect.interval_sec <= 0) return plugin.intervalSec;
  return cfg.collect.interval_sec;
}

function numericMetrics(metrics: MetricRecord): Record<string, unknown> {
  return metrics;
}

function schedulePlugin(plugin: MetricPlugin, cfg: AppConfig, hostId: string, statePath: string, state: Awaited<ReturnType<typeof loadState>>) {
  const run = async () => {
    try {
      const metrics = await plugin.collect({ hostId, now: Date.now });

      await sendMetric(cfg, hostId, plugin.name, numericMetrics(metrics));

      if (shouldNotify(cfg) && cfg.alerts.rules.length > 0) {
        const events = evaluateAlerts(
          hostId,
          cfg.alerts.rules,
          metrics,
          Date.now(),
          state,
          cfg.alerts.cooldown_sec,
          cfg.alerts.send_recovery,
        );

        for (const event of events) {
          await notifyAll(cfg, event);
        }

        await saveState(statePath, state);
      }

      console.log(`[ok] ${plugin.name}`, new Date().toISOString());
    } catch (error) {
      console.error(`[err] ${plugin.name}`, error);
    }
  };

  void run();
  setInterval(() => {
    void run();
  }, effectiveIntervalSec(plugin, cfg) * 1000);
}

async function runTestNotify(cfg: AppConfig, hostId: string): Promise<void> {
  if (!shouldNotify(cfg)) {
    console.log("[test-notify] notify mode is disabled by config");
    return;
  }

  await notifyAll(cfg, {
    hostId,
    ruleId: "test",
    severity: "info",
    state: "firing",
    metric: "self_test",
    value: 1,
    threshold: 0,
    op: ">",
    ts: Date.now(),
    message: "manual test notification",
  });

  console.log("[test-notify] done");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cfg = await loadConfig({ configPath: args.configPath });
  const hostId = resolveHostId(cfg);
  const statePath = cfg.agent.state_file || defaultStatePath();

  if (args.printEffectiveConfig) {
    console.log(JSON.stringify(cfg, null, 2));
    return;
  }

  if (args.testNotify) {
    await runTestNotify(cfg, hostId);
    return;
  }

  const state = await loadState(statePath);

  console.log("vps-metric-agent starting", {
    hostId,
    mode: cfg.agent.mode,
    ingestEnabled: cfg.outputs.ingest.enabled,
    ingestUrl: cfg.outputs.ingest.url ?? "(not set)",
    notify: {
      telegram: cfg.outputs.telegram.enabled,
      discord: cfg.outputs.discord.enabled,
    },
    statePath,
    plugins: defaultPlugins.map((p) => `${p.name}@${effectiveIntervalSec(p, cfg)}s`),
  });

  for (const plugin of defaultPlugins) {
    schedulePlugin(plugin, cfg, hostId, statePath, state);
  }
}

void main();
