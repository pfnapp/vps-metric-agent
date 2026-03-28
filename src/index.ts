import { defaultPlugins } from "./plugins";
import { AgentConfig, MetricPlugin } from "./types";

function getConfig(): AgentConfig {
  const hostId = process.env.HOST_ID || process.env.HOSTNAME || "unknown-host";
  const ingestUrl = process.env.INGEST_URL;
  const token = process.env.AGENT_TOKEN;
  const dryRun = process.env.DRY_RUN === "1" || !ingestUrl;

  return { hostId, ingestUrl, token, dryRun };
}

async function sendMetric(config: AgentConfig, plugin: string, metrics: Record<string, unknown>) {
  if (config.dryRun) {
    console.log(`[dry-run] ${plugin}`, JSON.stringify(metrics));
    return;
  }

  const response = await fetch(config.ingestUrl!, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(config.token ? { authorization: `Bearer ${config.token}` } : {}),
    },
    body: JSON.stringify({
      host_id: config.hostId,
      plugin,
      metrics,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ingest failed ${response.status}: ${body}`);
  }
}

function schedulePlugin(plugin: MetricPlugin, config: AgentConfig) {
  const run = async () => {
    try {
      const metrics = await plugin.collect({ hostId: config.hostId, now: Date.now });
      await sendMetric(config, plugin.name, metrics);
      console.log(`[ok] ${plugin.name}`, new Date().toISOString());
    } catch (error) {
      console.error(`[err] ${plugin.name}`, error);
    }
  };

  run();
  setInterval(run, plugin.intervalSec * 1000);
}

function main() {
  const config = getConfig();

  console.log("vps-metric-agent starting", {
    hostId: config.hostId,
    ingestUrl: config.ingestUrl ?? "(not set)",
    dryRun: config.dryRun,
    plugins: defaultPlugins.map((p) => `${p.name}@${p.intervalSec}s`),
  });

  for (const plugin of defaultPlugins) {
    schedulePlugin(plugin, config);
  }
}

main();
