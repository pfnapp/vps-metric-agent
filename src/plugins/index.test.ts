import { describe, expect, it } from "bun:test";
import { defaultPlugins } from "./index";

describe("plugin registry", () => {
  it("contains expected plugin names", () => {
    const names = defaultPlugins.map((p) => p.name);
    expect(names).toEqual(["cpu", "memory", "load", "io", "storage", "uptime", "process"]);
  });

  it("has positive intervals", () => {
    for (const plugin of defaultPlugins) {
      expect(plugin.intervalSec).toBeGreaterThan(0);
    }
  });
});
