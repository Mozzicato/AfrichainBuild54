// AMIN — Africhain Market Intelligence Network
//
// Everything flows through the MarketSource interface. Today it is backed by a
// curated dataset; tomorrow a LiveMarketSource (government feeds, agricultural
// exchanges, crowdsourced trader submissions) drops in behind the same
// interface with zero changes to the agent or UI.

export type PriceQuote = {
  market: string;
  price: number; // naira per unit
  unit: string;
  updated: string; // human label, e.g. "today"
  reported: boolean; // true if this price came from a trader submission
};

export type MarketResult = {
  commodity: string;
  unit: string;
  quotes: PriceQuote[]; // sorted cheapest -> most expensive
  cheapest: PriceQuote;
  highest: PriceQuote;
  average: number;
  recommendation: string;
  source: "curated" | "live";
  reportCount: number; // trader submissions folded into this result today
};

// Trader-submitted overrides for one commodity: { market: price }
export type PriceOverrides = Record<string, number>;

export interface MarketSource {
  lookup(commodityQuery: string, marketQuery?: string, overrides?: PriceOverrides): MarketResult | null;
  commodities(): string[];
}

type Row = { unit: string; markets: Record<string, number> };

// Curated snapshot — realistic Nigerian wholesale prices across major markets.
const DATA: Record<string, Row> = {
  yam: {
    unit: "per tuber",
    markets: { Sokoto: 4700, Kano: 5200, Kaduna: 5100, Abuja: 6100, Lagos: 6800, Onitsha: 5900 },
  },
  rice: {
    unit: "per 50kg bag",
    markets: { Kano: 62000, Sokoto: 61000, Abuja: 66000, Lagos: 71000, Onitsha: 68000, Kaduna: 63000 },
  },
  tomato: {
    unit: "per basket",
    markets: { Kano: 18000, Sokoto: 17500, Kaduna: 19000, Abuja: 26000, Lagos: 32000, Onitsha: 24000 },
  },
  onion: {
    unit: "per bag",
    markets: { Sokoto: 22000, Kano: 23000, Kaduna: 24000, Abuja: 31000, Lagos: 38000, Onitsha: 29000 },
  },
  maize: {
    unit: "per 100kg bag",
    markets: { Kaduna: 41000, Kano: 42000, Sokoto: 40000, Abuja: 47000, Lagos: 52000, Onitsha: 45000 },
  },
  pepper: {
    unit: "per bag",
    markets: { Kano: 27000, Kaduna: 26000, Sokoto: 25500, Abuja: 34000, Lagos: 41000, Onitsha: 33000 },
  },
  beans: {
    unit: "per 100kg bag",
    markets: { Kano: 78000, Sokoto: 76000, Kaduna: 79000, Abuja: 88000, Lagos: 95000, Onitsha: 85000 },
  },
  "palm oil": {
    unit: "per 25L",
    markets: { Onitsha: 42000, Abuja: 46000, Lagos: 48000, Kano: 51000, Kaduna: 50000, Sokoto: 52000 },
  },
};

const ALIASES: Record<string, string> = {
  yams: "yam",
  tomatoes: "tomato",
  tomatos: "tomato",
  onions: "onion",
  corn: "maize",
  pepe: "pepper",
  ata: "pepper",
  "red oil": "palm oil",
  "palmoil": "palm oil",
};

export function normalizeCommodity(q: string): string | null {
  const s = q.trim().toLowerCase();
  if (DATA[s]) return s;
  if (ALIASES[s]) return ALIASES[s];
  // partial contains match
  const key = Object.keys(DATA).find((k) => s.includes(k) || k.includes(s));
  if (key) return key;
  const alias = Object.keys(ALIASES).find((a) => s.includes(a));
  return alias ? ALIASES[alias] : null;
}

// Known markets, or a Title-cased new one (crowdsourcing can add markets).
export function normalizeMarket(q: string): string {
  const s = q.trim().toLowerCase();
  const all = new Set<string>();
  Object.values(DATA).forEach((r) => Object.keys(r.markets).forEach((m) => all.add(m)));
  const found = [...all].find((m) => m.toLowerCase() === s || s.includes(m.toLowerCase()));
  if (found) return found;
  return q.trim().replace(/\b\w/g, (c) => c.toUpperCase());
}

function titleMarket(q: string): string | null {
  const s = q.trim().toLowerCase();
  const all = new Set<string>();
  Object.values(DATA).forEach((r) => Object.keys(r.markets).forEach((m) => all.add(m)));
  const found = [...all].find((m) => m.toLowerCase() === s || s.includes(m.toLowerCase()));
  return found || null;
}

export class CuratedMarketSource implements MarketSource {
  commodities(): string[] {
    return Object.keys(DATA);
  }

  lookup(commodityQuery: string, marketQuery?: string, overrides?: PriceOverrides): MarketResult | null {
    const commodity = normalizeCommodity(commodityQuery);
    if (!commodity) return null;
    const row = DATA[commodity];

    // Merge curated base with today's trader reports (reports win, can add markets).
    const merged: Record<string, { price: number; reported: boolean }> = {};
    for (const [market, price] of Object.entries(row.markets)) {
      merged[market] = { price, reported: false };
    }
    let reportCount = 0;
    if (overrides) {
      for (const [market, price] of Object.entries(overrides)) {
        merged[market] = { price, reported: true };
        reportCount++;
      }
    }

    const quotes: PriceQuote[] = Object.entries(merged)
      .map(([market, v]) => ({
        market,
        price: v.price,
        unit: row.unit,
        updated: v.reported ? "trader report" : "today",
        reported: v.reported,
      }))
      .sort((a, b) => a.price - b.price);

    const cheapest = quotes[0];
    const highest = quotes[quotes.length - 1];
    const average = Math.round(quotes.reduce((a, q) => a + q.price, 0) / quotes.length);

    let recommendation: string;
    const asked = marketQuery ? titleMarket(marketQuery) : null;
    if (asked) {
      const here = quotes.find((q) => q.market === asked)!;
      if (here.market === cheapest.market) {
        recommendation = `${asked} get the best price today (₦${here.price.toLocaleString()}). Good place to buy.`;
      } else {
        const save = here.price - cheapest.price;
        recommendation = `${asked} na ₦${here.price.toLocaleString()}. But ${cheapest.market} cheaper by ₦${save.toLocaleString()} — if you fit reach there, na better buy.`;
      }
    } else {
      recommendation = `Cheapest na ${cheapest.market} at ₦${cheapest.price.toLocaleString()}; most expensive na ${highest.market} at ₦${highest.price.toLocaleString()}. Buy for ${cheapest.market}, sell where price high.`;
    }

    return {
      commodity,
      unit: row.unit,
      quotes,
      cheapest,
      highest,
      average,
      recommendation,
      source: reportCount > 0 ? "live" : "curated",
      reportCount,
    };
  }
}

export const marketSource: MarketSource = new CuratedMarketSource();

// ---- Live feed (demo) ----
// Simulates a live market data stream: prices drift over time so successive
// polls tick up and down. Crowdsourced trader reports are folded in and flagged.
// In production this same shape is produced by real feeds behind MarketSource.

export type LiveQuote = {
  market: string;
  price: number;
  base: number;
  dir: "up" | "down" | "flat";
  reported: boolean;
};

export type LiveCommodity = {
  commodity: string;
  unit: string;
  quotes: LiveQuote[]; // sorted cheapest -> most expensive
  cheapest: LiveQuote;
  highest: LiveQuote;
  average: number;
  reportCount: number;
};

export type LiveSnapshot = {
  commodities: LiveCommodity[];
  updatedAt: number;
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000;
  return h;
}

function jitter(base: number, seedStr: string): number {
  const t = Date.now();
  const seed = hash(seedStr);
  const slow = Math.sin(t / 22000 + seed); // slow trend
  const fast = Math.sin(t / 4000 + seed * 7); // faster wobble
  const factor = 1 + 0.035 * slow + 0.012 * fast;
  return Math.round((base * factor) / 10) * 10; // nearest ₦10
}

export function liveSnapshot(
  overridesByCommodity?: Record<string, PriceOverrides>
): LiveSnapshot {
  const commodities: LiveCommodity[] = Object.entries(DATA).map(([commodity, row]) => {
    const overrides = overridesByCommodity?.[commodity] || {};
    const merged: Record<string, { price: number; base: number; reported: boolean }> = {};

    for (const [market, base] of Object.entries(row.markets)) {
      const price = jitter(base, commodity + market);
      merged[market] = { price, base, reported: false };
    }
    let reportCount = 0;
    for (const [market, price] of Object.entries(overrides)) {
      merged[market] = { price, base: merged[market]?.base ?? price, reported: true };
      reportCount++;
    }

    const quotes: LiveQuote[] = Object.entries(merged)
      .map(([market, v]) => {
        const delta = v.price - v.base;
        const dir: LiveQuote["dir"] =
          v.reported || Math.abs(delta) < v.base * 0.006 ? "flat" : delta > 0 ? "up" : "down";
        return { market, price: v.price, base: v.base, dir, reported: v.reported };
      })
      .sort((a, b) => a.price - b.price);

    const average = Math.round(quotes.reduce((a, q) => a + q.price, 0) / quotes.length);
    return {
      commodity,
      unit: row.unit,
      quotes,
      cheapest: quotes[0],
      highest: quotes[quotes.length - 1],
      average,
      reportCount,
    };
  });

  return { commodities, updatedAt: Date.now() };
}
