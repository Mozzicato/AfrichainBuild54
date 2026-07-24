import fs from "fs";
import path from "path";
import { DB, BusinessState, Sale, Expense, Debt, Task, InventoryItem, PriceReport } from "./types";
import { normalizeCommodity, normalizeMarket, PriceOverrides } from "./market";

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
    inventory: [
      { id: id(), item: "rice", qty: 12, unit: "paint", lowAt: 5 },
      { id: id(), item: "sugar", qty: 3, unit: "bag", lowAt: 4 }, // low
      { id: id(), item: "tomato", qty: 4, unit: "basket", lowAt: 5 }, // low
      { id: id(), item: "milk", qty: 40, unit: "tin", lowAt: 12 },
      { id: id(), item: "bread", qty: 9, unit: "loaf", lowAt: 6 },
      { id: id(), item: "groundnut oil", qty: 8, unit: "bottle", lowAt: 6 },
      { id: id(), item: "maggi", qty: 5, unit: "roll", lowAt: 4 },
    ],
    priceReports: [],
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
  // draw down stock if we track this item
  const inv = db.inventory.find(
    (i) => i.item.toLowerCase() === item.toLowerCase() || item.toLowerCase().includes(i.item.toLowerCase())
  );
  if (inv) inv.qty = Math.max(0, inv.qty - qty);
  persist();
  return s;
}

export function restockItem(item: string, qty: number, unit?: string): InventoryItem {
  const db = load();
  const existing = db.inventory.find(
    (i) => i.item.toLowerCase() === item.toLowerCase() || item.toLowerCase().includes(i.item.toLowerCase())
  );
  if (existing) {
    existing.qty += qty;
    if (unit) existing.unit = unit;
    persist();
    return existing;
  }
  const it: InventoryItem = { id: id(), item, qty, unit: unit || "unit", lowAt: 3 };
  db.inventory.push(it);
  persist();
  return it;
}

function lowStockItems(db: DB): InventoryItem[] {
  return db.inventory.filter((i) => i.qty <= i.lowAt);
}

// ---- AMIN crowdsourced prices ----

export function submitPrice(
  commodityQ: string,
  marketQ: string,
  price: number,
  by?: string
): { commodity: string; market: string; price: number } {
  const db = load();
  const commodity = normalizeCommodity(commodityQ) || commodityQ.trim().toLowerCase();
  const market = normalizeMarket(marketQ);
  const r: PriceReport = { id: id(), commodity, market, price, by, ts: Date.now() };
  db.priceReports.push(r);
  persist();
  return { commodity, market, price };
}

// Today's trader-reported prices for a commodity, latest-per-market.
export function getPriceOverrides(commodityQ: string): PriceOverrides {
  const db = load();
  const commodity = normalizeCommodity(commodityQ) || commodityQ.trim().toLowerCase();
  const t0 = startOfToday();
  const out: PriceOverrides = {};
  for (const r of db.priceReports) {
    if (r.commodity === commodity && r.ts >= t0) out[r.market] = r.price; // last write wins
  }
  return out;
}

// All of today's trader reports grouped by commodity.
export function getAllPriceOverrides(): Record<string, PriceOverrides> {
  const db = load();
  const t0 = startOfToday();
  const out: Record<string, PriceOverrides> = {};
  for (const r of db.priceReports) {
    if (r.ts < t0) continue;
    (out[r.commodity] ||= {})[r.market] = r.price;
  }
  return out;
}

export function recentPriceReports(limit = 8) {
  const db = load();
  return [...db.priceReports].sort((a, b) => b.ts - a.ts).slice(0, limit);
}

export function dailyReport(): string {
  const db = load();
  const t0 = startOfToday();
  const todaySales = db.sales.filter((s) => s.ts >= t0);
  const revenue = todaySales.reduce((a, s) => a + s.amount, 0);
  const expenses = db.expenses.filter((e) => e.ts >= t0).reduce((a, e) => a + e.amount, 0);
  const debt = db.debts.reduce((a, d) => a + d.amount, 0);
  const low = lowStockItems(db).map((i) => i.item);

  // top item today by revenue
  const byItem: Record<string, number> = {};
  for (const s of todaySales) byItem[s.item] = (byItem[s.item] || 0) + s.amount;
  const top = Object.entries(byItem).sort((a, b) => b[1] - a[1])[0]?.[0];

  const parts: string[] = [];
  parts.push(`Today you make ${todaySales.length} sale${todaySales.length === 1 ? "" : "s"}, revenue ₦${revenue.toLocaleString()}, profit ₦${(revenue - expenses).toLocaleString()}.`);
  if (top) parts.push(`Your best today na ${top}.`);
  if (debt > 0) parts.push(`People still owe you ₦${debt.toLocaleString()}.`);
  if (low.length) parts.push(`Restock soon: ${low.join(", ")}.`);
  return parts.join(" ");
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
    inventory: [...db.inventory].sort(
      (a, b) => Number(a.qty > a.lowAt) - Number(b.qty > b.lowAt) || a.item.localeCompare(b.item)
    ),
    lowStock: lowStockItems(db).map((i) => i.item),
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
  const low = lowStockItems(db).map((i) => i.item);

  const tips: string[] = [];
  tips.push(`You dey sell pass on ${WEEKDAYS[bestDay]} — make sure your shelf full that day.`);
  if (low.length) tips.push(`${low.join(" and ")} don dey finish — restock am before e cut.`);
  else if (topItem) tips.push(`${topItem} na your best seller. Keep am well stocked.`);
  if (debt > 0) tips.push(`People owe you ₦${debt.toLocaleString()}. Follow up small make your cash no lock.`);

  return tips.join(" ");
}
