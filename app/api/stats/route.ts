/**
 * /api/stats — simple counter endpoint
 * GET  → returns all stats
 * POST → increments a counter by name
 */

import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

function getRedis() {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
}

export async function GET() {
  try {
    const redis = getRedis();
    if (!redis) return NextResponse.json({ error: "Redis not configured" }, { status: 500 });

    const [widgets, copies, chats] = await Promise.all([
      redis.get<number>("stats:widgets_created") ?? 0,
      redis.get<number>("stats:embed_copied")    ?? 0,
      redis.get<number>("stats:chat_messages")   ?? 0,
    ]);

    return NextResponse.json({
      widgets_created: widgets ?? 0,
      embed_copied:    copies  ?? 0,
      chat_messages:   chats   ?? 0,
    });
  } catch (err) {
    console.error("GET /api/stats:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const redis = getRedis();
    if (!redis) return NextResponse.json({ error: "Redis not configured" }, { status: 500 });

    const { event } = await req.json();
    const allowed = ["widgets_created", "embed_copied", "chat_messages"];
    if (!allowed.includes(event)) {
      return NextResponse.json({ error: "Unknown event" }, { status: 400 });
    }

    const newVal = await redis.incr(`stats:${event}`);
    return NextResponse.json({ event, count: newVal });
  } catch (err) {
    console.error("POST /api/stats:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
