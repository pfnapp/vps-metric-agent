import { MetricPlugin } from "../types";

export const uptimePlugin: MetricPlugin = {
  name: "uptime",
  intervalSec: 30,
  collect: async () => {
    const raw = await Bun.file("/proc/uptime").text();
    const uptimeSec = Number(raw.trim().split(/\s+/)[0] || "0");

    return {
      uptime_sec: Number.isFinite(uptimeSec) ? Math.floor(uptimeSec) : 0,
      ts: Date.now(),
    };
  },
};
