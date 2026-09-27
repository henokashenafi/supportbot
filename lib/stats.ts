/**
 * Lightweight stats helper — increments Redis counters directly.
 * Used by server-side API routes (no HTTP round-trip needed).
 */

import { Redis } from "@upstash/redis";

function getRedis(): Redis | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
}

type StatEvent = "widgets_created" | "embed_copied" | "chat_messages";

export async function incrementStat(event: StatEvent): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;
    await redis.incr(`stats:${event}`);
  } catch (err) {
    // Never let a stats failure break the main flow
    console.error("Stats increment failed:", err);
  }
}
