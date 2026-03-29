import { AppConfig } from "../types";
import { sendDiscord } from "./discord";
import { sendTelegram } from "./telegram";
import { AlertEvent } from "./types";

function formatEvent(event: AlertEvent): string {
  const icon = event.state === "firing" ? "🚨" : "✅";
  return [
    `${icon} <b>${event.severity.toUpperCase()}</b> ${event.state.toUpperCase()}`,
    `<b>Host:</b> ${event.hostId}`,
    `<b>Rule:</b> ${event.ruleId}`,
    `<b>Metric:</b> ${event.metric} ${event.op} ${event.threshold}`,
    `<b>Value:</b> ${event.value}`,
    `<b>Time:</b> ${new Date(event.ts).toISOString()}`,
    `<b>Message:</b> ${event.message}`,
  ].join("\n");
}

export async function notifyAll(cfg: AppConfig, event: AlertEvent): Promise<void> {
  const text = formatEvent(event);

  const jobs: Promise<void>[] = [];

  if (cfg.outputs.telegram.enabled) {
    const tokenName = cfg.outputs.telegram.bot_token_env || "TG_BOT_TOKEN";
    const token = process.env[tokenName] || "";
    const chatId = cfg.outputs.telegram.chat_id || "";

    if (token && chatId) {
      jobs.push(
        sendTelegram(token, chatId, text).catch((error) => {
          console.error("[notify] telegram failed", error);
        }),
      );
    } else {
      console.warn("[notify] telegram enabled but token/chat_id missing");
    }
  }

  if (cfg.outputs.discord.enabled) {
    const webhookEnv = cfg.outputs.discord.webhook_url_env || "DISCORD_WEBHOOK_URL";
    const webhookUrl = process.env[webhookEnv] || "";

    if (webhookUrl) {
      jobs.push(
        sendDiscord(webhookUrl, text).catch((error) => {
          console.error("[notify] discord failed", error);
        }),
      );
    } else {
      console.warn("[notify] discord enabled but webhook env missing");
    }
  }

  await Promise.all(jobs);
}
