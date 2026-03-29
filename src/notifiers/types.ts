export interface AlertEvent {
  hostId: string;
  ruleId: string;
  severity: "info" | "warn" | "critical";
  state: "firing" | "recovered";
  metric: string;
  value: number;
  threshold: number;
  op: string;
  ts: number;
  message: string;
}
