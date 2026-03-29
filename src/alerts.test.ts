import { describe, expect, it } from "bun:test";
import { evaluateAlerts, type AlertStateStore } from "./alerts";

describe("alerts evaluator", () => {
  it("respects for_sec before firing", () => {
    const state: AlertStateStore = {};
    const rules = [{ metric: "cpu_used_pct", op: ">" as const, threshold: 75, for_sec: 60, severity: "warn" as const }];

    const t0 = 1_700_000_000_000;
    const e1 = evaluateAlerts("h1", rules, { cpu_used_pct: 80 }, t0, state, 300, true);
    expect(e1.length).toBe(0);

    const e2 = evaluateAlerts("h1", rules, { cpu_used_pct: 81 }, t0 + 59_000, state, 300, true);
    expect(e2.length).toBe(0);

    const e3 = evaluateAlerts("h1", rules, { cpu_used_pct: 82 }, t0 + 60_000, state, 300, true);
    expect(e3.length).toBe(1);
    expect(e3[0]?.state).toBe("firing");
  });

  it("respects cooldown and emits recovery", () => {
    const state: AlertStateStore = {};
    const rules = [{ metric: "mem_used_pct", op: ">" as const, threshold: 90, for_sec: 0, severity: "critical" as const }];

    const t0 = 1_700_000_000_000;
    const e1 = evaluateAlerts("h1", rules, { mem_used_pct: 91 }, t0, state, 120, true);
    expect(e1.length).toBe(1);
    expect(e1[0]?.state).toBe("firing");

    const e2 = evaluateAlerts("h1", rules, { mem_used_pct: 92 }, t0 + 30_000, state, 120, true);
    expect(e2.length).toBe(0);

    const e3 = evaluateAlerts("h1", rules, { mem_used_pct: 89 }, t0 + 40_000, state, 120, true);
    expect(e3.length).toBe(1);
    expect(e3[0]?.state).toBe("recovered");
  });
});
