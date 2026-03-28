import { getRuntime } from "../runtime";
import { MetricPlugin } from "../types";

export function parseDfRootLine(line: string) {
  const cols = line.trim().split(/\s+/);

  const totalKb = Number(cols[1] || "0");
  const usedKb = Number(cols[2] || "0");
  const availableKb = Number(cols[3] || "0");
  const usedPct = Number((cols[4] || "0%").replace("%", ""));

  return {
    storage_root_total_kb: Number.isFinite(totalKb) ? totalKb : 0,
    storage_root_used_kb: Number.isFinite(usedKb) ? usedKb : 0,
    storage_root_available_kb: Number.isFinite(availableKb) ? availableKb : 0,
    storage_root_used_pct: Number.isFinite(usedPct) ? usedPct : 0,
  };
}

export const storagePlugin: MetricPlugin = {
  name: "storage",
  intervalSec: 60,
  collect: async () => {
    const { runCommandText, now } = getRuntime();
    const out = await runCommandText("df -Pk / | tail -1");

    return {
      ...parseDfRootLine(out),
      ts: now(),
    };
  },
};
