import fs from "fs";
import path from "path";
import { DB, BusinessState, Sale, Expense, Debt, Task } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const id = () => Math.random().toString(36).slice(2, 10);
const daysAgo = (n: number) => Date.now() - n * 24 * 60 * 60 * 1000;

// A believable, pre-seeded provision store for the demo.
function seed(): DB {
  return {
    business: "Mama Ada Provision Store",
    sales: [
      { id: id(), item: "rice", qty: 3, unit: "paint", amount: 13500, ts: daysAgo(5) },
      { id: id(), item: "groundnut oil", qty: 4, unit: "bottle", amount: 6400, ts: daysAgo(5) },
      { id: id(), item: "sugar", qty: 2, unit: "bag", amount: 44000, ts: daysAgo(4) },
      { id: id(), item: "tomato", qty: 5, unit: "basket", amount: 32500, ts: daysAgo(3) },
      { id: id(), item: "milk", qty: 12, unit: "tin", amount: 4800, ts: daysAgo(1) },
      // Fridays trend a little higher — powers the coach insight.
      { id: id(), item: "rice", qty: 4, unit: "paint", amount: 18000, ts: lastFriday() },
      { id: id(), item: "maggi", qty: 3, unit: "roll", amount: 1500, ts: lastFriday() },
      { id: id(), item: "detergent", qty: 6, unit: "sachet", amount: 3000, ts: startOfToday() + 3600_000 },
      { id: id(), item: "bread", qty: 8, unit: "loaf", amount: 8000, ts: startOfToday() + 7200_000 },
    ],
    expenses: [
      { id: id(), category: "transport", amount: 2000, note: "market delivery", ts: daysAgo(2) },
      { id: id(), category: "fuel", amount: 3500, note: "generator", ts: startOfToday() + 5400_000 },
    ],
    debts: [
      { id: id(), customer: "Mama Nkechi", amount: 3000, note: "2 bag of sugar", ts: daysAgo(3) },
      { id: id(), customer: "Alhaji Musa", amount: 7500, note: "provisions", ts: daysAgo(6) },
    ],
    tasks: [
      { id: id(), who: "Chidi", task: "sweep the shop and arrange shelf", done: false, ts: daysAgo(0) },
      { id: id(), who: "Blessing", task: "count remaining bags of rice", done: true, ts: daysAgo(1) },
    ],
  };
}

function lastFriday(): number {
  const d = new Date();
  const day = d.getDay(); // 0 Sun .. 5 Fri
  const diff = (day - 5 + 7) % 7 || 7;
  d.setDate(d.getDate() - diff);
  d.setHours(12, 0, 0, 0);
  return d.getTime();
}

let mem: DB | null = null;

function load(): DB {
  if (mem) return mem;
  try {
    if (fs.existsSync(DB_PATH)) {
      mem = JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as DB;
      return mem;
    }
  } catch {
    /* fall through to seed */
  }
  mem = seed();
  persist();
  return mem;
}

function persist() {
  if (!mem) return;
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(mem, null, 2));
  } catch {
    /* read-only fs (e.g. serverless) — keep in-memory only */
  }
}

export function reset(): DB {
  mem = seed();
  persist();
  return mem;
}

// ---- mutations (called by agent tools) ----

export function addSale(item: string, qty: number, unit: string, amount: number): Sale {
  const db = load();
  const s: Sale = { id: id(), item, qty, unit, amount, ts: Date.now() };
  db.sales.push(s);
  persist();
  return s;
}

export function addExpense(category: string, amount: number, note?: string): Expense {
  const db = load();
  const e: Expense = { id: id(), category, amount, note, ts: Date.now() };
  db.expenses.push(e);
  persist();
  return e;
}

export function addDebt(customer: string, amount: number, note?: string): Debt {
  const db = load();
  const existing = db.debts.find(
    (d) => d.customer.toLowerCase() === customer.toLowerCase()
  );
  if (existing) {
    existing.amount += amount;
    if (note) existing.note = note;
    existing.ts = Date.now();
    persist();
    return existing;
  }
  const d: Debt = { id: id(), customer, amount, note, ts: Date.now() };
  db.debts.push(d);
  persist();
  return d;
}

export function settleDebt(customer: string, amount: number): { customer: string; paid: number; remaining: number } | null {
  const db = load();
  const d = db.debts.find((x) => x.customer.toLowerCase().includes(customer.toLowerCase()));
  if (!d) return null;
  const paid = Math.min(amount, d.amount);
  d.amount -= paid;
  const remaining = d.amount;
  if (d.amount <= 0) db.debts = db.debts.filter((x) => x.id !== d.id);
  persist();
  return { customer: d.customer, paid, remaining: Math.max(0, remaining) };
}

export function assignTask(who: string, task: string): Task {
  const db = load();
  const t: Task = { id: id(), who, task, done: false, ts: Date.now() };
  db.tasks.push(t);
  persist();
  return t;
}

export function completeTask(who: string): Task | null {
  const db = load();
  const t = [...db.tasks]
    .reverse()
    .find((x) => !x.done && x.who.toLowerCase().includes(who.toLowerCase()));
  if (!t) return null;
  t.done = true;
  persist();
  return t;
}

// ---- reads ----

export function getState(): BusinessState {
  const db = load();
  const t0 = startOfToday();
  const todaySales = db.sales.filter((s) => s.ts >= t0);
  const todayExpenses = db.expenses.filter((e) => e.ts >= t0);
  const revenue = todaySales.reduce((a, s) => a + s.amount, 0);
  const expenses = todayExpenses.reduce((a, e) => a + e.amount, 0);

  return {
    business: db.business,
    today: {
      revenue,
      expenses,
      profit: revenue - expenses,
      salesCount: todaySales.length,
    },
    totals: {
      outstandingDebt: db.debts.reduce((a, d) => a + d.amount, 0),
      openTasks: db.tasks.filter((t) => !t.done).length,
    },
    recentSales: [...db.sales].sort((a, b) => b.ts - a.ts).slice(0, 6),
    debts: [...db.debts].sort((a, b) => b.amount - a.amount),
    tasks: [...db.tasks].sort((a, b) => Number(a.done) - Number(b.done) || b.ts - a.ts),
    coach: coachInsight(),
  };
}

export function getRaw(): DB {
  return load();
}

// ---- coach ----

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function coachInsight(): string {
  const db = load();
  if (db.sales.length === 0) return "Start recording your sales so I fit advise you well.";

  // Busiest weekday by revenue
  const byDay = new Array(7).fill(0);
  for (const s of db.sales) byDay[new Date(s.ts).getDay()] += s.amount;
  const bestDay = byDay.indexOf(Math.max(...byDay));

  // Top item by revenue
  const byItem: Record<string, number> = {};
  for (const s of db.sales) byItem[s.item] = (byItem[s.item] || 0) + s.amount;
  const topItem = Object.entries(byItem).sort((a, b) => b[1] - a[1])[0]?.[0];

  const debt = db.debts.reduce((a, d) => a + d.amount, 0);

  const tips: string[] = [];
  tips.push(`You dey sell pass on ${WEEKDAYS[bestDay]} — make sure your shelf full that day.`);
  if (topItem) tips.push(`${topItem} na your best seller. Restock am before e finish.`);
  if (debt > 0) tips.push(`People owe you ₦${debt.toLocaleString()}. Follow up small make your cash no lock.`);

  return tips.join(" ");
}
