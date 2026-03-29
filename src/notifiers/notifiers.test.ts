import { afterEach, describe, expect, it } from "bun:test";
import { notifyAll } from "./index";
import { AppConfig } from "../types";

const originalFetch = globalThis.fetch;

function baseConfig(): AppConfig {
  return {
    agent: { mode: "notify", host_id: "auto", state_file: undefined },
    collect: { interval_sec: undefined },
    alerts: { cooldown_sec: 10, send_recovery: true, rules: [] },
    outputs: {
      ingest: { enabled: false, url: "", token_env: "AGENT_TOKEN" },
      telegram: { enabled: true, bot_token_env: "TG_BOT_TOKEN", chat_id: "123" },
      discord: { enabled: true, webhook_url_env: "DISCORD_WEBHOOK_URL" },
    },
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.TG_BOT_TOKEN;
  delete process.env.DISCORD_WEBHOOK_URL;
});

describe("notifyAll", () => {
  it("sends to telegram and discord when configured", async () => {
    const calls: string[] = [];
    globalThis.fetch = (async (input: string | URL | Request) => {
      calls.push(typeof input === "string" ? input : String(input));
      return new Response("ok", { status: 200 });
    }) as typeof fetch;

    process.env.TG_BOT_TOKEN = "token";
    process.env.DISCORD_WEBHOOK_URL = "https://discord.test/webhook";

    await notifyAll(baseConfig(), {
      hostId: "h1",
      ruleId: "r1",
      severity: "warn",
      state: "firing",
      metric: "cpu_used_pct",
      value: 88,
      threshold: 75,
      op: ">",
      ts: Date.now(),
      message: "cpu high",
    });

    expect(calls.length).toBe(2);
    expect(calls.some((c) => c.includes("api.telegram.org"))).toBeTrue();
    expect(calls.some((c) => c.includes("discord.test/webhook"))).toBeTrue();
  });
});
