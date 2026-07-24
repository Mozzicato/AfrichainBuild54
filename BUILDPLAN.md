# Africhain — Build Plan

**The AI operating system for Africa's informal businesses.**
Talk to your business in your own language. It keeps your books, tracks your debts, runs your team, and tells you today's market prices.

---

## 1. Refined solution

The original PRD is strong but wide. For a 24-hour hackathon we win by nailing **one unforgettable demo loop**, not by shipping every pillar.

### The core insight
Every feature is the same primitive: **a person speaks in their own language, and the system turns that speech into a correct business action or answer.** Sale, expense, debt, task, market query — all of it is "voice → intent → action." Build that pipeline once, brilliantly, and every feature is a thin layer.

So the architecture is a single **AI intent router**: Claude (`claude-opus-4-8`) receives the raw transcript in any of 5 languages and, via tool-use, decides which business action to take and with what structured arguments. No forms. No menus. No language toggle.

### What makes judges remember it
1. **It understands Pidgin/Yoruba/Hausa/Igbo, not just English.** "I sell five basket of tomato for two thousand" → a recorded sale. "Who dey owe me?" → the debt list, read back aloud.
2. **AMIN — Africhain Market Intelligence Network.** "How much yam dey for Sokoto today?" → price comparison across markets + buy/sell recommendation. This turns "bookkeeping app" into "operating system for commerce."
3. **The AI Coach** proactively surfaces a data-driven insight — proof the data compounds into intelligence.

### Scope discipline (MVP vs Vision — say this to judges)
- **MVP (built in 24h, real & working):** voice capture, AI intent routing, sales/expense/debt recording, balances & daily summary, Oga Tasks, AMIN price lookup on curated data, AI Coach insight.
- **Vision (architected for, honestly labelled):** nationwide live price ingestion, predictive intelligence, lending/insurance, pan-African languages. The AMIN data layer sits behind a `MarketSource` interface so swapping curated data for live feeds is a data-source change, not a rewrite.

---

## 2. Architecture

```
Browser (mic)                 Next.js API routes                 Claude
─────────────                 ──────────────────                 ──────
Web Speech STT ──transcript──►  /api/agent  ──tool-use prompt──►  claude-opus-4-8
                                    │  ◄──── tool call (record_sale, query_business, market_lookup, …)
                                    │
                                    ├─ executes tool against JSON store  (lib/store.ts)
                                    ├─ AMIN lookups via market source     (lib/market.ts — swappable)
                                    └─ returns { reply, state }
Web Speech TTS ◄──reply─────────────┘
```

- **`lib/store.ts`** — JSON persistence (sales, expenses, debts, tasks). Best-effort disk + in-memory. Zero native deps.
- **`lib/market.ts`** — `MarketSource` interface + `CuratedMarketSource`. Live feeds slot in later behind the same interface.
- **`lib/agent.ts`** — Claude tool definitions + run loop. The one place intelligence lives.
- **`app/api/agent/route.ts`** — POST transcript → run agent → return reply + fresh state.
- **`app/page.tsx`** — the whole product: mic button, transcript, conversation log, dashboard, market panel, coach card.

---

## 3. Tools Claude can call (the intent surface)

| Tool | Fires on (any language) | Effect |
|---|---|---|
| `record_sale` | "I sell 5 basket tomato for 2000" | add sale, update revenue |
| `record_expense` | "Add fuel expense 1500" | add expense |
| `record_debt` | "Mama Nkechi never pay me 3000" | add customer debt |
| `settle_debt` | "Nkechi don pay 1000" | reduce debt |
| `assign_task` | "Tell Musa to sweep the shop" | add Oga Task |
| `complete_task` | "Musa don finish sweeping" | mark task done |
| `query_business` | "How business dey?" / "who dey owe me?" | read summary / debts / tasks |
| `market_lookup` | "How much yam for Sokoto today?" | AMIN price compare + recommendation |
| `get_coach_insight` | "Any advice?" | one data-driven tip |

Claude replies in the **same language/register** the user used, so the UI updates and the phone talks back naturally.

---

## 4. Hour-by-hour (24h)

| Block | Hours | Deliverable |
|---|---|---|
| Setup | 0–1 | Next.js scaffold, Tailwind, `ANTHROPIC_API_KEY` |
| Data layer | 1–3 | `store.ts` (CRUD + seed), `market.ts` (AMIN dataset) |
| Agent core | 3–7 | `agent.ts` tools + loop; `/api/agent` route |
| Voice UI | 7–11 | Mic (Web Speech STT), TTS reply, transcript + log |
| Dashboard | 11–15 | Balances, debts, tasks, market panel, coach — live |
| AMIN polish | 15–18 | Price compare visual, buy/sell recommendation |
| Coach + polish | 18–21 | Proactive insight, error handling, mobile, brand |
| Demo prep | 21–24 | Seed a believable business, rehearse, deploy, fallback recording |

---

## 5. Demo script (2.5 min, memorized)

1. Open on a pre-seeded trader dashboard. "This is Mama Ada's provision store."
2. Mic: **"I sell six paint of rice for nine thousand naira."** → sale appears; phone: "I don record 6 paint of rice, nine thousand naira. Today sales now …"
3. Mic: **"Mama Nkechi collect two bag of sugar, she never pay, na five thousand."** → debt appears.
4. Mic (Pidgin query): **"Who dey owe me?"** → phone reads the debt list aloud.
5. The money line — Mic: **"How much yam dey for Sokoto today?"** → AMIN panel: Sokoto ₦4,700 · Kano ₦5,200 · Abuja ₦6,100 → "Best place to buy na Sokoto."
6. Mic: **"Any advice for me?"** → Coach: data-driven tip.
7. Close on vision: AMIN becomes a national data network; freemium + market intelligence + embedded lending.

---

## 6. Tech decisions

- **Stack:** Next.js (App Router) + TS + Tailwind. One deployable.
- **Model:** `claude-opus-4-8` — strongest multilingual/informal understanding (the differentiator). Swap to `claude-sonnet-5` if latency bites.
- **Voice:** Web Speech API (browser). Free, instant, multi-language. Use Chrome. Text input is always available as a fallback so the demo never dies.
- **Storage:** JSON file store — reliable on Windows, no DB setup. Swappable for Postgres.
- **Market data:** curated seed behind `MarketSource` — honest "curated for demo, live-ready."

---

## Run it

```bash
# 1. Put your key in .env.local
ANTHROPIC_API_KEY=sk-ant-...
# 2.
npm run dev
# open http://localhost:3000 in Chrome
```
