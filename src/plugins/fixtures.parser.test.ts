import { describe, expect, it } from "bun:test";
import { parseCpuTotalIdle } from "./cpu.plugin";
import { parseLoadavg } from "./load.plugin";
import { parseMeminfo } from "./memory.plugin";
import { parseNetDev } from "./io.plugin";
import { parseUptimeSeconds } from "./uptime.plugin";

const roots = ["ubuntu", "alpine"] as const;

async function fixture(name: (typeof roots)[number], file: string) {
  return Bun.file(`test/fixtures/proc/${name}/${file}`).text();
}

describe("golden fixtures parser regression", () => {
  for (const distro of roots) {
    it(`${distro}: cpu parser works`, async () => {
      const raw = await fixture(distro, "proc_stat.txt");
      const parsed = parseCpuTotalIdle(raw);
      expect(parsed).not.toBeNull();
      expect((parsed?.total ?? 0) > 0).toBeTrue();
      expect((parsed?.idle ?? 0) > 0).toBeTrue();
    });

    it(`${distro}: meminfo parser works`, async () => {
      const raw = await fixture(distro, "proc_meminfo.txt");
      const parsed = parseMeminfo(raw);
      expect(parsed.mem_total_kb).toBeGreaterThan(0);
      expect(parsed.mem_available_kb).toBeGreaterThanOrEqual(0);
      expect(parsed.mem_used_pct).toBeGreaterThanOrEqual(0);
      expect(parsed.mem_used_pct).toBeLessThanOrEqual(100);
    });

    it(`${distro}: load parser works`, async () => {
      const raw = await fixture(distro, "proc_loadavg.txt");
      const parsed = parseLoadavg(raw);
      expect(parsed.load1).toBeGreaterThanOrEqual(0);
      expect(parsed.load5).toBeGreaterThanOrEqual(0);
      expect(parsed.load15).toBeGreaterThanOrEqual(0);
    });

    it(`${distro}: net parser works`, async () => {
      const raw = await fixture(distro, "proc_net_dev.txt");
      const parsed = parseNetDev(raw);
      expect(parsed.rxBytes).toBeGreaterThan(0);
      expect(parsed.txBytes).toBeGreaterThan(0);
    });

    it(`${distro}: uptime parser works`, async () => {
      const raw = await fixture(distro, "proc_uptime.txt");
      const parsed = parseUptimeSeconds(raw);
      expect(parsed).toBeGreaterThan(0);
    });
  }
});
