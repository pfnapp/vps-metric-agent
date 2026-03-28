import { MetricPlugin } from "../types";

function parseMeminfo(meminfo: string) {
  const map = new Map<string, number>();
  for (const line of meminfo.split("\n")) {
    const [k, rest] = line.split(":");
    if (!k || !rest) continue;
    const v = Number(rest.trim().split(/\s+/)[0] || "0");
    map.set(k, v);
  }

  const totalKb = map.get("MemTotal") ?? 0;
  const availKb = map.get("MemAvailable") ?? 0;
  const usedPct = totalKb > 0 ? ((totalKb - availKb) / totalKb) * 100 : 0;

  return {
    mem_total_kb: totalKb,
    mem_available_kb: availKb,
    mem_used_pct: Number(usedPct.toFixed(2)),
  };
}

function parseCpuTotalIdle(stat: string): { total: number; idle: number } | null {
  const line = stat.split("\n").find((l) => l.startsWith("cpu "));
  if (!line) return null;
  const cols = line.trim().split(/\s+/).slice(1).map(Number);
  if (cols.length < 4) return null;
  const idle = (cols[3] ?? 0) + (cols[4] ?? 0);
  const total = cols.reduce((a, b) => a + b, 0);
  return { total, idle };
}

let previous: { total: number; idle: number } | null = null;

export const systemPlugin: MetricPlugin = {
  name: "system",
  intervalSec: 15,
  collect: async () => {
    const [stat, meminfo, loadavg] = await Promise.all([
      Bun.file("/proc/stat").text(),
      Bun.file("/proc/meminfo").text(),
      Bun.file("/proc/loadavg").text(),
    ]);

    const current = parseCpuTotalIdle(stat);
    const mem = parseMeminfo(meminfo);
    const load1 = Number(loadavg.split(/\s+/)[0] || 0);

    let cpuUsedPct = 0;
    if (current && previous) {
      const totalDelta = current.total - previous.total;
      const idleDelta = current.idle - previous.idle;
      cpuUsedPct = totalDelta > 0 ? (1 - idleDelta / totalDelta) * 100 : 0;
    }
    if (current) previous = current;

    return {
      cpu_used_pct: Number(cpuUsedPct.toFixed(2)),
      load1,
      ...mem,
      ts: Date.now(),
    };
  },
};
