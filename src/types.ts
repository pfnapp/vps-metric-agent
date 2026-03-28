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

export interface AgentConfig {
  hostId: string;
  ingestUrl?: string;
  token?: string;
  dryRun: boolean;
}
