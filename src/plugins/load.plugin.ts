import { MetricPlugin } from "../types";

export const loadPlugin: MetricPlugin = {
  name: "load",
  intervalSec: 15,
  collect: async () => {
    const raw = await Bun.file("/proc/loadavg").text();
    const [l1, l5, l15] = raw.trim().split(/\s+/);

    return {
      load1: Number(l1 || "0"),
      load5: Number(l5 || "0"),
      load15: Number(l15 || "0"),
      ts: Date.now(),
    };
  },
};
