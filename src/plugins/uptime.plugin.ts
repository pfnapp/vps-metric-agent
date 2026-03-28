import { MetricPlugin } from "../types";

export function parseUptimeSeconds(raw: string) {
  const uptimeSec = Number(raw.trim().split(/\s+/)[0] || "0");
  return Number.isFinite(uptimeSec) ? Math.floor(uptimeSec) : 0;
}

export const uptimePlugin: MetricPlugin = {
  name: "uptime",
  intervalSec: 30,
  collect: async () => {
    const raw = await Bun.file("/proc/uptime").text();

    return {
      uptime_sec: parseUptimeSeconds(raw),
      ts: Date.now(),
    };
  },
};
