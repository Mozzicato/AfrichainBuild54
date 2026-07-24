import {
  addSale,
  addExpense,
  addDebt,
  settleDebt,
  assignTask,
  completeTask,
  restockItem,
  dailyReport,
  getState,
  coachInsight,
} from "./store";
import { marketSource, MarketResult } from "./market";
import { BusinessState } from "./types";
import { chat, ChatMessage, ToolDef } from "./provider";

export type AgentResult = {
  reply: string;
  state: BusinessState;
  market: MarketResult | null;
};

const SYSTEM = `You are Africhain — a warm, sharp voice assistant for a small African trader's business.

The user speaks by voice in ONE of these languages/registers, informally: English, Nigerian Pidgin, Yoruba, Hausa, or Igbo. Transcription is imperfect — interpret intent generously.

Understand informal trade units and numbers spoken as words: basket, paint, bag, tuber, congo, mudu, bottle, tin, roll, loaf, carton, derica, sachet. "two thousand" = 2000, "5k" = 5000, "nine hundred" = 900.

RULES:
- For ANY business action or question, call the matching tool. Never invent numbers — read them from tool results.
- If a sale has quantity but a total price, record the total in "amount".
- After tools run, give ONE short, warm spoken confirmation or answer — like a trusted shop assistant, not a robot.
- CRITICAL: reply in the SAME language and register the user used. If they speak Pidgin, answer in Pidgin. If Yoruba, answer in Yoruba. Match their vibe. Keep it to 1–2 sentences — it will be read aloud.
- Naira amounts: say them naturally (e.g. "nine thousand naira").
- If you truly cannot tell what they want, ask one short clarifying question in their language.`;

const tools: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "record_sale",
      description: "Record a sale the trader just made.",
      parameters: {
        type: "object",
        properties: {
          item: { type: "string", description: "what was sold, e.g. rice, tomato" },
          qty: { type: "number", description: "quantity sold" },
          unit: { type: "string", description: "unit, e.g. basket, paint, bag, bottle. Use 'unit' if unknown." },
          amount: { type: "number", description: "total naira received for this sale" },
        },
        required: ["item", "qty", "unit", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "record_expense",
      description: "Record a business expense.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", description: "e.g. transport, fuel, rent, restock" },
          amount: { type: "number" },
          note: { type: "string" },
        },
        required: ["category", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "record_debt",
      description: "Record that a customer took goods on credit and owes money.",
      parameters: {
        type: "object",
        properties: {
          customer: { type: "string" },
          amount: { type: "number", description: "amount owed in naira" },
          note: { type: "string", description: "what they took" },
        },
        required: ["customer", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "settle_debt",
      description: "Record that a customer paid back part or all of their debt.",
      parameters: {
        type: "object",
        properties: {
          customer: { type: "string" },
          amount: { type: "number", description: "amount paid in naira" },
        },
        required: ["customer", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "assign_task",
      description: "Assign a task to a worker (Oga Tasks).",
      parameters: {
        type: "object",
        properties: {
          who: { type: "string", description: "worker's name" },
          task: { type: "string" },
        },
        required: ["who", "task"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_task",
      description: "Mark a worker's task as done.",
      parameters: {
        type: "object",
        properties: { who: { type: "string" } },
        required: ["who"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_business",
      description: "Answer a question about the business: sales, profit, who owes money, tasks, general status.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            enum: ["summary", "debts", "tasks", "sales"],
            description: "what the user is asking about",
          },
        },
        required: ["topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "market_lookup",
      description: "Look up today's market prices for a commodity across markets (AMIN). Use for questions about prices, where to buy cheap, or where to sell high.",
      parameters: {
        type: "object",
        properties: {
          commodity: { type: "string", description: "e.g. yam, rice, tomato, onion, maize, pepper, beans, palm oil" },
          market: { type: "string", description: "optional specific market the user asked about, e.g. Sokoto" },
        },
        required: ["commodity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "restock",
      description: "Add stock the trader just bought or received into inventory.",
      parameters: {
        type: "object",
        properties: {
          item: { type: "string" },
          qty: { type: "number", description: "quantity added" },
          unit: { type: "string", description: "unit, e.g. bag, paint, basket" },
        },
        required: ["item", "qty"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_stock",
      description: "Check inventory levels or what is running low.",
      parameters: {
        type: "object",
        properties: {
          item: { type: "string", description: "optional specific item to check" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "daily_report",
      description: "Give the close-of-day summary: today's sales, revenue, profit, best item, debts and what to restock.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_coach_insight",
      description: "Give a proactive, data-driven business tip based on the trader's own records.",
      parameters: { type: "object", properties: {} },
    },
  },
];

type ToolInput = Record<string, unknown>;
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const num = (v: unknown, d = 0) => (typeof v === "number" && !isNaN(v) ? v : Number(v) || d);

function runTool(name: string, input: ToolInput): { result: string; market?: MarketResult | null } {
  switch (name) {
    case "record_sale": {
      const s = addSale(str(input.item, "item"), num(input.qty, 1), str(input.unit, "unit"), num(input.amount));
      const st = getState();
      return { result: `Recorded: ${s.qty} ${s.unit} of ${s.item} for ₦${s.amount.toLocaleString()}. Today's revenue is now ₦${st.today.revenue.toLocaleString()}.` };
    }
    case "record_expense": {
      const e = addExpense(str(input.category, "expense"), num(input.amount), str(input.note) || undefined);
      const st = getState();
      return { result: `Recorded expense: ${e.category} ₦${e.amount.toLocaleString()}. Today's profit is now ₦${st.today.profit.toLocaleString()}.` };
    }
    case "record_debt": {
      const d = addDebt(str(input.customer, "customer"), num(input.amount), str(input.note) || undefined);
      return { result: `${d.customer} now owes ₦${d.amount.toLocaleString()}${d.note ? ` (${d.note})` : ""}.` };
    }
    case "settle_debt": {
      const r = settleDebt(str(input.customer), num(input.amount));
      if (!r) return { result: `No debt found for that customer.` };
      return { result: `${r.customer} paid ₦${r.paid.toLocaleString()}. Remaining balance: ₦${r.remaining.toLocaleString()}.` };
    }
    case "assign_task": {
      const t = assignTask(str(input.who, "worker"), str(input.task, "task"));
      return { result: `Task assigned to ${t.who}: ${t.task}.` };
    }
    case "complete_task": {
      const t = completeTask(str(input.who));
      if (!t) return { result: `No open task found for that worker.` };
      return { result: `Marked done: ${t.who} — ${t.task}.` };
    }
    case "query_business": {
      const st = getState();
      const topic = str(input.topic, "summary");
      if (topic === "debts") {
        if (st.debts.length === 0) return { result: `Nobody is owing you right now. Good.` };
        return { result: `Debts owed to you: ${st.debts.map((d) => `${d.customer} ₦${d.amount.toLocaleString()}`).join("; ")}. Total ₦${st.totals.outstandingDebt.toLocaleString()}.` };
      }
      if (topic === "tasks") {
        const open = st.tasks.filter((t) => !t.done);
        if (open.length === 0) return { result: `No pending tasks. Everybody done their work.` };
        return { result: `Pending tasks: ${open.map((t) => `${t.who} — ${t.task}`).join("; ")}.` };
      }
      if (topic === "sales") {
        return { result: `Today: ${st.today.salesCount} sales, revenue ₦${st.today.revenue.toLocaleString()}. Recent: ${st.recentSales.slice(0, 3).map((s) => `${s.qty} ${s.unit} ${s.item}`).join(", ")}.` };
      }
      return { result: `Today: revenue ₦${st.today.revenue.toLocaleString()}, expenses ₦${st.today.expenses.toLocaleString()}, profit ₦${st.today.profit.toLocaleString()}. ${st.totals.outstandingDebt > 0 ? `People owe you ₦${st.totals.outstandingDebt.toLocaleString()}.` : ""} ${st.totals.openTasks} open task(s).` };
    }
    case "market_lookup": {
      const m = marketSource.lookup(str(input.commodity), str(input.market) || undefined);
      if (!m) return { result: `I don't have market data for that commodity yet.`, market: null };
      const list = m.quotes.map((q) => `${q.market} ₦${q.price.toLocaleString()}`).join(", ");
      return {
        result: `${m.commodity} (${m.unit}) today: ${list}. ${m.recommendation}`,
        market: m,
      };
    }
    case "restock": {
      const it = restockItem(str(input.item, "item"), num(input.qty, 1), str(input.unit) || undefined);
      return { result: `Restocked ${it.item}. Now ${it.qty} ${it.unit} in stock.` };
    }
    case "check_stock": {
      const st = getState();
      const item = str(input.item);
      if (item) {
        const found = st.inventory.find((i) => i.item.toLowerCase().includes(item.toLowerCase()));
        if (!found) return { result: `You never add ${item} to your stock list.` };
        return { result: `${found.item}: ${found.qty} ${found.unit} left${found.qty <= found.lowAt ? " — dey run low, restock soon." : "."}` };
      }
      if (st.lowStock.length === 0) return { result: `Your stock still okay, nothing dey finish.` };
      return { result: `These items dey run low: ${st.lowStock.join(", ")}. Restock them soon.` };
    }
    case "daily_report": {
      return { result: dailyReport() };
    }
    case "get_coach_insight": {
      return { result: coachInsight() };
    }
    default:
      return { result: `Unknown action.` };
  }
}

function safeParse(argsJson: string): ToolInput {
  try {
    return JSON.parse(argsJson || "{}");
  } catch {
    return {};
  }
}

export async function runAgent(transcript: string): Promise<AgentResult> {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: transcript },
  ];
  let market: MarketResult | null = null;

  for (let i = 0; i < 4; i++) {
    const msg = await chat(messages, tools);

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      messages.push({
        role: "assistant",
        content: msg.content ?? null,
        tool_calls: msg.tool_calls,
      });
      for (const call of msg.tool_calls) {
        const out = runTool(call.function.name, safeParse(call.function.arguments));
        if (out.market !== undefined) market = out.market;
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: out.result,
        });
      }
      continue;
    }

    const reply = (msg.content || "Okay.").trim();
    return { reply, state: getState(), market };
  }

  return { reply: "I've done that for you.", state: getState(), market };
}
