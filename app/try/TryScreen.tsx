"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";

interface Msg { role: "user" | "bot"; text: string; ts: string; }
type Phase = "setup" | "launching" | "live";

const PRESETS = ["#0a0a0a","#1e40af","#15803d","#dc2626","#7c3aed","#d97706","#0e7490","#475569"];

const DEFAULT_KB = `Q: What are your business hours?
A: We're open Monday–Friday, 9 AM to 5 PM EST.

Q: Do you offer refunds?
A: Yes, we offer a 30-day money-back guarantee on all plans.

Q: How do I contact support?
A: Email us at support@yourcompany.com or use this chat.

Q: What payment methods do you accept?
A: We accept all major credit cards, PayPal, and bank transfers.`;

const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  width: "100%", border: "1px solid #e8e8e8",
  padding: "9px 12px", fontSize: 13,
  color: "#0a0a0a", background: "#fff",
  outline: "none", fontFamily: "inherit",
  borderRadius: 8, ...extra,
});

const lbl: React.CSSProperties = {
  display: "block", fontSize: 9.5, fontWeight: 600,
  letterSpacing: "0.13em", textTransform: "uppercase",
  color: "#888", marginBottom: 6,
};

const TABS = ["html","gtm","wp","shopify"] as const;
const TAB_LABELS = { html:"HTML", gtm:"Tag Manager", wp:"WordPress", shopify:"Shopify" };
const STEPS: Record<string, string[]> = {
  html:    ["Open your HTML file.", "Paste the snippet just before the closing </body> tag.", "Save and deploy."],
  gtm:     ["In Tag Manager: Tags → New → Custom HTML.", "Paste snippet, set trigger to All Pages.", "Submit and publish."],
  wp:      ["Appearance → Theme Editor → footer.php.", "Paste snippet before </body>.", "Click Update File."],
  shopify: ["Online Store → Themes → Edit Code → theme.liquid.", "Paste snippet before </body>.", "Save."],
};

export default function TryScreen() {
  const [botName,        setBotName]        = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("Hi there 👋 How can I help you today?");
  const [brandColor,     setBrandColor]     = useState("#0a0a0a");
  const [knowledgeBase,  setKnowledgeBase]  = useState(DEFAULT_KB);

  const [phase,     setPhase]    = useState<Phase>("setup");
  const [widgetId,  setWidgetId] = useState<string | null>(null);
  const [launchMsg, setLaunchMsg]= useState("");

  const [chatOpen,    setChatOpen]    = useState(false);
  const [messages,    setMessages]    = useState<Msg[]>([]);
  const [inputText,   setInputText]   = useState("");
  const [isTyping,    setIsTyping]    = useState(false);
  const [chatHistory, setChatHistory] = useState<{role:"user"|"assistant";content:string}[]>([]);

  const [showEmbed, setShowEmbed] = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [activeTab, setActiveTab] = useState<string>("html");

  const msgEndRef    = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  useEffect(() => { if (chatOpen) setTimeout(() => chatInputRef.current?.focus(), 200); }, [chatOpen]);

  const ts = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  const origin   = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const embedCode = widgetId
    ? `<script src="${origin}/widget.js" data-widget-id="${widgetId}"><\/script>`
    : "";

  // ── Launch ──────────────────────────────────────────────────────────────────
  const handleLaunch = async () => {
    if (!botName.trim() || !knowledgeBase.trim()) return;
    setPhase("launching"); setLaunchMsg("Saving configuration…");
    try {
      const res = await fetch("/api/widgets", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botName, welcomeMessage, brandColor, knowledgeBase }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setWidgetId(data.id);

      // Track widget creation event — visible in Vercel Analytics
      track("widget_created", { botName, brandColor });

      for (const [msg, delay] of [
        ["Training on your knowledge base…", 800],
        ["Styling the widget…",              700],
        ["Going live…",                      500],
      ] as [string, number][]) {
        await new Promise(r => setTimeout(r, delay));
        setLaunchMsg(msg);
      }
      await new Promise(r => setTimeout(r, 400));

      setMessages([{ role: "bot", text: welcomeMessage, ts: ts() }]);
      setChatHistory([]);
      setPhase("live");
      setTimeout(() => setChatOpen(true), 500);
      setTimeout(() => setShowEmbed(true), 2000);
    } catch {
      setLaunchMsg("Something went wrong. Please try again.");
      setTimeout(() => setPhase("setup"), 1800);
    }
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isTyping || !widgetId) return;
    setInputText("");
    setMessages(p => [...p, { role: "user", text, ts: ts() }]);
    const hist = [...chatHistory, { role: "user" as const, content: text }];
    setChatHistory(hist);
    setIsTyping(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgetId, message: text, history: hist.slice(-10,-1) }),
      });
      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't respond right now.";
      setMessages(p => [...p, { role: "bot", text: reply, ts: ts() }]);
      setChatHistory(p => [...p, { role: "assistant", content: reply }]);
    } catch {
      setMessages(p => [...p, { role: "bot", text: "Having trouble responding. Please try again.", ts: ts() }]);
    } finally { setIsTyping(false); }
  }, [inputText, isTyping, widgetId, chatHistory]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(embedCode); } catch { /**/ }
    track("embed_code_copied");
    // Also increment server-side counter
    fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "embed_copied" }),
    }).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setPhase("setup"); setWidgetId(null); setChatOpen(false);
    setMessages([]); setShowEmbed(false); setChatHistory([]);
    setBotName(""); setKnowledgeBase(DEFAULT_KB);
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:"100vh", background:"#fff", fontFamily:"'Helvetica Neue',Helvetica,Arial,sans-serif", color:"#0a0a0a", display:"flex", flexDirection:"column" }}>

      {/* ── nav ──────────────────────────────────────────────────────────── */}
      <header style={{
        padding:"0 40px", height:56,
        borderBottom:"1px solid #e8e8e8",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        position:"sticky", top:0, zIndex:50, background:"#fff", flexShrink:0,
        overflow:"visible",
      }}>
        <Link href="/" style={{ display: "inline-block", textDecoration: "none", lineHeight: 0 }}>
          <img
            src="/supportbot-logo-headset.svg"
            alt="SupportBot"
            style={{ height: 76, width: "auto", display: "block" }}
          />
        </Link>

        <div style={{ display:"flex", gap:16, alignItems:"center" }}>
          {phase === "live" && (
            <button onClick={reset} style={{
              fontSize:9.5, letterSpacing:"0.1em", textTransform:"uppercase",
              color:"#888", background:"none", border:"1.5px solid #e8e8e8",
              padding:"6px 18px", cursor:"pointer", fontFamily:"inherit",
              borderRadius:999,
            }}>
              ← Start over
            </button>
          )}
        </div>
      </header>

      {/* ── step bar ─────────────────────────────────────────────────────── */}
      <div style={{
        padding:"12px 40px", borderBottom:"1px solid #f0f0f0",
        display:"flex", gap:20, alignItems:"center", flexShrink:0,
      }}>
        {(["setup","launching","live"] as Phase[]).map((p, i) => {
          const all: Phase[] = ["setup","launching","live"];
          const curr = all.indexOf(phase);
          const idx  = all.indexOf(p);
          return (
            <div key={p} style={{ display:"flex", alignItems:"center", gap:10 }}>
              {i > 0 && <span style={{ color:"#ddd", fontSize:11 }}>→</span>}
              <span style={{
                fontSize:9.5, letterSpacing:"0.12em", textTransform:"uppercase",
                fontWeight: idx === curr ? 700 : 400,
                color: idx < curr ? "#0a0a0a" : idx === curr ? "#0a0a0a" : "#ccc",
              }}>
                {idx < curr ? "✓ " : ""}{["Configure","Launching","Live"][i]}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── main split ───────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", flex:1 }} className="try-grid">

        {/* ══ LEFT — form ══════════════════════════════════════════════════ */}
        <div style={{ borderRight:"1px solid #e8e8e8", padding:"32px 32px 48px", overflowY:"auto" }}>

          <h2 style={{ fontSize:16, fontWeight:800, letterSpacing:"-0.02em", marginBottom:4 }}>
            {phase === "live" ? "Your widget is live" : "Configure your widget"}
          </h2>
          <p style={{ fontSize:11.5, color:"#888", marginBottom:28, lineHeight:1.65 }}>
            {phase === "live"
              ? "Try chatting on the right. Then copy the code below."
              : "Free no account required. Fill in your details and launch."}
          </p>

          {/* ── SETUP FORM ── */}
          {phase !== "live" && (
            <form onSubmit={e => { e.preventDefault(); handleLaunch(); }}>

              {/* identity */}
              <div style={{ marginBottom:24, paddingBottom:24, borderBottom:"1px solid #f0f0f0" }}>
                <p style={{ ...lbl, color:"#bbb", marginBottom:14 }}>Bot identity</p>
                <div style={{ marginBottom:14 }}>
                  <label style={lbl} htmlFor="bn">Bot name *</label>
                  <input id="bn" type="text" value={botName}
                    onChange={e => setBotName(e.target.value)}
                    placeholder="e.g. Acme Support" required maxLength={60}
                    disabled={phase==="launching"} style={inp()}
                    onFocus={e => e.target.style.borderColor="#0a0a0a"}
                    onBlur={e  => e.target.style.borderColor="#e8e8e8"}
                  />
                </div>
                <div>
                  <label style={lbl} htmlFor="wm">Welcome message</label>
                  <input id="wm" type="text" value={welcomeMessage}
                    onChange={e => setWelcomeMessage(e.target.value)}
                    placeholder="Hi there! How can I help?" maxLength={200}
                    disabled={phase==="launching"} style={inp()}
                    onFocus={e => e.target.style.borderColor="#0a0a0a"}
                    onBlur={e  => e.target.style.borderColor="#e8e8e8"}
                  />
                </div>
              </div>

              {/* color */}
              <div style={{ marginBottom:24, paddingBottom:24, borderBottom:"1px solid #f0f0f0" }}>
                <p style={{ ...lbl, color:"#bbb", marginBottom:12 }}>Brand color</p>
                <div style={{ display:"flex", gap:6, marginBottom:10 }}>
                  {PRESETS.map(c => (
                    <button key={c} type="button" onClick={() => setBrandColor(c)} style={{
                      width:26, height:26, background:c, border:"none",
                      cursor:"pointer", padding:0,
                      borderRadius: "50%",
                      boxShadow: brandColor===c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : "none",
                    }}/>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <span style={{ width:24, height:24, background:brandColor, display:"inline-block", flexShrink:0, border:"1px solid rgba(0,0,0,0.08)" }}/>
                  <input type="text" value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    style={inp({ width:110, fontFamily:"monospace", fontSize:12 })}
                    onFocus={e => e.target.style.borderColor="#0a0a0a"}
                    onBlur={e  => e.target.style.borderColor="#e8e8e8"}
                  />
                </div>
              </div>

              {/* knowledge base */}
              <div style={{ marginBottom:24 }}>
                <p style={{ ...lbl, color:"#bbb", marginBottom:6 }}>Knowledge base *</p>
                <p style={{ fontSize:11, color:"#aaa", lineHeight:1.7, marginBottom:10 }}>
                  Paste your FAQ, product docs, or any text. The AI will only answer from this content.
                </p>
                <textarea value={knowledgeBase}
                  onChange={e => setKnowledgeBase(e.target.value)}
                  required rows={11} disabled={phase==="launching"}
                  maxLength={15000}
                  style={inp({ lineHeight:1.75, resize:"vertical", fontFamily:"monospace", fontSize:11.5 })}
                  onFocus={e => e.target.style.borderColor="#0a0a0a"}
                  onBlur={e  => e.target.style.borderColor="#e8e8e8"}
                />
                <p style={{ fontSize:10, color:"#ccc", textAlign:"right", marginTop:4 }}>
                  {knowledgeBase.length.toLocaleString()} chars
                </p>
              </div>

              {/* button */}
              <button type="submit"
                disabled={phase==="launching" || !botName.trim() || !knowledgeBase.trim()}
                style={{
                  width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10,
                  background:"#0a0a0a", color:"#fff",
                  fontSize:10.5, fontWeight:600, letterSpacing:"0.12em", textTransform:"uppercase",
                  padding:"13px 20px", border:"none", cursor:"pointer",
                  opacity: (!botName.trim()||!knowledgeBase.trim()) ? 0.35 : 1,
                  fontFamily:"inherit",
                  borderRadius: 999,
                }}
              >
                {phase === "launching" ? (
                  <>
                    <svg style={{ animation:"spin 0.8s linear infinite" }} width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    {launchMsg}
                  </>
                ) : "Launch widget →"}
              </button>
            </form>
          )}

          {/* ── LIVE: summary + embed code ── */}
          {phase === "live" && (
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

              {/* summary */}
              <div style={{ border:"1px solid #e8e8e8", padding:"14px 16px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <span style={{ width:9, height:9, background:brandColor, display:"inline-block" }}/>
                  <strong style={{ fontSize:14, letterSpacing:"-0.01em" }}>{botName}</strong>
                  <span style={{
                    marginLeft:"auto", fontSize:8.5, letterSpacing:"0.1em",
                    textTransform:"uppercase", color:"#16a34a",
                    background:"#f0fdf4", border:"1px solid #bbf7d0",
                    padding:"2px 8px", fontWeight:700,
                  }}>Live</span>
                </div>
                <p style={{ fontSize:12, color:"#666", margin:0, lineHeight:1.6 }}>
                  &ldquo;{welcomeMessage}&rdquo;
                </p>
              </div>

              {/* embed code — slides in after 2s */}
              {showEmbed && (
                <div style={{ animation:"slide-down 0.3s ease forwards" }}>
                  <p style={{ ...lbl, color:"#888", marginBottom:12 }}>
                    Paste this on your website
                  </p>

                  {/* code block */}
                  <div style={{ background:"#0a0a0a", marginBottom:16 }}>
                    <div style={{
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"9px 12px", borderBottom:"1px solid #1a1a1a",
                    }}>
                      <span style={{ fontSize:9, letterSpacing:"0.14em", textTransform:"uppercase", color:"rgba(255,255,255,0.25)" }}>
                        embed snippet
                      </span>
                      <button onClick={handleCopy} style={{
                        fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase",
                        fontWeight:600, cursor:"pointer", border:"1px solid",
                        padding:"3px 10px", fontFamily:"inherit",
                        ...(copied
                          ? { background:"#14532d", color:"#4ade80", borderColor:"#166534" }
                          : { background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.55)", borderColor:"rgba(255,255,255,0.1)" }),
                        borderRadius: 999,
                      }}>
                        {copied ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                    <pre style={{
                      margin:0, padding:"13px 14px",
                      fontSize:11, lineHeight:1.75, color:"#86efac",
                      fontFamily:"monospace", overflowX:"auto", whiteSpace:"pre",
                    }}>
                      <code>{embedCode}</code>
                    </pre>
                  </div>

                  {/* platform tabs */}
                  <div style={{ border:"1px solid #e8e8e8" }}>
                    <div style={{ display:"flex", borderBottom:"1px solid #e8e8e8", overflowX:"auto" }}>
                      {TABS.map(t => (
                        <button key={t} onClick={() => setActiveTab(t)} style={{
                          padding:"8px 14px", fontSize:9.5, fontWeight:600,
                          letterSpacing:"0.1em", textTransform:"uppercase",
                          color: activeTab===t ? "#0a0a0a" : "#bbb",
                          background: activeTab===t ? "#fff" : "#fafafa",
                          borderTop: "none",
                          borderLeft: "none",
                          borderRight: "none",
                          borderBottom: activeTab===t ? "1.5px solid #0a0a0a" : "1.5px solid transparent",
                          cursor:"pointer", whiteSpace:"nowrap",
                          marginBottom:-1, fontFamily:"inherit",
                          borderRadius: activeTab===t ? "6px 6px 0 0" : 6,
                        }}>
                          {TAB_LABELS[t]}
                        </button>
                      ))}
                    </div>
                    <ol style={{ padding:"14px 16px", margin:0, listStyle:"none", display:"flex", flexDirection:"column", gap:10 }}>
                      {STEPS[activeTab].map((s,i) => (
                        <li key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                          <span style={{
                            flexShrink:0, width:18, height:18,
                            background:"#0a0a0a", color:"#fff",
                            fontSize:8.5, fontWeight:700,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            marginTop:2, borderRadius:"50%",
                          }}>
                            {i+1}
                          </span>
                          <span style={{ fontSize:12, color:"#444", lineHeight:1.65 }}>{s}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <p style={{ fontSize:11, color:"#aaa", marginTop:14, lineHeight:1.65 }}>
                    That&apos;s it — no account, no setup fee. The widget is live anywhere you paste that snippet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══ RIGHT — fake demo website ════════════════════════════════════ */}
        <div style={{ display:"flex", flexDirection:"column", background:"#f5f5f5" }}>

          {/* browser chrome */}
          <div style={{ background:"#1a1a1a", padding:"10px 16px", display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            {["#ff5f57","#febc2e","#28c840"].map(c => (
              <span key={c} style={{ width:9, height:9, borderRadius:"50%", background:c }}/>
            ))}
            <div style={{ flex:1, background:"#2a2a2a", padding:"3px 10px", fontSize:11, color:"#555", marginLeft:8 }}>
              yourwebsite.com
            </div>
          </div>

          {/* fake website */}
          <div style={{ flex:1, background:"#fff", position:"relative", overflow:"hidden" }}>

            {/* fake nav */}
            <div style={{ borderBottom:"1px solid #e8e8e8", padding:"0 32px", height:48, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:20, height:20, background:"#0a0a0a" }}/>
                <span style={{ fontWeight:800, fontSize:13, letterSpacing:"-0.02em" }}>Acme Corp</span>
              </div>
              <div style={{ display:"flex", gap:20 }}>
                {["Product","Pricing","Docs"].map(i => (
                  <span key={i} style={{ fontSize:12, color:"#888" }}>{i}</span>
                ))}
              </div>
              <div style={{ background:"#0a0a0a", color:"#fff", fontSize:11, fontWeight:600, padding:"6px 14px" }}>
                Sign up
              </div>
            </div>

            {/* fake hero */}
            <div style={{ padding:"48px 40px 32px" }}>
              <p style={{ fontSize:9, letterSpacing:"0.2em", textTransform:"uppercase", color:"#bbb", marginBottom:14 }}>
                Platform — 01
              </p>
              <h2 style={{ fontSize:30, fontWeight:900, letterSpacing:"-0.03em", lineHeight:1.08, marginBottom:14, maxWidth:360 }}>
                Build something<br/>people love.
              </h2>
              <p style={{ fontSize:13, color:"#666", lineHeight:1.75, maxWidth:320, marginBottom:24 }}>
                The platform helping modern teams ship faster and support their customers around the clock.
              </p>
              <div style={{ display:"flex", gap:10 }}>
                <div style={{ background:"#0a0a0a", color:"#fff", fontSize:12, fontWeight:600, padding:"9px 18px" }}>
                  Get started
                </div>
                <div style={{ border:"1px solid #e8e8e8", color:"#444", fontSize:12, padding:"9px 18px" }}>
                  Learn more
                </div>
              </div>

              {/* feature grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginTop:32, maxWidth:460 }}>
                {[["⚡","Fast"],["🔒","Secure"],["📊","Analytics"]].map(([icon,title]) => (
                  <div key={title} style={{ border:"1px solid #efefef", padding:"14px 14px 12px" }}>
                    <div style={{ fontSize:16, marginBottom:6 }}>{icon}</div>
                    <div style={{ fontSize:11.5, fontWeight:700 }}>{title}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* overlay — pre-launch */}
            {phase !== "live" && (
              <div style={{
                position:"absolute", inset:0,
                background:"rgba(255,255,255,0.75)",
                backdropFilter:"blur(3px)",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                <div style={{ border:"1px solid #e8e8e8", background:"#fff", padding:"32px 36px", textAlign:"center", maxWidth:280 }}>
                  {phase === "launching" ? (
                    <>
                      <svg style={{ animation:"spin 0.8s linear infinite", margin:"0 auto 16px", display:"block" }}
                        width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#e8e8e8" strokeWidth="3"/>
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                      <p style={{ fontSize:13, fontWeight:700, letterSpacing:"-0.01em", marginBottom:4 }}>{launchMsg}</p>
                      <p style={{ fontSize:11.5, color:"#aaa" }}>Just a moment…</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize:9, letterSpacing:"0.16em", textTransform:"uppercase", color:"#bbb", marginBottom:12 }}>
                        Widget
                      </p>
                      <p style={{ fontSize:13, fontWeight:700, letterSpacing:"-0.01em", marginBottom:8 }}>
                        Your widget appears here
                      </p>
                      <p style={{ fontSize:12, color:"#888", lineHeight:1.7 }}>
                        Fill in the form and click <strong>Launch widget</strong> to see it live on this demo site.
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── live widget ── */}
            {phase === "live" && (
              <div style={{ position:"absolute", bottom:20, right:20 }}>

                {/* chat window */}
                {chatOpen && (
                  <div style={{
                    width:300, marginBottom:10,
                    background:"#fff", overflow:"hidden",
                    boxShadow:"0 12px 40px rgba(0,0,0,0.12)",
                    animation:"fade-up 0.22s ease forwards",
                  }}>
                    {/* header */}
                    <div style={{ background:brandColor, padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                        <div style={{ width:30, height:30, borderRadius:"50%", background:"rgba(255,255,255,0.18)", border:"1px solid rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                        </div>
                        <div>
                          <p style={{ margin:0, fontSize:12, fontWeight:700, color:"#fff" }}>{botName}</p>
                          <p style={{ margin:0, fontSize:9.5, color:"rgba(255,255,255,0.6)", display:"flex", alignItems:"center", gap:4 }}>
                            <span style={{ width:5, height:5, borderRadius:"50%", background:"#4ade80", display:"inline-block" }}/>
                            Online
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setChatOpen(false)} style={{ background:"rgba(255,255,255,0.15)", border:"none", cursor:"pointer", width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>

                    {/* messages */}
                    <div style={{ height:230, overflowY:"auto", padding:"12px", display:"flex", flexDirection:"column", gap:8 }}>
                      {messages.map((m,i) => (
                        <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:m.role==="user"?"flex-end":"flex-start", gap:2 }}>
                          <div style={{
                            maxWidth:"82%", padding:"9px 12px", fontSize:12.5, lineHeight:1.55,
                            background: m.role==="user" ? brandColor : "#f3f3f3",
                            color: m.role==="user" ? "#fff" : "#0a0a0a",
                            borderRadius: m.role==="user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                            wordBreak:"break-word", whiteSpace:"pre-wrap",
                          }}>
                            {m.text}
                          </div>
                          <span style={{ fontSize:9, color:"#ccc", padding:"0 2px" }}>{m.ts}</span>
                        </div>
                      ))}
                      {isTyping && (
                        <div style={{ alignSelf:"flex-start", background:"#f3f3f3", borderRadius:"10px 10px 10px 2px", padding:"11px 13px", display:"flex", gap:4 }}>
                          {[0,1,2].map(i => (
                            <span key={i} style={{ width:5, height:5, borderRadius:"50%", background:"#bbb", display:"inline-block", animation:`bounce-dot 1.2s ${i*0.16}s infinite ease-in-out` }}/>
                          ))}
                        </div>
                      )}
                      <div ref={msgEndRef}/>
                    </div>

                    {/* input */}
                    <div style={{ padding:"8px 10px 10px", borderTop:"1px solid #f0f0f0", background:"#fff" }}>
                      <div style={{
                        display:"flex", alignItems:"flex-end", gap:7,
                        border:`1.5px solid ${inputText ? brandColor : "#e8e8e8"}`,
                        padding:"7px 7px 7px 11px", background: inputText ? "#fff" : "#fafafa",
                        transition:"border-color 0.15s",
                      }}>
                        <textarea
                          ref={chatInputRef}
                          value={inputText}
                          onChange={e => {
                            setInputText(e.target.value);
                            e.target.style.height="auto";
                            e.target.style.height=Math.min(e.target.scrollHeight,80)+"px";
                          }}
                          onKeyDown={handleKeyDown}
                          placeholder="Type a message…"
                          rows={1}
                          disabled={isTyping}
                          style={{ flex:1, border:"none", background:"transparent", fontSize:12.5, color:"#0a0a0a", resize:"none", outline:"none", minHeight:20, maxHeight:80, lineHeight:1.55, fontFamily:"inherit" }}
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!inputText.trim()||isTyping}
                          style={{
                            width:28, height:28, background:brandColor,
                            border:"none", cursor:(!inputText.trim()||isTyping)?"default":"pointer",
                            opacity:(!inputText.trim()||isTyping)?0.35:1,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            flexShrink:0, transition:"opacity 0.15s",
                            borderRadius: 999,
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                            <path d="M22 2L11 13M22 2 15 22 11 13 2 9l20-7z"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* floating bubble */}
                <div style={{ display:"flex", justifyContent:"flex-end" }}>
                  <button
                    onClick={() => setChatOpen(o => !o)}
                    style={{
                      width:48, height:48, borderRadius:"50%",
                      background:brandColor, border:"none", cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      boxShadow:"0 4px 16px rgba(0,0,0,0.18)",
                      transition:"transform 0.18s",                    }}
                  >
                    {chatOpen
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
                      : <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce-dot {
          0%,60%,100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 800px) {
          .try-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
