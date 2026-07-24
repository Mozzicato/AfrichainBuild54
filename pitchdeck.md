# Africhain Pitch Deck

## Slide 1: Title

**Africhain**

The voice-first operating system for Africa's informal traders.

**One-liner:** A trader speaks naturally, and Africhain updates sales, debts, inventory, receipts, and live market intelligence.

---

## Slide 2: The Problem

Africa's informal traders run huge portions of local commerce, but most still manage business memory in their head, paper notes, WhatsApp chats, and scattered voice messages.

This creates three painful gaps:

- **Lost records:** Sales, debts, expenses, and stock changes are easy to forget.
- **Bad restocking decisions:** Traders often buy without knowing where prices are cheapest.
- **No financial proof:** Without clean records, traders struggle to access credit, insurance, partnerships, and growth tools.

The current tools are too formal, too English-heavy, and too slow for the reality of a busy market.

---

## Slide 3: The Insight

Traders already know how to run their shops.

They do not need another complicated dashboard first.

They need a business system that understands the way they already speak.

**Core insight:** Voice is the natural interface for informal commerce.

If Africhain can turn everyday speech into structured business actions, then every trader gets digital records without changing how they work.

---

## Slide 4: The Solution

Africhain lets traders talk to their business in plain English, Pidgin, Yoruba, Hausa, or Igbo-style phrases.

The app is split into three clear voice modes:

1. **Log sales** - record sales, debts, expenses, repayments, and daily summaries.
2. **Ask live prices** - compare market prices and report prices into AMIN.
3. **Update inventory** - add stock, check remaining stock, and spot low-stock items.

Africhain listens, routes the intent, updates the records, and speaks back with a short confirmation.

---

## Slide 5: Product Demo Flow

The demo shows one trader running the shop by voice:

1. Record a sale.
2. Add a customer debt.
3. Ask who owes money.
4. Update stock after restocking.
5. Ask AMIN for live market prices.
6. Generate a PDF receipt from a recent sale.
7. Show the business dashboard and AI coach.

This is not just chat. Every voice command changes business data.

---

## Slide 6: Key Feature 1 - Voice Business Actions

Africhain supports real trader commands like:

- "I sell six paint of rice for nine thousand naira."
- "Mama Nkechi collect two bag of sugar, she never pay, na five thousand."
- "Chidi paid three thousand from him debt."
- "Add fuel expense three thousand five hundred."

Behind the scenes, the AI maps speech to tools like:

- `record_sale`
- `record_debt`
- `settle_debt`
- `record_expense`
- `daily_report`

The result is clean books without forms.

---

## Slide 7: Key Feature 2 - AMIN Market Intelligence

**AMIN: Africhain Market Intelligence Network**

Traders can ask:

- "How much yam dey for Sokoto today?"
- "Where rice cheap today?"
- "Tomato na six thousand five hundred for Mile 12 today."

Africhain can:

- Compare prices across markets.
- Show cheapest and highest markets.
- Accept trader-reported prices.
- Update the live market feed.

AMIN turns isolated traders into a price intelligence network.

---

## Slide 8: Key Feature 3 - Inventory That Updates by Voice

Africhain tracks inventory as the trader speaks.

Examples:

- Selling rice reduces rice stock.
- Saying "Add ten bags of sugar to stock" increases sugar stock.
- Asking "Wetin dey finish for my shop?" returns low-stock items.

The dashboard includes a proper inventory table with:

- Item name
- Current quantity
- Unit
- Low-stock threshold
- Status

This makes stock visible, not hidden in memory.

---

## Slide 9: Key Feature 4 - Receipt Creator

Africhain now includes a receipt creator.

The trader can:

- Select a recent sale.
- Add a customer name.
- Add a receipt note.
- Download a clean PDF receipt.

This helps traders look professional and gives customers proof of purchase.

It also makes sales records more useful beyond the app.

---

## Slide 10: Why Now

Several shifts make Africhain possible now:

- Smartphones are common among traders.
- Voice interfaces are becoming normal.
- AI can understand messy, informal, multilingual speech better than before.
- Traders need digital records to access credit and business services.
- Market price volatility makes real-time intelligence more valuable.

The timing is right for a voice-first business system built for African commerce.

---

## Slide 11: Technical Architecture

Africhain is built as a single deployable Next.js app.

**Frontend**

- Next.js App Router
- Tailwind CSS
- Web Speech API for speech-to-text and text-to-speech
- Client-side PDF generation with `jspdf`

**Backend**

- Next.js API routes
- AI intent router
- Tool-based business actions
- JSON persistence for demo reliability

**Data layer**

- Sales
- Expenses
- Debts
- Tasks
- Inventory
- Trader-reported market prices

The architecture is simple enough for a hackathon demo and modular enough to extend.

---

## Slide 12: Differentiation

Africhain is different because it is built around how informal traders actually work.

| Typical business app | Africhain |
|---|---|
| Forms first | Voice first |
| English-first UX | Local speech and Pidgin-friendly |
| Records only | Records plus market intelligence |
| Static inventory | Inventory updates as the trader talks |
| Isolated data | AMIN turns traders into a price network |
| Receipts as separate tool | Receipts generated from recorded sales |

Africhain is not just bookkeeping. It is a daily operating layer for commerce.

---

## Slide 13: Business Model

Africhain can grow through a layered model:

1. **Freemium trader app**
   - Free basic sales, debts, and inventory tracking.
   - Paid advanced reports, receipts, staff roles, and multi-shop tools.

2. **Market intelligence**
   - Premium access to price trends, alerts, and buying recommendations.
   - Aggregated insights for cooperatives, distributors, and institutions.

3. **Embedded finance**
   - Clean records become a basis for credit scoring.
   - Partnerships with lenders, insurers, suppliers, and cooperatives.

4. **Supply and group buying**
   - Help traders buy together when AMIN shows a price opportunity.

---

## Slide 14: Go-To-Market

Start where trust already exists:

- Market associations
- Trader cooperatives
- Local suppliers
- POS agents
- Microfinance partners
- WhatsApp trader groups

Launch market by market:

1. Seed trusted traders.
2. Collect price reports.
3. Build AMIN liquidity.
4. Use better price data to attract more traders.
5. Convert power users to paid tools.

The network becomes more valuable as more traders use it.

---

## Slide 15: What Is Built Now

Current working product:

- Three-mode voice interface
- AI intent routing
- Sales logging
- Debt tracking
- Expense logging
- Inventory updates
- Low-stock detection
- Business dashboard
- AMIN market lookup
- Trader price reporting
- AI business coach
- PDF receipt creator
- Text fallback for noisy environments

This is demo-ready today.

---

## Slide 16: Roadmap

**Next 30 days**

- Improve speech reliability with confirmation flows.
- Add receipt sharing through WhatsApp.
- Add manual inventory edit controls.
- Add user accounts and cloud persistence.

**Next 90 days**

- Market-by-market AMIN onboarding.
- Price trend charts.
- Supplier and group-buying workflows.
- Multi-staff permissions.

**Next 12 months**

- Embedded credit and insurance partners.
- Verified market data feeds.
- Multi-country language and currency expansion.

---

## Slide 17: The Ask

We are looking for:

- Pilot access to trader communities.
- Mentorship around distribution and fintech partnerships.
- Support to improve voice accuracy in market environments.
- Cloud credits and AI credits to scale testing.

Africhain can become the intelligence layer for informal commerce.

---

# Demo Video Script

## Video Goal

Show that Africhain is not a concept. It is a working product where voice changes real business records.

**Target length:** 2 minutes 30 seconds to 3 minutes.

**Tone:** Confident, fast, human. Speak like you are showing a product that already belongs in the market.

---

## Demo Setup Checklist

Before recording:

1. Use Chrome for best Web Speech API support.
2. Run `npm run dev`.
3. Open `http://localhost:3000`.
4. Click `Reset` to restore seeded data.
5. Keep your microphone close.
6. Use the typed input if voice recognition mishears during recording.
7. Open these pages in tabs:
   - `/`
   - `/business`
   - `/market`
   - `/receipts`

Recommended screen recording layout:

- Browser zoom: 90% or 100%.
- Window width: desktop size.
- Hide unnecessary tabs.
- Keep terminal closed unless showing build proof.

---

## 0:00 - 0:15: Opening Hook

**Show:** Home page hero with the three voice modes.

**Say:**

"This is Africhain, a voice-first operating system for informal traders. Instead of forcing a market woman or shop owner to fill forms, Africhain lets them speak naturally, then updates the business automatically."

---

## 0:15 - 0:35: Explain The Three Modes

**Show:** Click each mode briefly: `Log sales`, `Ask live prices`, `Update inventory`.

**Say:**

"We split voice into three clear modes so the assistant knows what the trader is trying to do. Sales mode is for money and debts. Prices mode is for AMIN market intelligence. Inventory mode is for stock updates and low-stock checks."

**Why this matters:** It shows you solved confusion in the UX, not just added AI.

---

## 0:35 - 0:55: Record A Sale

**Action:**

1. Select `Log sales`.
2. Use voice or typed fallback:
   - "I sell six paint of rice for nine thousand naira"

**Say while it updates:**

"That single sentence becomes a structured sale. Revenue updates, sales count updates, and rice stock reduces because the app understands this was a real transaction."

**Show:** Right-side stats changing if visible.

---

## 0:55 - 1:15: Record A Debt

**Action:**

Still in `Log sales`, say or type:

"Mama Nkechi collect two bag of sugar, she never pay, na five thousand"

**Say:**

"Africhain also understands credit sales. It records that Mama Nkechi owes five thousand naira, and keeps it inside the business dashboard."

**Optional follow-up:**

Say:

"Who dey owe me?"

Then briefly show the answer.

---

## 1:15 - 1:40: Inventory Update

**Action:**

1. Select `Update inventory`.
2. Say or type:
   - "I buy ten bag of sugar, add am to stock"
3. Navigate to `/business`.

**Say:**

"Inventory is not a separate spreadsheet. It changes as the trader talks. Sales reduce stock, restocking increases stock, and the dashboard highlights what is running low."

**Show:** Inventory table on the Business page.

---

## 1:40 - 2:05: AMIN Live Prices

**Action:**

1. Go back to `/`.
2. Select `Ask live prices`.
3. Say or type:
   - "How much yam dey for Sokoto today?"

**Say:**

"This is AMIN, the Africhain Market Intelligence Network. The trader can compare prices across markets before restocking, and can also report prices they see in their own market."

**Optional price report:**

Say or type:

"Tomato na six thousand five hundred for Mile 12 today"

Then open `/market` to show the live trader report.

---

## 2:05 - 2:25: Receipt Creator

**Action:**

1. Open `/receipts`.
2. Select the latest sale.
3. Add customer name:
   - "Walk-in customer" or "Mr Chidi"
4. Click `Download PDF receipt`.

**Say:**

"Because the sale is already recorded, Africhain can generate a clean PDF receipt immediately. That gives the customer proof and gives the trader more professional records."

---

## 2:25 - 2:50: Close With Business Value

**Show:** Business dashboard or home page.

**Say:**

"Africhain starts as a simple voice tool, but the data becomes powerful. It helps traders remember sales, recover debts, restock smarter, prove business activity, and eventually access credit, insurance, and better supply deals."

---

## 2:50 - 3:00: Final Line

**Say:**

"Africhain turns everyday trader speech into business intelligence. That is how we bring millions of informal businesses into the digital economy without asking them to change how they work."

---

# Demo Backup Script If Voice Fails

If browser voice recognition fails during recording, say this calmly:

"Markets are noisy, so Africhain also has typed fallback. The same AI intent router handles the command either way."

Then type the exact command and continue.

This does not weaken the demo. It actually shows practical product thinking.

---

# Best Commands To Use In The Demo

Use these exact commands because they are clear and reliable:

1. `I sell six paint of rice for nine thousand naira`
2. `Mama Nkechi collect two bag of sugar, she never pay, na five thousand`
3. `Who dey owe me?`
4. `I buy ten bag of sugar, add am to stock`
5. `How much yam dey for Sokoto today?`
6. `Tomato na six thousand five hundred for Mile 12 today`
7. `How today go? Give me my close of day summary.`

---

# Voice Improvement Notes

What is already improved:

- Three task-specific voice modes reduce intent confusion.
- `continuous` listening captures longer trader phrases.
- `maxAlternatives = 3` gives the browser more recognition options.
- Live transcript lets the trader catch mistakes early.
- Typed fallback keeps demos safe in noisy rooms.
- Agent mode instructions bias interpretation toward the selected task.

What to improve next:

- Add a confirmation step for high-risk actions: "I heard 6 paint rice for NGN 9,000. Save it?"
- Add custom phrase hints for common goods, markets, and trader names.
- Store frequent customer and item names to improve correction.
- Add a noise meter and "move closer" prompt.
- Add WhatsApp voice-note upload and server-side transcription for better accuracy.

---

# Final Pitch Sentence

Africhain is the business memory, market intelligence, and proof layer for informal traders - built around the way they already speak.
