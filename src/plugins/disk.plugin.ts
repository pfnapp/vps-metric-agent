import { MetricPlugin } from "../types";

export const diskPlugin: MetricPlugin = {
  name: "disk",
  intervalSec: 60,
  collect: async () => {
    const proc = Bun.spawn(["bash", "-lc", "df -P / | tail -1"]);
    const out = await new Response(proc.stdout).text();
    const cols = out.trim().split(/\s+/);

    const usedPct = Number((cols[4] || "0%").replace("%", ""));
    const availKb = Number(cols[3] || "0");

    return {
      disk_root_used_pct: Number.isFinite(usedPct) ? usedPct : 0,
      disk_root_available_kb: Number.isFinite(availKb) ? availKb : 0,
      ts: Date.now(),
    };
  },
};
