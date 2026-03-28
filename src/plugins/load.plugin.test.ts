import { describe, expect, it } from "bun:test";
import { parseLoadavg } from "./load.plugin";

describe("load plugin parser", () => {
  it("parses loadavg values", () => {
    const parsed = parseLoadavg("0.24 0.78 1.11 1/100 1234");
    expect(parsed.load1).toBe(0.24);
    expect(parsed.load5).toBe(0.78);
    expect(parsed.load15).toBe(1.11);
  });

  it("falls back to zero when values are absent", () => {
    const parsed = parseLoadavg("");
    expect(parsed.load1).toBe(0);
    expect(parsed.load5).toBe(0);
    expect(parsed.load15).toBe(0);
  });
});
