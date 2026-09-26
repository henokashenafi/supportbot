# AI Support Widget

A portfolio-quality SaaS product: an embeddable AI customer support chat widget that any business can add to their website with a single `<script>` tag.

Powered by **Google Gemini 1.5 Flash** and built with **Next.js 14+ (App Router)**.

---

## What it does

| Part | Description |
|---|---|
| **Dashboard** (`/dashboard`) | Configure your chatbot — set a name, welcome message, brand color, and paste a knowledge base (FAQ, docs, policies). Generates a widget ID and embed code. |
| **widget.js** | Embeddable vanilla JS script. Loads on any website via a `<script>` tag. Renders a floating chat bubble that expands into a polished chat window. |
| **AI backend** (`/api/chat`) | Accepts visitor messages, loads the widget's knowledge base, and sends a grounded prompt to Gemini. The bot only answers from your knowledge base. |
| **Demo page** (`/demo` or `/demo.html`) | A fake "external website" that embeds the widget, so you can prove it works end-to-end. |

---

## Tech stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4** — dashboard UI
- **Google Gemini 1.5 Flash** — AI responses
- **JSON file storage** (`/data/widgets.json`) — no database needed for v1
- **Vanilla JS** — the embeddable widget (zero dependencies, works on any site)

---

## Getting started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd ai-support-widget
npm install
```

### 2. Get a Gemini API key

1. Go to [https://ai.google.dev](https://ai.google.dev)
2. Sign in with your Google account
3. Click **"Get API key"** and create a new key (the free tier is sufficient)

### 3. Add your API key

Open `.env.local` (already created) and replace the placeholder:

```env
GEMINI_API_KEY=your_actual_key_here
```

> ⚠️ Never commit `.env.local` to version control. It's already in `.gitignore`.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage walkthrough

### Step 1 — Create a widget

1. Go to **[http://localhost:3000/dashboard](http://localhost:3000/dashboard)**
2. Click **"New widget"**
3. Fill in:
   - **Bot name** — e.g. `Acme Support`
   - **Welcome message** — what the bot says first
   - **Brand color** — pick a hex color (shown as the chat bubble color)
   - **Knowledge base** — paste your FAQ, product docs, or any text the AI should answer from
4. Click **"Create widget"**

### Step 2 — Get the embed code

After saving, you'll see an embed snippet like:

```html
<script src="http://localhost:3000/widget.js" data-widget-id="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"></script>
```

Paste this just before `</body>` on any website.

### Step 3 — Test it

- Open **[http://localhost:3000/demo](http://localhost:3000/demo)** — the built-in demo page automatically loads your most recently created widget.
- Or open **`/public/demo.html`** directly in a browser (replace `YOUR_WIDGET_ID` with a real ID from the dashboard first).

---

## Project structure

```
ai-support-widget/
├── app/
│   ├── api/
│   │   ├── chat/route.ts            # POST — AI chat endpoint
│   │   ├── widget-config/[id]/      # GET — public config (no KB)
│   │   └── widgets/
│   │       ├── route.ts             # GET list, POST create
│   │       └── [id]/route.ts        # GET, PUT, DELETE
│   ├── dashboard/
│   │   ├── layout.tsx               # Shared nav layout
│   │   ├── page.tsx                 # Widget list
│   │   ├── new/page.tsx             # Create form
│   │   └── [id]/
│   │       ├── page.tsx             # Detail + embed code
│   │       └── edit/page.tsx        # Edit form
│   ├── demo/page.tsx                # In-app demo page
│   └── page.tsx                     # Landing page
├── components/
│   ├── CopyButton.tsx               # Clipboard copy button
│   ├── EmbedCodeBlock.tsx           # Embed snippet display
│   └── WidgetForm.tsx               # Create/edit form
├── lib/
│   ├── storage.ts                   # JSON file read/write helpers
│   └── types.ts                     # Shared TypeScript interfaces
├── public/
│   ├── widget.js                    # ← The embeddable widget script
│   └── demo.html                    # Standalone demo page
├── data/
│   └── widgets.json                 # Auto-created; stores all configs
└── .env.local                       # ← Put your GEMINI_API_KEY here
```

---

## API reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/widgets` | List all widget configs |
| `POST` | `/api/widgets` | Create a new widget |
| `GET` | `/api/widgets/:id` | Get full widget config |
| `PUT` | `/api/widgets/:id` | Update a widget |
| `DELETE` | `/api/widgets/:id` | Delete a widget |
| `GET` | `/api/widget-config/:id` | **Public** — returns config without knowledge base (used by widget.js) |
| `POST` | `/api/chat` | Send a message and get an AI reply |

### Chat request body

```json
{
  "widgetId": "uuid",
  "message": "What are your business hours?",
  "history": [
    { "role": "user", "content": "Hi" },
    { "role": "assistant", "content": "Hi there! How can I help?" }
  ]
}
```

---

## How the AI grounding works

The `/api/chat` route builds a system prompt that tells Gemini:

1. Act as a support agent named `{botName}`
2. Answer **only** from the provided knowledge base text
3. If a question isn't covered, say so and offer to connect with a human

This prevents the AI from hallucinating or going off-topic.

---

## Deploying to production

1. Deploy to **Vercel** (recommended — zero config for Next.js):
   ```bash
   npx vercel
   ```
2. Add `GEMINI_API_KEY` in your Vercel project's environment variables.
3. Update the embed code domain from `localhost:3000` to your production URL.

---

## What's out of scope (v1)

- User authentication / multi-tenant accounts
- Payments or subscriptions
- Persisting chat history after page reload
- Production database (using JSON file for simplicity)

---

## License

MIT
