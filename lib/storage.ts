/**
 * Storage layer — Upstash Redis
 *
 * Each widget config is stored as a Redis hash under the key:
 *   widget:{id}
 *
 * A sorted set "widgets:all" keeps track of all IDs ordered by creation time.
 *
 * Environment variables required (add to .env.local and Vercel dashboard):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * Falls back to the local JSON file store when those env vars are missing
 * (so local dev still works without Redis if you prefer).
 */

import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";
import { WidgetConfig } from "./types";

// ─── Redis client (lazy — only created when env vars exist) ──────────────────
function getRedis(): Redis | null {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
}

// ─── Local JSON fallback (development without Redis) ─────────────────────────
const DATA_DIR  = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "widgets.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR))  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}", "utf-8");
}

function localGetAll(): Record<string, WidgetConfig> {
  ensureDataFile();
  try { return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")); }
  catch { return {}; }
}

function localSave(config: WidgetConfig) {
  ensureDataFile();
  const all = localGetAll();
  all[config.id] = config;
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), "utf-8");
}

function localDelete(id: string): boolean {
  const all = localGetAll();
  if (!all[id]) return false;
  delete all[id];
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), "utf-8");
  return true;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getWidget(id: string): Promise<WidgetConfig | null> {
  const redis = getRedis();
  if (redis) {
    const data = await redis.get<WidgetConfig>(`widget:${id}`);
    return data ?? null;
  }
  return localGetAll()[id] ?? null;
}

export async function saveWidget(config: WidgetConfig): Promise<void> {
  const redis = getRedis();
  if (redis) {
    // Store the full config, expire after 30 days (TTL cleanup built-in)
    await redis.set(`widget:${config.id}`, config, { ex: 60 * 60 * 24 * 30 });
    // Track in sorted set for listing (score = timestamp)
    await redis.zadd("widgets:all", {
      score:  new Date(config.createdAt).getTime(),
      member: config.id,
    });
    return;
  }
  localSave(config);
}

export async function deleteWidget(id: string): Promise<boolean> {
  const redis = getRedis();
  if (redis) {
    const existed = await redis.exists(`widget:${id}`);
    if (!existed) return false;
    await redis.del(`widget:${id}`);
    await redis.zrem("widgets:all", id);
    return true;
  }
  return localDelete(id);
}

export async function listWidgets(): Promise<WidgetConfig[]> {
  const redis = getRedis();
  if (redis) {
    // Get IDs sorted by creation time, newest first (reverse order)
    const ids = await redis.zrange("widgets:all", 0, -1, { rev: true });
    if (!ids.length) return [];
    const configs = await Promise.all(
      (ids as string[]).map(id => redis.get<WidgetConfig>(`widget:${id}`))
    );
    return configs.filter(Boolean) as WidgetConfig[];
  }
  return Object.values(localGetAll()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
