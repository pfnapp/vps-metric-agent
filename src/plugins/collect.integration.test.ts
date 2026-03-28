import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { resetRuntimeForTests, setRuntimeForTests } from "../runtime";
import { cpuPlugin } from "./cpu.plugin";
import { ioPlugin } from "./io.plugin";
import { loadPlugin } from "./load.plugin";
import { memoryPlugin } from "./memory.plugin";
import { processPlugin } from "./process.plugin";
import { storagePlugin } from "./storage.plugin";
import { uptimePlugin } from "./uptime.plugin";

describe("plugin collect integration (runtime mocked)", () => {
  beforeEach(() => {
    resetRuntimeForTests();
  });

  afterEach(() => {
    resetRuntimeForTests();
  });

  it("memory plugin reads /proc/meminfo and emits ts", async () => {
    setRuntimeForTests({
      now: () => 1700000000000,
      readFileText: async (path) => {
        if (path !== "/proc/meminfo") throw new Error(`unexpected path: ${path}`);
        return "MemTotal: 1000 kB\nMemAvailable: 200 kB\n";
      },
    });

    const metrics = await memoryPlugin.collect({ hostId: "h1", now: Date.now });
    expect(metrics.mem_total_kb).toBe(1000);
    expect(metrics.mem_used_pct).toBe(80);
    expect(metrics.ts).toBe(1700000000000);
  });

  it("cpu plugin returns deterministic timestamp with mocked runtime", async () => {
    setRuntimeForTests({
      now: () => 1700000000001,
      readFileText: async () => "cpu  10 0 10 80 0 0 0\n",
    });

    const metrics = await cpuPlugin.collect({ hostId: "h1", now: Date.now });
    expect(metrics.ts).toBe(1700000000001);
    expect(typeof metrics.cpu_used_pct).toBe("number");
  });

  it("load plugin reads /proc/loadavg", async () => {
    setRuntimeForTests({
      now: () => 1700000000002,
      readFileText: async () => "1.00 0.50 0.25 1/100 123",
    });

    const metrics = await loadPlugin.collect({ hostId: "h1", now: Date.now });
    expect(metrics.load1).toBe(1);
    expect(metrics.load5).toBe(0.5);
    expect(metrics.load15).toBe(0.25);
    expect(metrics.ts).toBe(1700000000002);
  });

  it("io plugin computes totals from mocked /proc/net/dev", async () => {
    setRuntimeForTests({
      now: () => 1700000001000,
      readFileText: async () =>
        [
          "Inter-|   Receive                                                |  Transmit",
          " face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed",
          "    lo: 100 0 0 0 0 0 0 0 100 0 0 0 0 0 0 0",
          "  eth0: 1000 1 0 0 0 0 0 0 3000 2 0 0 0 0 0 0",
        ].join("\n"),
    });

    const metrics = await ioPlugin.collect({ hostId: "h1", now: Date.now });
    expect(metrics.net_rx_bytes_total).toBe(1000);
    expect(metrics.net_tx_bytes_total).toBe(3000);
    expect(metrics.ts).toBe(1700000001000);
  });

  it("storage plugin uses runCommandText", async () => {
    setRuntimeForTests({
      now: () => 1700000000003,
      runCommandText: async (cmd) => {
        expect(cmd).toContain("df -Pk /");
        return "/dev/sda1 100000 10000 90000 10% /\n";
      },
    });

    const metrics = await storagePlugin.collect({ hostId: "h1", now: Date.now });
    expect(metrics.storage_root_used_pct).toBe(10);
    expect(metrics.ts).toBe(1700000000003);
  });

  it("uptime plugin parses mocked /proc/uptime", async () => {
    setRuntimeForTests({
      now: () => 1700000000004,
      readFileText: async () => "999.55 0.00",
    });

    const metrics = await uptimePlugin.collect({ hostId: "h1", now: Date.now });
    expect(metrics.uptime_sec).toBe(999);
    expect(metrics.ts).toBe(1700000000004);
  });

  it("process plugin uses runCommandText", async () => {
    setRuntimeForTests({
      now: () => 1700000000005,
      runCommandText: async (cmd) => {
        expect(cmd).toContain("ps -e");
        return "321\n";
      },
    });

    const metrics = await processPlugin.collect({ hostId: "h1", now: Date.now });
    expect(metrics.process_count).toBe(321);
    expect(metrics.ts).toBe(1700000000005);
  });
});
