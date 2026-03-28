import { describe, expect, it } from "bun:test";
import { parseProcessCount } from "./process.plugin";

describe("process plugin parser", () => {
  it("parses process count", () => {
    expect(parseProcessCount("145\n")).toBe(145);
  });

  it("returns 0 for invalid input", () => {
    expect(parseProcessCount("not-a-number")).toBe(0);
  });
});
