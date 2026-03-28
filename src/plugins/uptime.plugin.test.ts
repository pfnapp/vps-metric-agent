import { describe, expect, it } from "bun:test";
import { parseUptimeSeconds } from "./uptime.plugin";

describe("uptime plugin parser", () => {
  it("parses and floors uptime seconds", () => {
    expect(parseUptimeSeconds("1234.99 0.00")).toBe(1234);
  });

  it("returns 0 for invalid input", () => {
    expect(parseUptimeSeconds("abc")).toBe(0);
  });
});
