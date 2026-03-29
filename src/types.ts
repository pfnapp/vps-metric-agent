export type MetricValue = number | string | boolean | null;

export type MetricRecord = Record<string, MetricValue>;

export interface PluginContext {
  hostId: string;
  now: () => number;
}

export interface MetricPlugin {
  name: string;
  intervalSec: number;
  collect: (ctx: PluginContext) => Promise<MetricRecord>;
}

// Legacy push config (kept for backward compatibility)
export interface AgentConfig {
  hostId: string;
  ingestUrl?: string;
  token?: string;
  dryRun: boolean;
}

export type AgentMode = "push" | "notify" | "hybrid";
export type Severity = "info" | "warn" | "critical";
export type AlertOp = ">" | ">=" | "<" | "<=" | "==" | "!=";

export interface AlertRule {
  id?: string;
  metric: string;
  op: AlertOp;
  threshold: number;
  for_sec?: number;
  severity?: Severity;
  message?: string;
}

export interface IngestOutputConfig {
  enabled: boolean;
  url?: string;
  token_env?: string;
}

export interface TelegramOutputConfig {
  enabled: boolean;
  bot_token_env?: string;
  chat_id?: string;
}

export interface DiscordOutputConfig {
  enabled: boolean;
  webhook_url_env?: string;
}

export interface AppConfig {
  agent: {
    mode: AgentMode;
    host_id?: string;
    state_file?: string;
  };
  collect: {
    interval_sec?: number;
  };
  alerts: {
    cooldown_sec: number;
    send_recovery: boolean;
    rules: AlertRule[];
  };
  outputs: {
    ingest: IngestOutputConfig;
    telegram: TelegramOutputConfig;
    discord: DiscordOutputConfig;
  };
}
