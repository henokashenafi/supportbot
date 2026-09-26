/**
 * AI Support Widget v2 — embeddable chat bubble
 *
 * Usage:
 *   <script src="https://your-domain.com/widget.js" data-widget-id="YOUR_WIDGET_ID"></script>
 *
 * Dependency-free vanilla JS. Injects its own fully scoped styles.
 * Works on any website regardless of framework or CSS library.
 */
(function () {
  "use strict";

  // ─── Locate script tag & widget ID ──────────────────────────────────────
  var scriptTag =
    document.currentScript ||
    (function () {
      var s = document.getElementsByTagName("script");
      return s[s.length - 1];
    })();

  var widgetId = scriptTag.getAttribute("data-widget-id");
  if (!widgetId) {
    console.warn("[AI Widget] No data-widget-id attribute found. Widget will not load.");
    return;
  }

  var scriptSrc = scriptTag.src || "";
  var baseUrl   = scriptSrc
    ? scriptSrc.replace(/\/widget\.js.*$/, "")
    : window.location.origin;

  // ─── State ───────────────────────────────────────────────────────────────
  var config  = null;
  var isOpen  = false;
  var isLoading = false;
  var history = [];   // [{ role: "user"|"assistant", content }]
  var msgCount = 0;   // for generating unique IDs

  // ─── Inject CSS ──────────────────────────────────────────────────────────
  function injectStyles(color) {
    // Derive a slightly darker shade for hover
    var style = document.createElement("style");
    style.id  = "ai-widget-styles";
    style.textContent = [
      "/* ── Reset & base ── */",
      "#ai-support-widget-root *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}",

      "/* ── Bubble ── */",
      "#ai-widget-bubble{",
        "position:fixed;bottom:24px;right:24px;",
        "width:58px;height:58px;border-radius:50%;",
        "background:" + color + ";",
        "box-shadow:0 4px 20px rgba(0,0,0,0.22),0 1px 4px rgba(0,0,0,0.12);",
        "border:none;cursor:pointer;",
        "display:flex;align-items:center;justify-content:center;",
        "z-index:2147483646;",
        "transition:transform 0.18s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.18s ease;",
        "outline:none;",
      "}",
      "#ai-widget-bubble:hover{transform:scale(1.10);box-shadow:0 8px 28px rgba(0,0,0,0.26)}",
      "#ai-widget-bubble:active{transform:scale(0.96)}",
      "#ai-widget-bubble:focus-visible{outline:3px solid " + color + "66;outline-offset:3px}",
      ".ai-widget-bubble-icon{",
        "width:26px;height:26px;",
        "transition:opacity 0.12s ease,transform 0.18s ease;",
        "position:absolute;",
      "}",

      "/* ── Window ── */",
      "#ai-widget-window{",
        "position:fixed;bottom:96px;right:24px;",
        "width:385px;max-width:calc(100vw - 20px);",
        "height:540px;max-height:calc(100vh - 112px);",
        "background:#fff;",
        "border-radius:18px;",
        "box-shadow:0 20px 60px rgba(0,0,0,0.16),0 4px 16px rgba(0,0,0,0.08);",
        "display:flex;flex-direction:column;",
        "overflow:hidden;",
        "z-index:2147483646;",
        "transform-origin:bottom right;",
      "}",
      "#ai-widget-window.ai-w-enter{animation:ai-pop-in 0.24s cubic-bezier(0.34,1.4,0.64,1) forwards}",
      "#ai-widget-window.ai-w-exit {animation:ai-pop-out 0.18s ease forwards}",
      "@keyframes ai-pop-in  {from{opacity:0;transform:scale(0.88) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}",
      "@keyframes ai-pop-out {from{opacity:1;transform:scale(1) translateY(0)}to{opacity:0;transform:scale(0.88) translateY(14px)}}",

      /* ── Mobile: near-full-width ── */
      "@media(max-width:440px){",
        "#ai-widget-window{",
          "width:calc(100vw - 16px);right:8px;bottom:80px;",
          "border-radius:16px;",
        "}",
        "#ai-widget-bubble{bottom:16px;right:16px}",
      "}",

      "/* ── Header ── */",
      "#ai-widget-header{",
        "background:" + color + ";",
        "padding:14px 16px;",
        "display:flex;align-items:center;justify-content:space-between;",
        "flex-shrink:0;",
        "position:relative;",
        "overflow:hidden;",
      "}",
      /* Subtle shine overlay */
      "#ai-widget-header::before{",
        "content:'';position:absolute;inset:0;",
        "background:linear-gradient(135deg,rgba(255,255,255,0.12) 0%,transparent 60%);",
        "pointer-events:none;",
      "}",
      "#ai-widget-header-left{display:flex;align-items:center;gap:10px;position:relative}",
      "#ai-widget-avatar{",
        "width:38px;height:38px;border-radius:50%;",
        "background:rgba(255,255,255,0.2);",
        "display:flex;align-items:center;justify-content:center;",
        "flex-shrink:0;",
        "border:1.5px solid rgba(255,255,255,0.25);",
      "}",
      "#ai-widget-avatar svg{width:20px;height:20px;fill:white}",
      "#ai-widget-bot-name{",
        "color:#fff;font-size:14px;font-weight:700;",
        "margin:0;letter-spacing:-0.01em;",
      "}",
      "#ai-widget-status{",
        "color:rgba(255,255,255,0.78);font-size:11.5px;",
        "margin:2px 0 0;",
        "display:flex;align-items:center;gap:5px;",
      "}",
      ".ai-status-dot{",
        "width:6px;height:6px;border-radius:50%;background:#4ade80;",
        "animation:ai-pulse 2s infinite;",
      "}",
      "@keyframes ai-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(0.85)}}",
      "#ai-widget-close-btn{",
        "background:rgba(255,255,255,0.18);",
        "border:none;cursor:pointer;",
        "border-radius:50%;width:30px;height:30px;",
        "display:flex;align-items:center;justify-content:center;",
        "transition:background 0.15s;padding:0;flex-shrink:0;",
        "position:relative;",
      "}",
      "#ai-widget-close-btn:hover{background:rgba(255,255,255,0.30)}",
      "#ai-widget-close-btn:active{background:rgba(255,255,255,0.15);transform:scale(0.92)}",
      "#ai-widget-close-btn svg{width:14px;height:14px;stroke:#fff;fill:none;stroke-width:2.5;stroke-linecap:round}",

      "/* ── Messages ── */",
      "#ai-widget-messages{",
        "flex:1;overflow-y:auto;",
        "padding:16px;",
        "display:flex;flex-direction:column;gap:10px;",
        "scroll-behavior:smooth;",
        "background:#fff;",
      "}",
      "#ai-widget-messages::-webkit-scrollbar{width:3px}",
      "#ai-widget-messages::-webkit-scrollbar-track{background:transparent}",
      "#ai-widget-messages::-webkit-scrollbar-thumb{background:#E2E8F0;border-radius:4px}",

      "/* Message bubbles */",
      ".ai-msg{",
        "max-width:82%;",
        "padding:10px 14px;",
        "font-size:13.5px;line-height:1.6;",
        "word-break:break-word;white-space:pre-wrap;",
        "animation:ai-msg-in 0.2s ease forwards;",
      "}",
      "@keyframes ai-msg-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}",

      ".ai-msg-bot{",
        "align-self:flex-start;",
        "background:#F1F5F9;",
        "color:#1E293B;",
        "border-radius:14px 14px 14px 4px;",
      "}",
      ".ai-msg-user{",
        "align-self:flex-end;",
        "background:" + color + ";",
        "color:#fff;",
        "border-radius:14px 14px 4px 14px;",
      "}",

      /* Timestamp shown on hover */
      ".ai-msg-wrap{display:flex;flex-direction:column;gap:2px}",
      ".ai-msg-wrap.ai-msg-wrap-user{align-items:flex-end}",
      ".ai-msg-wrap.ai-msg-wrap-bot{align-items:flex-start}",
      ".ai-msg-time{",
        "font-size:10.5px;color:#94A3B8;",
        "opacity:0;transition:opacity 0.15s;",
        "padding:0 4px;",
      "}",
      ".ai-msg-wrap:hover .ai-msg-time{opacity:1}",

      "/* ── Typing indicator ── */",
      "#ai-widget-typing{",
        "align-self:flex-start;",
        "background:#F1F5F9;",
        "border-radius:14px 14px 14px 4px;",
        "padding:12px 16px;",
        "display:flex;align-items:center;gap:5px;",
        "animation:ai-msg-in 0.2s ease forwards;",
      "}",
      ".ai-dot{",
        "width:7px;height:7px;",
        "background:#94A3B8;border-radius:50%;",
        "animation:ai-bounce 1.2s infinite ease-in-out;",
      "}",
      ".ai-dot:nth-child(1){animation-delay:0s}",
      ".ai-dot:nth-child(2){animation-delay:0.16s}",
      ".ai-dot:nth-child(3){animation-delay:0.32s}",
      "@keyframes ai-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}",

      "/* ── Footer / input ── */",
      "#ai-widget-footer{",
        "padding:10px 12px 12px;",
        "border-top:1px solid #F1F5F9;",
        "background:#fff;flex-shrink:0;",
      "}",
      "#ai-widget-input-row{",
        "display:flex;align-items:flex-end;gap:8px;",
        "background:#F8FAFC;",
        "border:1.5px solid #E2E8F0;",
        "border-radius:12px;",
        "padding:8px 8px 8px 14px;",
        "transition:border-color 0.15s,box-shadow 0.15s,background 0.15s;",
      "}",
      "#ai-widget-input-row:focus-within{",
        "border-color:" + color + ";",
        "box-shadow:0 0 0 3px " + color + "1a;",
        "background:#fff;",
      "}",
      "#ai-widget-input{",
        "flex:1;border:none;background:transparent;",
        "font-size:13.5px;color:#1E293B;",
        "resize:none;outline:none;",
        "min-height:22px;max-height:96px;",
        "padding:0;line-height:1.55;",
        "font-family:inherit;",
      "}",
      "#ai-widget-input::placeholder{color:#94A3B8}",
      "#ai-widget-send-btn{",
        "width:36px;height:36px;border-radius:9px;",
        "background:" + color + ";",
        "border:none;cursor:pointer;",
        "display:flex;align-items:center;justify-content:center;",
        "flex-shrink:0;transition:opacity 0.15s,transform 0.12s;",
        "padding:0;",
      "}",
      "#ai-widget-send-btn:disabled{opacity:0.38;cursor:default}",
      "#ai-widget-send-btn:not(:disabled):hover{opacity:0.86;transform:scale(1.07)}",
      "#ai-widget-send-btn:not(:disabled):active{transform:scale(0.95)}",
      "#ai-widget-send-btn svg{width:17px;height:17px;fill:#fff}",

      "#ai-widget-branding{",
        "text-align:center;font-size:11px;",
        "color:#CBD5E1;margin-top:6px;",
        "letter-spacing:0.01em;",
      "}",
    ].join("");
    document.head.appendChild(style);
  }

  // ─── Build DOM ───────────────────────────────────────────────────────────
  function buildWidget() {
    var root   = document.createElement("div");
    root.id    = "ai-support-widget-root";

    // ── Bubble ──
    var bubble = document.createElement("button");
    bubble.id  = "ai-widget-bubble";
    bubble.setAttribute("aria-label", "Open support chat");
    bubble.innerHTML = chatIcon();
    bubble.addEventListener("click", toggleChat);

    // ── Window ──
    var win = document.createElement("div");
    win.id  = "ai-widget-window";
    win.style.display = "none";
    win.setAttribute("role", "dialog");
    win.setAttribute("aria-label", "Support chat");
    win.setAttribute("aria-modal", "true");

    win.innerHTML =
      '<div id="ai-widget-header">' +
        '<div id="ai-widget-header-left">' +
          '<div id="ai-widget-avatar">' +
            '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
              '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' +
            '</svg>' +
          '</div>' +
          '<div>' +
            '<p id="ai-widget-bot-name">' + esc(config.botName) + '</p>' +
            '<p id="ai-widget-status"><span class="ai-status-dot"></span>Online</p>' +
          '</div>' +
        '</div>' +
        '<button id="ai-widget-close-btn" aria-label="Close chat">' +
          '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
        '</button>' +
      '</div>' +
      '<div id="ai-widget-messages" aria-live="polite" aria-label="Chat messages"></div>' +
      '<div id="ai-widget-footer">' +
        '<div id="ai-widget-input-row">' +
          '<textarea id="ai-widget-input" placeholder="Type a message…" rows="1" ' +
            'aria-label="Your message" maxlength="1000"></textarea>' +
          '<button id="ai-widget-send-btn" aria-label="Send message" disabled>' +
            '<svg viewBox="0 0 24 24"><path d="M22 2 11 13M22 2 15 22 11 13 2 9l20-7z"/></svg>' +
          '</button>' +
        '</div>' +
        '<p id="ai-widget-branding">Powered by AI Support Widget</p>' +
      '</div>';

    root.appendChild(bubble);
    root.appendChild(win);
    document.body.appendChild(root);

    // Wire events
    win.querySelector("#ai-widget-close-btn").addEventListener("click", toggleChat);

    var inputEl = win.querySelector("#ai-widget-input");
    var sendBtn = win.querySelector("#ai-widget-send-btn");

    inputEl.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = Math.min(this.scrollHeight, 96) + "px";
      sendBtn.disabled  = !this.value.trim() || isLoading;
    });
    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) sendMsg();
      }
    });
    sendBtn.addEventListener("click", sendMsg);

    // Welcome message
    appendMsg("bot", config.welcomeMessage);
  }

  // ─── Toggle open / close ─────────────────────────────────────────────────
  function toggleChat() {
    var win    = document.getElementById("ai-widget-window");
    var bubble = document.getElementById("ai-widget-bubble");
    if (!win) return;

    if (isOpen) {
      win.classList.remove("ai-w-enter");
      win.classList.add("ai-w-exit");
      win.addEventListener("animationend", function handler() {
        win.style.display = "none";
        win.classList.remove("ai-w-exit");
        win.removeEventListener("animationend", handler);
      }, { once: true });
    } else {
      win.style.display = "flex";
      win.style.flexDirection = "column";
      win.classList.remove("ai-w-exit");
      void win.offsetWidth; // force reflow so animation fires
      win.classList.add("ai-w-enter");
      setTimeout(function () {
        var inp = document.getElementById("ai-widget-input");
        if (inp) inp.focus();
      }, 240);
    }

    isOpen = !isOpen;

    // Swap bubble icon
    bubble.setAttribute("aria-label", isOpen ? "Close support chat" : "Open support chat");
    bubble.innerHTML = isOpen ? closeIcon() : chatIcon();
  }

  // ─── Append a message ────────────────────────────────────────────────────
  function appendMsg(role, text) {
    var container = document.getElementById("ai-widget-messages");
    if (!container) return;

    var now  = new Date();
    var time = now.getHours().toString().padStart(2,"0") + ":" +
               now.getMinutes().toString().padStart(2,"0");

    var wrap = document.createElement("div");
    wrap.className = "ai-msg-wrap " + (role === "bot" ? "ai-msg-wrap-bot" : "ai-msg-wrap-user");

    var bubble = document.createElement("div");
    bubble.className = "ai-msg " + (role === "bot" ? "ai-msg-bot" : "ai-msg-user");
    bubble.id = "ai-msg-" + (++msgCount);
    bubble.textContent = text;

    var ts = document.createElement("span");
    ts.className = "ai-msg-time";
    ts.textContent = time;

    wrap.appendChild(bubble);
    wrap.appendChild(ts);
    container.appendChild(wrap);
    container.scrollTop = container.scrollHeight;
    return bubble;
  }

  // ─── Typing indicator ────────────────────────────────────────────────────
  function showTyping() {
    var container = document.getElementById("ai-widget-messages");
    var el = document.createElement("div");
    el.id  = "ai-widget-typing";
    el.innerHTML = '<div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div>';
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }
  function hideTyping() {
    var el = document.getElementById("ai-widget-typing");
    if (el) el.remove();
  }

  // ─── Send message ────────────────────────────────────────────────────────
  function sendMsg() {
    var inputEl = document.getElementById("ai-widget-input");
    var sendBtn = document.getElementById("ai-widget-send-btn");
    var text    = inputEl.value.trim();
    if (!text || isLoading) return;

    inputEl.value    = "";
    inputEl.style.height = "auto";
    sendBtn.disabled = true;

    appendMsg("user", text);
    history.push({ role: "user", content: text });

    isLoading = true;
    showTyping();

    fetch(baseUrl + "/api/chat", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        widgetId: widgetId,
        message:  text,
        history:  history.slice(-10, -1),
      }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        hideTyping();
        var reply = data.reply || "Sorry, I couldn't generate a response.";
        appendMsg("bot", reply);
        history.push({ role: "assistant", content: reply });
      })
      .catch(function () {
        hideTyping();
        appendMsg("bot", "Sorry, I'm having trouble responding right now. Please try again in a moment.");
      })
      .finally(function () {
        isLoading = false;
        var inp = document.getElementById("ai-widget-input");
        var btn = document.getElementById("ai-widget-send-btn");
        if (inp && btn) btn.disabled = !inp.value.trim();
        if (inp) inp.focus();
      });
  }

  // ─── Icon helpers ────────────────────────────────────────────────────────
  function chatIcon() {
    return '<svg class="ai-widget-bubble-icon" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' +
    '</svg>';
  }
  function closeIcon() {
    return '<svg class="ai-widget-bubble-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M18 6 6 18M6 6l12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>' +
    '</svg>';
  }

  // ─── Escape HTML ─────────────────────────────────────────────────────────
  function esc(s) {
    return String(s)
      .replace(/&/g,"&amp;").replace(/</g,"&lt;")
      .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  // ─── Boot ────────────────────────────────────────────────────────────────
  function init() {
    fetch(baseUrl + "/api/widget-config/" + widgetId)
      .then(function (r) {
        if (!r.ok) throw new Error("Config not found (" + r.status + ")");
        return r.json();
      })
      .then(function (data) {
        config = data;
        injectStyles(config.brandColor);
        buildWidget();
      })
      .catch(function (e) {
        console.error("[AI Widget] Failed to load config:", e);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
