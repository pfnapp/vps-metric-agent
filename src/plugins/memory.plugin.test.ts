import { describe, expect, it } from "bun:test";
import { parseMeminfo } from "./memory.plugin";

describe("memory plugin parser", () => {
  it("parses meminfo and computes used percentage", () => {
    const sample = [
      "MemTotal:       8000000 kB",
      "MemFree:        1000000 kB",
      "MemAvailable:   2000000 kB",
      "Buffers:         100000 kB",
    ].join("\n");

    const parsed = parseMeminfo(sample);

    expect(parsed.mem_total_kb).toBe(8000000);
    expect(parsed.mem_available_kb).toBe(2000000);
    expect(parsed.mem_used_kb).toBe(6000000);
    expect(parsed.mem_used_pct).toBe(75);
  });

  it("handles missing MemAvailable safely", () => {
    const sample = "MemTotal: 1024 kB\n";
    const parsed = parseMeminfo(sample);

    expect(parsed.mem_total_kb).toBe(1024);
    expect(parsed.mem_available_kb).toBe(0);
    expect(parsed.mem_used_kb).toBe(1024);
    expect(parsed.mem_used_pct).toBe(100);
  });
});
