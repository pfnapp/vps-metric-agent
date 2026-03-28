import { getRuntime } from "../runtime";
import { MetricPlugin } from "../types";

type Totals = { rxBytes: number; txBytes: number; at: number };

export function parseNetDev(content: string): { rxBytes: number; txBytes: number } {
  let rxBytes = 0;
  let txBytes = 0;

  const lines = content.trim().split("\n").slice(2); // skip headers
  for (const line of lines) {
    const [ifaceRaw, dataRaw] = line.split(":");
    if (!ifaceRaw || !dataRaw) continue;

    const iface = ifaceRaw.trim();
    if (iface === "lo") continue;

    const cols = dataRaw.trim().split(/\s+/);
    const rx = Number(cols[0] || "0");
    const tx = Number(cols[8] || "0");

    rxBytes += Number.isFinite(rx) ? rx : 0;
    txBytes += Number.isFinite(tx) ? tx : 0;
  }

  return { rxBytes, txBytes };
}

let previous: Totals | null = null;

export const ioPlugin: MetricPlugin = {
  name: "io",
  intervalSec: 15,
  collect: async () => {
    const { readFileText, now: nowFn } = getRuntime();
    const now = nowFn();
    const netDev = await readFileText("/proc/net/dev");
    const current = parseNetDev(netDev);

    let rxBytesPerSec = 0;
    let txBytesPerSec = 0;

    if (previous) {
      const sec = Math.max(1, (now - previous.at) / 1000);
      rxBytesPerSec = Math.max(0, (current.rxBytes - previous.rxBytes) / sec);
      txBytesPerSec = Math.max(0, (current.txBytes - previous.txBytes) / sec);
    }

    previous = { ...current, at: now };

    return {
      net_rx_bytes_total: current.rxBytes,
      net_tx_bytes_total: current.txBytes,
      net_rx_bytes_per_sec: Number(rxBytesPerSec.toFixed(2)),
      net_tx_bytes_per_sec: Number(txBytesPerSec.toFixed(2)),
      ts: now,
    };
  },
};
