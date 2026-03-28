import { getRuntime } from "../runtime";
import { MetricPlugin } from "../types";

export function parseUptimeSeconds(raw: string) {
  const uptimeSec = Number(raw.trim().split(/\s+/)[0] || "0");
  return Number.isFinite(uptimeSec) ? Math.floor(uptimeSec) : 0;
}

export const uptimePlugin: MetricPlugin = {
  name: "uptime",
  intervalSec: 30,
  collect: async () => {
    const { readFileText, now } = getRuntime();
    const raw = await readFileText("/proc/uptime");

    return {
      uptime_sec: parseUptimeSeconds(raw),
      ts: now(),
    };
  },
};
