import { MetricPlugin } from "../types";

function parseCpuTotalIdle(stat: string): { total: number; idle: number } | null {
  const line = stat.split("\n").find((l) => l.startsWith("cpu "));
  if (!line) return null;

  const cols = line.trim().split(/\s+/).slice(1).map(Number);
  if (cols.length < 4) return null;

  const idle = (cols[3] ?? 0) + (cols[4] ?? 0); // idle + iowait
  const total = cols.reduce((a, b) => a + b, 0);
  return { total, idle };
}

let previous: { total: number; idle: number; ts: number } | null = null;

export const cpuPlugin: MetricPlugin = {
  name: "cpu",
  intervalSec: 15,
  collect: async () => {
    const stat = await Bun.file("/proc/stat").text();
    const current = parseCpuTotalIdle(stat);

    let cpuUsedPct = 0;
    if (current && previous) {
      const totalDelta = current.total - previous.total;
      const idleDelta = current.idle - previous.idle;
      cpuUsedPct = totalDelta > 0 ? (1 - idleDelta / totalDelta) * 100 : 0;
    }

    if (current) {
      previous = { ...current, ts: Date.now() };
    }

    return {
      cpu_used_pct: Number(cpuUsedPct.toFixed(2)),
      ts: Date.now(),
    };
  },
};
