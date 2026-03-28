import { describe, expect, it } from "bun:test";
import { parseCpuTotalIdle } from "./cpu.plugin";

describe("cpu plugin parser", () => {
  it("parses cpu total and idle from /proc/stat line", () => {
    const sample = [
      "cpu  2255 34 2290 22625563 6290 127 456",
      "cpu0 1132 17 1441 11311771 3675 0 227",
    ].join("\n");

    const parsed = parseCpuTotalIdle(sample);
    expect(parsed).not.toBeNull();
    expect(parsed?.idle).toBe(22631853); // idle + iowait
    expect(parsed?.total).toBe(2255 + 34 + 2290 + 22625563 + 6290 + 127 + 456);
  });

  it("returns null when cpu line is missing", () => {
    const parsed = parseCpuTotalIdle("intr 1 2 3\nctxt 100");
    expect(parsed).toBeNull();
  });
});
