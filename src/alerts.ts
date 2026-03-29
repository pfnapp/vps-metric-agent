import { AlertEvent } from "./notifiers/types";
import { AlertRule } from "./types";

export interface RuleState {
  first_seen_ts?: number;
  firing?: boolean;
  last_sent_ts?: number;
}

export type AlertStateStore = Record<string, RuleState>;

function evaluateOp(value: number, op: AlertRule["op"], threshold: number): boolean {
  switch (op) {
    case ">":
      return value > threshold;
    case ">=":
      return value >= threshold;
    case "<":
      return value < threshold;
    case "<=":
      return value <= threshold;
    case "==":
      return value === threshold;
    case "!=":
      return value !== threshold;
    default:
      return false;
  }
}

function getRuleId(rule: AlertRule, idx: number): string {
  return rule.id || `${rule.metric}:${rule.op}:${rule.threshold}:${idx}`;
}

function renderMessage(template: string | undefined, params: Record<string, string | number>): string {
  if (!template) {
    return `${params.metric} ${params.op} ${params.threshold} (value=${params.value})`;
  }

  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_whole, key: string) => String(params[key] ?? ""));
}

export function evaluateAlerts(
  hostId: string,
  rules: AlertRule[],
  metrics: Record<string, unknown>,
  now: number,
  state: AlertStateStore,
  cooldownSec: number,
  sendRecovery: boolean,
): AlertEvent[] {
  const events: AlertEvent[] = [];

  for (const [idx, rule] of rules.entries()) {
    const ruleId = getRuleId(rule, idx);
    const current = state[ruleId] || {};

    const raw = metrics[rule.metric];
    const value = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(value)) {
      continue;
    }

    const isMatch = evaluateOp(value, rule.op, rule.threshold);
    const forMs = Math.max(0, (rule.for_sec || 0) * 1000);
    const cooldownMs = Math.max(0, cooldownSec * 1000);

    if (isMatch) {
      if (!current.first_seen_ts) current.first_seen_ts = now;

      const duration = now - current.first_seen_ts;
      const qualified = duration >= forMs;
      const cooldownPassed = !current.last_sent_ts || now - current.last_sent_ts >= cooldownMs;

      if (qualified && cooldownPassed) {
        const event: AlertEvent = {
          hostId,
          ruleId,
          severity: rule.severity || "warn",
          state: "firing",
          metric: rule.metric,
          value,
          threshold: rule.threshold,
          op: rule.op,
          ts: now,
          message: renderMessage(rule.message, {
            metric: rule.metric,
            value,
            threshold: rule.threshold,
            op: rule.op,
          }),
        };
        events.push(event);
        current.firing = true;
        current.last_sent_ts = now;
      }
    } else {
      if (current.firing && sendRecovery) {
        const event: AlertEvent = {
          hostId,
          ruleId,
          severity: rule.severity || "info",
          state: "recovered",
          metric: rule.metric,
          value,
          threshold: rule.threshold,
          op: rule.op,
          ts: now,
          message: `${rule.metric} recovered (value=${value})`,
        };
        events.push(event);
      }

      current.first_seen_ts = undefined;
      current.firing = false;
    }

    state[ruleId] = current;
  }

  return events;
}
