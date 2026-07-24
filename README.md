# Africhain

**The AI operating system for Africa's informal businesses.**

Talk to your business in your own language. Africhain lets traders, food vendors, provision-store owners and artisans manage sales, debts, inventory and their team — and check live market prices — just by **speaking**, in English, Nigerian Pidgin, Yorùbá, Hausa or Igbo. No forms, no menus, no spreadsheets.

🔗 **Live demo:** https://africhain-build54.vercel.app

---

## The problem

Over 80% of businesses across many African economies operate informally. Most run on memory, paper notebooks or WhatsApp chats — leading to forgotten debts, poor records, inconsistent pricing and no real business insight. Existing accounting software assumes users are comfortable with forms and spreadsheets, which excludes millions of entrepreneurs.

## The idea

Every business action is the same primitive: **a person speaks, and the system turns that speech into a correct business action or answer.** Africhain is built around a single AI intent router — the model listens to natural, informal speech in any of five languages and, through tool-use, decides exactly what to do: record a sale, log a debt, assign a task, or look up today's market price.

---

## Features

- 🎙️ **Voice-first** — speak to record and query; Africhain replies out loud in the same language you used.
- 🌍 **5 languages** — English, Nigerian Pidgin, Yorùbá, Hausa, Igbo — and it understands informal trade units (basket, paint, bag, tuber, congo, mudu…).
- 📒 **Bookkeeping** — record sales and expenses; live revenue, profit and daily summaries.
- 🤝 **Debt tracking** — "who dey owe me?" — record credit and settle payments.
- 📦 **Inventory** — stock auto-decrements on each sale, with low-stock alerts.
- ✅ **Oga Tasks** — assign work to staff by voice and mark it done.
- 🧠 **AI Business Coach** — proactive, data-driven tips from your own records.
- 📊 **AMIN — Africhain Market Intelligence Network** — live commodity prices across markets, with buy/sell recommendations. Traders **crowdsource today's prices by voice**, so the network grows and self-corrects in real time.
- 📋 **Close of day** — one tap for a spoken summary of the day's business.

## How it works

```
Browser (mic)          Next.js API routes            LLM (tool-use)
────────────           ──────────────────            ──────────────
Web Speech STT ─text─►   /api/agent   ─prompt+tools─►  intent router
                            │  ◄── tool call (record_sale, market_lookup, …)
                            ├─ executes tool against the store / AMIN
                            └─ returns { reply, state, market }
Web Speech TTS ◄─reply──────┘
```

The intelligence lives in one place (`lib/agent.ts`), exposing the whole business as ~13 tools. AMIN sits behind a swappable `MarketSource` interface, so curated demo data can be replaced with live government/exchange feeds without touching the app.

## Tech stack

- **Next.js (App Router) + TypeScript + Tailwind CSS v4**
- **LLM via a provider-agnostic, OpenAI-compatible layer** (OpenRouter / Gemini / Groq / Mistral) — switchable with one env var
- **Web Speech API** for in-browser speech-to-text and text-to-speech
- JSON-backed store (no external DB required for the demo)
- Deployed on **Vercel**

---

## Run locally

```bash
# 1. Install
npm install

# 2. Add your key(s) — copy .env.local.example and fill in at least one:
#    OPENROUTER_API_KEY=...   (default provider)
#    GEMINI_API_KEY / GROQ_API_KEY / MISTRAL_API_KEY   (optional)
#    AI_PROVIDER=openrouter   AI_MODEL=google/gemini-2.5-flash   (optional overrides)

# 3. Run
npm run dev
```

Open **http://localhost:3000** in **Chrome** (best Web Speech support). Try:

- *"I sell six paint of rice for nine thousand naira"*
- *"Who dey owe me?"*
- *"How much yam dey for Sokoto today?"*
- *"Yam na five thousand two hundred for Kano today"* (feeds AMIN live)

---

## Roadmap

- **Now (MVP):** voice bookkeeping, debts, inventory, Oga Tasks, AMIN price lookup + crowdsourced reports, AI Coach.
- **Next:** live AMIN feeds (government data, agricultural exchanges), group buying (pool demand to unlock wholesale prices), WhatsApp/SMS channel.
- **Vision:** predictive market intelligence, embedded lending & insurance on trusted business records — pan-African.

---

## The team

Built at UNILAG 🎓

| Name | Institution | Role |
|------|-------------|------|
| **Ayinde Wisdom** | UNILAG | Software Developer |
| **Salaudeen Mubarak** | UNILAG | Software Developer |
| **Muqodeem Aliyu** | UNILAG | Web Developer |

---

*Africhain — because managing your business should be as simple as talking to a trusted friend.*
