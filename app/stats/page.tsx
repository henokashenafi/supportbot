/**
 * /stats — private stats dashboard
 * Shows total widgets created, embed copies, and chat messages
 * Reads directly from Redis counters
 */

import Link from "next/link";
import { Redis } from "@upstash/redis";

async function getStats() {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return { widgets_created: 0, embed_copied: 0, chat_messages: 0 };
    }
    const redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    const [widgets, copies, chats] = await Promise.all([
      redis.get<number>("stats:widgets_created"),
      redis.get<number>("stats:embed_copied"),
      redis.get<number>("stats:chat_messages"),
    ]);
    return {
      widgets_created: widgets ?? 0,
      embed_copied:    copies  ?? 0,
      chat_messages:   chats   ?? 0,
    };
  } catch {
    return { widgets_created: 0, embed_copied: 0, chat_messages: 0 };
  }
}

export default async function StatsPage() {
  const stats = await getStats();

  const cards = [
    {
      label: "Widgets Created",
      value: stats.widgets_created,
      desc: "Total widgets configured by users",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
            stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      label: "Embed Codes Copied",
      value: stats.embed_copied,
      desc: "Users who copied the script tag",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="9" y="9" width="13" height="13" rx="2" stroke="#0a0a0a" strokeWidth="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
            stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      label: "Chat Messages",
      value: stats.chat_messages,
      desc: "Total AI responses generated",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fff",
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      color: "#0a0a0a",
    }}>
      {/* Nav */}
      <header style={{
        padding: "0 40px", height: 56,
        borderBottom: "1px solid #e8e8e8",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ display: "inline-block", textDecoration: "none", lineHeight: 0 }}>
          <img src="/supportbot-logo-headset.svg" alt="SupportBot" style={{ height: 76, width: "auto", display: "block" }} />
        </Link>
        <span style={{ fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "#bbb" }}>
          Stats — Private
        </span>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "52px 40px" }}>
        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#aaa", marginBottom: 10 }}>
            Overview
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", margin: 0 }}>
            SupportBot Stats
          </h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
            Live counters from Redis — refreshes on page load.
          </p>
        </div>

        {/* Stat cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 48,
        }}>
          {cards.map((card) => (
            <div key={card.label} style={{
              border: "1px solid #e8e8e8",
              padding: "24px 20px",
            }}>
              <div style={{ marginBottom: 14 }}>{card.icon}</div>
              <p style={{
                fontSize: 36, fontWeight: 800,
                letterSpacing: "-0.04em", margin: "0 0 6px",
              }}>
                {Number(card.value).toLocaleString()}
              </p>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#0a0a0a", margin: "0 0 4px" }}>
                {card.label}
              </p>
              <p style={{ fontSize: 11, color: "#aaa", margin: 0, lineHeight: 1.6 }}>
                {card.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Last updated */}
        <div style={{
          borderTop: "1px solid #f0f0f0",
          paddingTop: 20,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <p style={{ fontSize: 11, color: "#bbb", margin: 0 }}>
            Last updated: {new Date().toLocaleString("en-US", {
              month: "short", day: "numeric", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
          <Link href="/stats" style={{
            fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "#0a0a0a", textDecoration: "none",
            border: "1px solid #e8e8e8", padding: "6px 14px",
            borderRadius: 999,
          }}>
            Refresh
          </Link>
        </div>

        <p style={{ marginTop: 24, fontSize: 11, color: "#ddd", textAlign: "center" }}>
          Keep this URL private — it shows your real usage data.
        </p>
      </main>
    </div>
  );
}
