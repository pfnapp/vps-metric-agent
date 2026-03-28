import { MetricPlugin } from "../types";

export function parseProcessCount(raw: string) {
  const processCount = Number(raw.trim() || "0");
  return Number.isFinite(processCount) ? processCount : 0;
}

export const processPlugin: MetricPlugin = {
  name: "process",
  intervalSec: 30,
  collect: async () => {
    const proc = Bun.spawn(["bash", "-lc", "ps -e --no-headers | wc -l"]);
    const out = await new Response(proc.stdout).text();

    return {
      process_count: parseProcessCount(out),
      ts: Date.now(),
    };
  },
};
