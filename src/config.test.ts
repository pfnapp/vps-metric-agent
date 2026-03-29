import { afterEach, describe, expect, it } from "bun:test";
import { loadConfig } from "./config";

const touchedEnv = [
  "AGENT_MODE",
  "HOST_ID",
  "STATE_FILE",
  "INGEST_URL",
  "DRY_RUN",
  "ALERT_COOLDOWN_SEC",
  "ALERT_SEND_RECOVERY",
  "TG_CHAT_ID",
  "TG_BOT_TOKEN_ENV",
  "DISCORD_WEBHOOK_URL_ENV",
] as const;

function clearTouchedEnv() {
  for (const key of touchedEnv) {
    delete process.env[key];
  }
}

afterEach(() => {
  clearTouchedEnv();
});

describe("config loader", () => {
  it("loads custom YAML file and env overrides", async () => {
    const path = `/tmp/vps-metric-agent-config-${Date.now()}.yaml`;
    await Bun.write(
      path,
      `agent:\n  mode: notify\nalerts:\n  cooldown_sec: 10\n  send_recovery: false\n  rules:\n    - metric: cpu_used_pct\n      op: \">\"\n      threshold: 75\noutputs:\n  ingest:\n    enabled: false\n  telegram:\n    enabled: true\n    chat_id: \"123\"\n`,
    );

    process.env.HOST_ID = "host-from-env";
    process.env.ALERT_COOLDOWN_SEC = "25";

    const cfg = await loadConfig({ configPath: path });
    expect(cfg.agent.mode).toBe("notify");
    expect(cfg.agent.host_id).toBe("host-from-env");
    expect(cfg.alerts.cooldown_sec).toBe(25);
    expect(cfg.outputs.telegram.enabled).toBeTrue();
    expect(cfg.outputs.telegram.chat_id).toBe("123");
    expect(cfg.outputs.ingest.enabled).toBeFalse();
  });

  it("supports DRY_RUN env to disable ingest", async () => {
    process.env.DRY_RUN = "1";
    const cfg = await loadConfig();
    expect(cfg.outputs.ingest.enabled).toBeFalse();
  });
});
