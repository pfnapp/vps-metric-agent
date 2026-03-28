import { MetricPlugin } from "../types";

function parseMeminfo(meminfo: string) {
  const map = new Map<string, number>();

  for (const line of meminfo.split("\n")) {
    const [key, valueRaw] = line.split(":");
    if (!key || !valueRaw) continue;
    const value = Number(valueRaw.trim().split(/\s+/)[0] || "0"); // kB
    map.set(key, value);
  }

  const totalKb = map.get("MemTotal") ?? 0;
  const availableKb = map.get("MemAvailable") ?? 0;
  const usedKb = Math.max(0, totalKb - availableKb);
  const usedPct = totalKb > 0 ? (usedKb / totalKb) * 100 : 0;

  return {
    mem_total_kb: totalKb,
    mem_available_kb: availableKb,
    mem_used_kb: usedKb,
    mem_used_pct: Number(usedPct.toFixed(2)),
  };
}

export const memoryPlugin: MetricPlugin = {
  name: "memory",
  intervalSec: 15,
  collect: async () => {
    const meminfo = await Bun.file("/proc/meminfo").text();

    return {
      ...parseMeminfo(meminfo),
      ts: Date.now(),
    };
  },
};
