import { MetricPlugin } from "../types";

export const processPlugin: MetricPlugin = {
  name: "process",
  intervalSec: 30,
  collect: async () => {
    const proc = Bun.spawn(["bash", "-lc", "ps -e --no-headers | wc -l"]);
    const out = await new Response(proc.stdout).text();
    const processCount = Number(out.trim() || "0");

    return {
      process_count: Number.isFinite(processCount) ? processCount : 0,
      ts: Date.now(),
    };
  },
};
