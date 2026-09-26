/**
 * /api/chat — AI response endpoint
 * - Rate limited: 20 requests per IP per minute
 * - Calls Gemini REST API directly (works with all key formats)
 * - Answers only from the widget's knowledge base
 */

import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getWidget } from "@/lib/storage";
import { ChatRequest } from "@/lib/types";

function withCors(res: NextResponse): NextResponse {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

// Build rate limiter only when Redis env vars exist
function getRatelimiter() {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return new Ratelimit({
      redis: new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
      // 20 messages per IP per 60 seconds
      limiter: Ratelimit.slidingWindow(20, "60 s"),
      prefix:  "rl:chat",
    });
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // ── Rate limit ────────────────────────────────────────────────────────
    const rl = getRatelimiter();
    if (rl) {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        "anonymous";

      const { success, remaining } = await rl.limit(ip);
      if (!success) {
        const res = NextResponse.json(
          { reply: "Too many messages. Please wait a moment before trying again." },
          { status: 429 }
        );
        res.headers.set("X-RateLimit-Remaining", String(remaining));
        return withCors(res);
      }
    }

    // ── Parse body ────────────────────────────────────────────────────────
    const body: ChatRequest = await req.json();
    const { widgetId, message, history } = body;

    if (!widgetId || !message) {
      return withCors(
        NextResponse.json({ error: "widgetId and message required" }, { status: 400 })
      );
    }

    // ── Load widget config ────────────────────────────────────────────────
    const config = await getWidget(widgetId);
    if (!config) {
      return withCors(
        NextResponse.json({ error: "Widget not found" }, { status: 404 })
      );
    }

    // ── Validate API key ──────────────────────────────────────────────────
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set");
      return withCors(
        NextResponse.json(
          { reply: "The chatbot is not configured yet. Please add a Gemini API key." },
          { status: 200 }
        )
      );
    }

    // ── Build Gemini request ──────────────────────────────────────────────
    const contents = [
      ...(history ?? []).slice(-10).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: buildSystemPrompt(config.botName, config.knowledgeBase) }],
          },
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini error:", geminiRes.status, errText);
      throw new Error(`Gemini ${geminiRes.status}`);
    }

    const geminiData = await geminiRes.json();
    const reply =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "I couldn't generate a response. Please try again.";

    return withCors(NextResponse.json({ reply }));

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("POST /api/chat error:", msg);
    const isDev = process.env.NODE_ENV === "development";
    return withCors(
      NextResponse.json(
        {
          reply: isDev
            ? `[Dev error] ${msg}`
            : "Sorry, I'm having trouble responding right now. Please try again.",
        },
        { status: 200 }
      )
    );
  }
}

function buildSystemPrompt(botName: string, knowledgeBase: string): string {
  return `You are ${botName}, a helpful AI customer support assistant.
Answer questions using ONLY the knowledge base below. If the answer isn't there, say you don't have that information and offer to connect the visitor with a human.
Keep answers concise and friendly.

--- KNOWLEDGE BASE ---
${knowledgeBase}
--- END ---`;
}
