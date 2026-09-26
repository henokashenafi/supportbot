import Link from "next/link";
import HeroDemo from "./HeroDemo";

export default function LandingPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#fff",
      color: "#0a0a0a",
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── NAV ─────────────────────────────────────────── */}
      <header style={{
        padding: "0 40px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #e8e8e8",
        overflow: "visible",
        position: "relative",
        zIndex: 10,
      }}>
        {/* Logo overflows the nav bar — bigger without pushing height */}
        <Link href="/" style={{ display: "inline-block", textDecoration: "none", lineHeight: 0 }}>
          <img
            src="/supportbot-logo-headset.svg"
            alt="SupportBot"
            style={{ height: 80, width: "auto", display: "block" }}
          />
        </Link>

        <Link href="/try" style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.12em",
          textTransform: "uppercase", color: "#fff",
          background: "#0a0a0a", padding: "10px 22px",
          textDecoration: "none",
          borderRadius: 999,
        }}>
          Try for free
        </Link>
      </header>

      {/* ── HERO ────────────────────────────────────────── */}
      <main style={{ flex: 1 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: "calc(100vh - 109px)",
        }} className="hero-grid">

          {/* ── LEFT — copy + steps ────────────────────── */}
        <div style={{
            padding: "64px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            borderRight: "1px solid #e8e8e8",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F97316" }} />
                <p style={{
                  fontSize: 9, fontWeight: 600, letterSpacing: "0.2em",
                  textTransform: "uppercase", color: "#4338CA", margin: 0,
                }}>
                  AI Customer Support
                </p>
              </div>

              <h1 style={{
                fontSize: "clamp(26px, 3vw, 44px)",
                fontWeight: 800, lineHeight: 1.08,
                letterSpacing: "-0.03em",
                marginBottom: 18, maxWidth: 380,
                color: "#0a0a0a",
              }}>
                Add AI support to your website.{" "}
                <span style={{ color: "#4338CA" }}>In 60 seconds.</span>
              </h1>

              <p style={{
                fontSize: 13, color: "#666",
                lineHeight: 1.8, maxWidth: 300, marginBottom: 36,
              }}>
                Paste your FAQ. Get a chatbot that answers customers
                24/7 trained on your content, free, no account needed.
              </p>

              <Link href="/try" style={{
                fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "#4338CA",
                textDecoration: "none",
                borderBottom: "1.5px solid #4338CA", paddingBottom: 3,
              }}>
                Generate my widget →
              </Link>
            </div>

            {/* How it works */}
            <div style={{ marginTop: 56, marginLeft: 48 }}>
              <p style={{
                fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase",
                color: "#aaa", marginBottom: 18,
              }}>
                How it works
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  ["01", "Paste your FAQ or docs into the text box"],
                  ["02", "Click Launch — see your widget appear instantly"],
                  ["03", "Copy the script tag and paste it into your website"],
                ].map(([n, t]) => (
                  <div key={n} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.02em",
                      color: "#fff", flexShrink: 0,
                      background: n === "03" ? "#F97316" : "#4338CA",
                      width: 20, height: 20, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{n}</span>
                    <span style={{ fontSize: 12, color: "#555", lineHeight: 1.65 }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT — live animated demo ─────────────── */}
          <HeroDemo />
        </div>
      </main>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid #e8e8e8",
        padding: "18px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <span style={{ fontSize: 10, color: "#bbb" }}>© SupportBot 2025</span>
        <Link href="/try" style={{
          fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
          color: "#0a0a0a", textDecoration: "none",
          border: "1.5px solid #0a0a0a", padding: "8px 20px",
          fontWeight: 600, borderRadius: 999,
        }}>
          Generate widget →
        </Link>
        <span style={{ fontSize: 10, color: "#999", letterSpacing: "0.04em" }}>Made by Henok Ashenafi</span>
      </footer>

      <style>{`
        @media (max-width: 680px) {
          .hero-grid { grid-template-columns: 1fr !important; min-height: unset !important; }
        }
      `}</style>
    </div>
  );
}
