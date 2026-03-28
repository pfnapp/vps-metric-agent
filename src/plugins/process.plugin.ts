import { getRuntime } from "../runtime";
import { MetricPlugin } from "../types";

export function parseProcessCount(raw: string) {
  const processCount = Number(raw.trim() || "0");
  return Number.isFinite(processCount) ? processCount : 0;
}

export const processPlugin: MetricPlugin = {
  name: "process",
  intervalSec: 30,
  collect: async () => {
    const { runCommandText, now } = getRuntime();
    const out = await runCommandText("ps -e --no-headers | wc -l");

    return {
      process_count: parseProcessCount(out),
      ts: now(),
    };
  },
};
