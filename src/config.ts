import { homedir } from "node:os";
import { join } from "node:path";
import { AppConfig } from "./types";

export const DEFAULT_CONFIG: AppConfig = {
  agent: {
    mode: "push",
    host_id: "auto",
    state_file: undefined,
  },
  collect: {
    interval_sec: undefined,
  },
  alerts: {
    cooldown_sec: 300,
    send_recovery: true,
    rules: [],
  },
  outputs: {
    ingest: {
      enabled: true,
      url: "",
      token_env: "AGENT_TOKEN",
    },
    telegram: {
      enabled: false,
      bot_token_env: "TG_BOT_TOKEN",
      chat_id: "",
    },
    discord: {
      enabled: false,
      webhook_url_env: "DISCORD_WEBHOOK_URL",
    },
  },
};

type AnyRecord = Record<string, unknown>;

function isObject(value: unknown): value is AnyRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function deepMerge<T extends AnyRecord>(base: T, override: unknown): T {
  if (!isObject(override)) return base;
  const out: AnyRecord = { ...base };

  for (const [k, v] of Object.entries(override)) {
    const existing = out[k];
    if (isObject(existing) && isObject(v)) {
      out[k] = deepMerge(existing, v);
    } else {
      out[k] = v;
    }
  }

  return out as T;
}

async function readYamlIfExists(path: string): Promise<AnyRecord> {
  const file = Bun.file(path);
  if (!(await file.exists())) return {};

  const text = await file.text();
  if (!text.trim()) return {};

  const parsed = Bun.YAML.parse(text);
  if (!isObject(parsed)) {
    throw new Error(`Config file must contain a YAML object: ${path}`);
  }
  return parsed;
}

function parseBool(input: string | undefined): boolean | undefined {
  if (input === undefined) return undefined;
  const normalized = input.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return undefined;
}

export function applyEnvOverrides(input: AppConfig): AppConfig {
  const cfg = structuredClone(input);

  if (process.env.HOST_ID) cfg.agent.host_id = process.env.HOST_ID;
  if (process.env.AGENT_MODE) cfg.agent.mode = process.env.AGENT_MODE as AppConfig["agent"]["mode"];
  if (process.env.STATE_FILE) cfg.agent.state_file = process.env.STATE_FILE;

  if (process.env.INGEST_URL) cfg.outputs.ingest.url = process.env.INGEST_URL;
  if (process.env.AGENT_TOKEN_ENV) cfg.outputs.ingest.token_env = process.env.AGENT_TOKEN_ENV;

  const dryRun = parseBool(process.env.DRY_RUN);
  if (dryRun === true) cfg.outputs.ingest.enabled = false;

  const cooldown = process.env.ALERT_COOLDOWN_SEC ? Number(process.env.ALERT_COOLDOWN_SEC) : undefined;
  if (Number.isFinite(cooldown)) cfg.alerts.cooldown_sec = Number(cooldown);

  const sendRecovery = parseBool(process.env.ALERT_SEND_RECOVERY);
  if (sendRecovery !== undefined) cfg.alerts.send_recovery = sendRecovery;

  if (process.env.TG_CHAT_ID) cfg.outputs.telegram.chat_id = process.env.TG_CHAT_ID;
  if (process.env.TG_BOT_TOKEN_ENV) cfg.outputs.telegram.bot_token_env = process.env.TG_BOT_TOKEN_ENV;

  if (process.env.DISCORD_WEBHOOK_URL_ENV) cfg.outputs.discord.webhook_url_env = process.env.DISCORD_WEBHOOK_URL_ENV;

  return cfg;
}

export function validateConfig(cfg: AppConfig): void {
  if (!["push", "notify", "hybrid"].includes(cfg.agent.mode)) {
    throw new Error(`Invalid agent.mode: ${cfg.agent.mode}`);
  }

  if (!Array.isArray(cfg.alerts.rules)) {
    throw new Error("alerts.rules must be an array");
  }

  if (!Number.isFinite(cfg.alerts.cooldown_sec) || cfg.alerts.cooldown_sec < 0) {
    throw new Error("alerts.cooldown_sec must be >= 0");
  }

  for (const [idx, rule] of cfg.alerts.rules.entries()) {
    if (!rule.metric || !rule.op || !Number.isFinite(rule.threshold)) {
      throw new Error(`alerts.rules[${idx}] is invalid`);
    }
  }
}

export interface LoadConfigOptions {
  configPath?: string;
}

export async function loadConfig(options: LoadConfigOptions = {}): Promise<AppConfig> {
  const systemPath = "/etc/vps-metric-agent/config.yaml";
  const userPath = join(homedir(), ".config/vps-metric-agent/config.yaml");

  let cfg = structuredClone(DEFAULT_CONFIG);
  cfg = deepMerge(cfg, await readYamlIfExists(systemPath));
  cfg = deepMerge(cfg, await readYamlIfExists(userPath));

  if (options.configPath) {
    cfg = deepMerge(cfg, await readYamlIfExists(options.configPath));
  }

  cfg = applyEnvOverrides(cfg);
  validateConfig(cfg);
  return cfg;
}
