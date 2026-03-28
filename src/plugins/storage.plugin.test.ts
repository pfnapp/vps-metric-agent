import { describe, expect, it } from "bun:test";
import { parseDfRootLine } from "./storage.plugin";

describe("storage plugin parser", () => {
  it("parses df root line values", () => {
    const parsed = parseDfRootLine("/dev/sda1 100000 25000 75000 25% /");

    expect(parsed.storage_root_total_kb).toBe(100000);
    expect(parsed.storage_root_used_kb).toBe(25000);
    expect(parsed.storage_root_available_kb).toBe(75000);
    expect(parsed.storage_root_used_pct).toBe(25);
  });

  it("returns zeros on malformed input", () => {
    const parsed = parseDfRootLine("oops");
    expect(parsed.storage_root_total_kb).toBe(0);
    expect(parsed.storage_root_used_kb).toBe(0);
    expect(parsed.storage_root_available_kb).toBe(0);
    expect(parsed.storage_root_used_pct).toBe(0);
  });
});
