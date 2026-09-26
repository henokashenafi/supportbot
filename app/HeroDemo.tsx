"use client";

import { useEffect, useState } from "react";

// ── Conversation script that loops forever ────────────────────────────────
const SCRIPT = [
  { role: "bot",  text: "Hi there 👋 How can I help you today?" },
  { role: "user", text: "Do you offer refunds?" },
  { role: "bot",  text: "Yes! We offer a full 30-day money-back guarantee on all plans." },
  { role: "user", text: "What payment methods do you accept?" },
  { role: "bot",  text: "We accept all major credit cards, PayPal, and bank transfers." },
  { role: "user", text: "How do I get started?" },
  { role: "bot",  text: "Just click 'Get started' above and you'll be up in minutes 🚀" },
];

type Msg = { role: string; text: string };

export default function HeroDemo() {
  const [messages,    setMessages]    = useState<Msg[]>([]);
  const [typing,      setTyping]      = useState(false);   // bot typing dots
  const [inputText,   setInputText]   = useState("");      // user typing in input bar
  const [scriptIndex, setScriptIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function runScript(idx: number) {
      if (cancelled) return;

      const step = SCRIPT[idx % SCRIPT.length];

      if (step.role === "user") {
        // Simulate user typing in input bar character by character
        for (let i = 1; i <= step.text.length; i++) {
          if (cancelled) return;
          setInputText(step.text.slice(0, i));
          await delay(45 + Math.random() * 35);
        }
        await delay(400);
        if (cancelled) return;
        // "Send" — move text from input to bubble
        setMessages(prev => [...prev, { role: "user", text: step.text }]);
        setInputText("");
        await delay(300);

      } else {
        // Bot: show typing dots, then reveal message
        setTyping(true);
        await delay(900 + Math.random() * 400);
        if (cancelled) return;
        setTyping(false);
        setMessages(prev => [...prev, { role: "bot", text: step.text }]);
        await delay(1400);
      }

      if (cancelled) return;

      const nextIdx = (idx + 1) % SCRIPT.length;

      // After a full loop, pause and reset
      if (nextIdx === 0) {
        await delay(2000);
        if (cancelled) return;
        setMessages([]);
        await delay(600);
      }

      setScriptIndex(nextIdx);
    }

    runScript(scriptIndex);

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptIndex]);

  return (
    <div style={{
      background: "#f7f7f7",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
    }}>

      {/* ── Browser chrome ───────────────────────────────── */}
      <div style={{
        background: "#1a1a1a",
        padding: "9px 16px",
        display: "flex",
        alignItems: "center",
        gap: 7,
        flexShrink: 0,
      }}>
        {["#ff5f57","#febc2e","#28c840"].map(c => (
          <span key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
        ))}
        <div style={{
          flex: 1, background: "#2e2e2e",
          borderRadius: 4, padding: "3px 10px",
          fontSize: 11, color: "#555", marginLeft: 8,
        }}>
          acmecorp.com
        </div>
      </div>

      {/* ── Fake website ─────────────────────────────────── */}
      <div style={{ flex: 1, background: "#fff", position: "relative", overflowY: "auto" }}>

        {/* Fake site nav */}
        <div style={{
          borderBottom: "1px solid #ebebeb",
          padding: "0 28px", height: 46,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 18, height: 18, background: "#0a0a0a" }} />
            <span style={{ fontWeight: 800, fontSize: 12.5, letterSpacing: "-0.02em" }}>Acme Corp</span>
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            {["Product","Pricing","Docs"].map(i => (
              <span key={i} style={{ fontSize: 11, color: "#999" }}>{i}</span>
            ))}
          </div>
          <div style={{
            background: "#0a0a0a", color: "#fff",
            fontSize: 10.5, fontWeight: 600, padding: "5px 12px",
          }}>
            Sign up
          </div>
        </div>

        {/* Fake hero text */}
        <div style={{ padding: "36px 28px 24px" }}>
          <p style={{ fontSize: 8.5, letterSpacing: "0.18em", textTransform: "uppercase", color: "#ccc", marginBottom: 12 }}>
            Platform — 01
          </p>
          <h2 style={{
            fontSize: 24, fontWeight: 900,
            letterSpacing: "-0.03em", lineHeight: 1.1,
            marginBottom: 10, maxWidth: 280,
          }}>
            Build something<br />people love.
          </h2>
          <p style={{ fontSize: 12, color: "#888", lineHeight: 1.7, maxWidth: 260, marginBottom: 20 }}>
            The platform helping teams ship faster and support customers around the clock.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ background: "#0a0a0a", color: "#fff", fontSize: 11, fontWeight: 600, padding: "8px 16px" }}>
              Get started
            </div>
            <div style={{ border: "1px solid #e0e0e0", fontSize: 11, color: "#555", padding: "8px 14px" }}>
              Learn more
            </div>
          </div>

          {/* Feature tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 24, maxWidth: 340 }}>
            {[["⚡","Fast"],["🔒","Secure"],["📊","Analytics"]].map(([icon, t]) => (
              <div key={t} style={{ border: "1px solid #ebebeb", padding: "12px 12px 10px" }}>
                <div style={{ fontSize: 14, marginBottom: 5 }}>{icon}</div>
                <div style={{ fontSize: 10.5, fontWeight: 700 }}>{t}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Widget pinned to bottom-right ──────────────── */}
        <div style={{ position: "absolute", bottom: 16, right: 16 }}>

          {/* Chat window */}
          <div style={{
            width: 260,
            background: "#fff",
            boxShadow: "0 8px 32px rgba(0,0,0,0.13)",
            overflow: "hidden",
            marginBottom: 10,
            animation: "pop-in 0.28s cubic-bezier(0.34,1.56,0.64,1) both",
          }}>
            {/* Header */}
            <div style={{
              background: "#0a0a0a",
              padding: "11px 13px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: "#fff" }}>SupportBot</p>
                  <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", gap: 3 }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                    Online
                  </p>
                </div>
              </div>
              {/* close btn (decorative) */}
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              minHeight: 160,
              maxHeight: 200,
              overflowY: "hidden",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              background: "#fff",
            }}>
              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "82%",
                    background: m.role === "user" ? "#0a0a0a" : "#f2f2f2",
                    color: m.role === "user" ? "#fff" : "#0a0a0a",
                    padding: "8px 11px",
                    fontSize: 11.5, lineHeight: 1.55,
                    borderRadius: m.role === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                    animation: "msg-in 0.18s ease both",
                  }}
                >
                  {m.text}
                </div>
              ))}

              {/* Typing dots */}
              {typing && (
                <div style={{
                  alignSelf: "flex-start",
                  background: "#f2f2f2",
                  borderRadius: "10px 10px 10px 2px",
                  padding: "10px 13px",
                  display: "flex", gap: 4,
                  animation: "msg-in 0.18s ease both",
                }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: "#bbb", display: "inline-block",
                      animation: `bounce-dot 1.1s ${i*0.15}s infinite ease-in-out`,
                    }} />
                  ))}
                </div>
              )}
            </div>

            {/* Input bar */}
            <div style={{
              padding: "8px 10px",
              borderTop: "1px solid #f0f0f0",
              display: "flex", gap: 6, alignItems: "center",
              background: "#fff",
            }}>
              <div style={{
                flex: 1, background: inputText ? "#fff" : "#f7f7f7",
                border: `1.5px solid ${inputText ? "#0a0a0a" : "#e8e8e8"}`,
                padding: "7px 10px",
                fontSize: 11.5,
                color: inputText ? "#0a0a0a" : "#bbb",
                minHeight: 30,
                transition: "border-color 0.15s, background 0.15s",
              }}>
                {inputText || "Type a message…"}
              </div>
              <div style={{
                width: 26, height: 26,
                background: "#0a0a0a",
                opacity: inputText ? 1 : 0.3,
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "opacity 0.15s",
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                  <path d="M22 2L11 13M22 2 15 22 11 13 2 9l20-7z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Bubble */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "#0a0a0a",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pop-in {
          from { opacity: 0; transform: scale(0.9) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes msg-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-dot {
          0%,60%,100% { transform: translateY(0); }
          30%          { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
