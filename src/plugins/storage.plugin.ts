import { MetricPlugin } from "../types";

export const storagePlugin: MetricPlugin = {
  name: "storage",
  intervalSec: 60,
  collect: async () => {
    const proc = Bun.spawn(["bash", "-lc", "df -Pk / | tail -1"]);
    const out = await new Response(proc.stdout).text();
    const cols = out.trim().split(/\s+/);

    const totalKb = Number(cols[1] || "0");
    const usedKb = Number(cols[2] || "0");
    const availableKb = Number(cols[3] || "0");
    const usedPct = Number((cols[4] || "0%").replace("%", ""));

    return {
      storage_root_total_kb: Number.isFinite(totalKb) ? totalKb : 0,
      storage_root_used_kb: Number.isFinite(usedKb) ? usedKb : 0,
      storage_root_available_kb: Number.isFinite(availableKb) ? availableKb : 0,
      storage_root_used_pct: Number.isFinite(usedPct) ? usedPct : 0,
      ts: Date.now(),
    };
  },
};
