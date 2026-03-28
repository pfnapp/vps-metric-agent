import { describe, expect, it } from "bun:test";
import { parseNetDev } from "./io.plugin";

describe("io plugin parser", () => {
  it("parses and sums non-loopback interfaces", () => {
    const sample = [
      "Inter-|   Receive                                                |  Transmit",
      " face |bytes    packets errs drop fifo frame compressed multicast|bytes    packets errs drop fifo colls carrier compressed",
      "    lo: 100 0 0 0 0 0 0 0 100 0 0 0 0 0 0 0",
      "  eth0: 1000 1 0 0 0 0 0 0 2000 2 0 0 0 0 0 0",
      "   ens5: 3000 1 0 0 0 0 0 0 4000 2 0 0 0 0 0 0",
    ].join("\n");

    const parsed = parseNetDev(sample);
    expect(parsed.rxBytes).toBe(4000);
    expect(parsed.txBytes).toBe(6000);
  });

  it("returns 0 totals on invalid rows", () => {
    const parsed = parseNetDev("hdr1\nhdr2\ninvalid");
    expect(parsed.rxBytes).toBe(0);
    expect(parsed.txBytes).toBe(0);
  });
});
