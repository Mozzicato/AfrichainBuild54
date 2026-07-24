"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LiveCommodity, LiveQuote } from "@/lib/market";
import type { PriceReport } from "@/lib/types";
import { NGN, timeAgo } from "@/lib/format";

type Snap = {
  commodities: LiveCommodity[];
  updatedAt: number;
  reports: PriceReport[];
};

function Arrow({ dir }: { dir: LiveQuote["dir"] }) {
  if (dir === "up") return <span className="text-xs text-green">▲</span>;
  if (dir === "down") return <span className="text-xs text-terracotta">▼</span>;
  return <span className="text-xs text-muted">–</span>;
}

export default function LiveMarket() {
  const [snap, setSnap] = useState<Snap | null>(null);
  const [selected, setSelected] = useState<string>("yam");
  const [, tick] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/market", { cache: "no-store" });
        const d = (await r.json()) as Snap;
        if (alive) setSnap(d);
      } catch {
        /* ignore */
      }
    };
    load();
    const poll = setInterval(load, 4000);
    const clock = setInterval(() => tick((n) => n + 1), 1000);
    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(clock);
    };
  }, []);

  if (!snap) return <p className="text-sm text-muted">Loading live market…</p>;

  const sel = snap.commodities.find((commodity) => commodity.commodity === selected) || snap.commodities[0];
  const max = sel.highest.price;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-green-2">AMIN Live</h1>
          <p className="text-sm text-muted">
            Africhain Market Intelligence Network — prices across Nigeria&apos;s markets
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 rounded-full bg-green/15 px-2.5 py-1 font-semibold text-green">
            <span className="listening inline-block h-2 w-2 rounded-full bg-green" />
            LIVE
          </span>
          <span className="text-muted">updated {timeAgo(snap.updatedAt)}</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-green-2 px-3 py-2 text-cream">
        <div className="flex min-w-max gap-5 text-sm">
          {snap.commodities.map((commodity) => (
            <button
              key={commodity.commodity}
              onClick={() => setSelected(commodity.commodity)}
              className="flex items-center gap-1.5 whitespace-nowrap transition hover:text-gold"
            >
              <span className="font-semibold capitalize">{commodity.commodity}</span>
              <span className="text-cream/80">{NGN(commodity.cheapest.price)}</span>
              <Arrow dir={commodity.cheapest.dir} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <div className="card h-max p-3">
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Commodities
          </h2>
          <ul className="flex flex-col">
            {snap.commodities.map((commodity) => {
              const active = commodity.commodity === sel.commodity;
              return (
                <li key={commodity.commodity}>
                  <button
                    onClick={() => setSelected(commodity.commodity)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                      active ? "bg-green text-cream" : "hover:bg-cream-2"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-medium capitalize">
                      {commodity.commodity}
                      {commodity.reportCount > 0 && (
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" />
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      {NGN(commodity.cheapest.price)}
                      <Arrow dir={commodity.cheapest.dir} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-bold capitalize text-green-2">
              {sel.commodity}{" "}
              <span className="text-sm font-normal text-muted">({sel.unit})</span>
            </h2>
            <span className="text-xs text-muted">avg {NGN(sel.average)}</span>
          </div>
          {sel.reportCount > 0 && (
            <p className="mb-3 text-xs font-medium text-green">
              {sel.reportCount} live trader report{sel.reportCount === 1 ? "" : "s"} folded in
            </p>
          )}

          <div className="mt-3 flex flex-col gap-2">
            {sel.quotes.map((quote) => {
              const pct = Math.max(Math.round((quote.price / max) * 100), 22);
              const isLow = quote.market === sel.cheapest.market;
              const isHigh = quote.market === sel.highest.market;
              return (
                <div key={quote.market} className="flex items-center gap-3">
                  <span className="flex w-20 items-center gap-1 text-sm font-medium">
                    {quote.reported && <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" />}
                    {quote.market}
                  </span>
                  <div className="h-7 flex-1 overflow-hidden rounded-md bg-cream-2">
                    <div
                      className="flex h-full items-center justify-end rounded-md px-2 text-[11px] font-semibold text-white transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: isLow ? "var(--green)" : isHigh ? "var(--terracotta)" : "var(--gold-2)",
                      }}
                    >
                      {NGN(quote.price)}
                    </div>
                  </div>
                  <span className="w-6 text-center">
                    <Arrow dir={quote.dir} />
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg border border-green/20 bg-green/10 p-3">
            <p className="text-sm text-green-2">
              <span className="font-semibold">Insight: </span>
              Cheapest is <b className="capitalize">{sel.cheapest.market}</b> at {NGN(sel.cheapest.price)};
              dearest is <b className="capitalize">{sel.highest.market}</b> at {NGN(sel.highest.price)}.
              Buy in {sel.cheapest.market}, sell where price is high.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Live trader reports
          </h2>
          <Link href="/" className="text-xs font-semibold text-green hover:underline">
            Report a price →
          </Link>
        </div>
        {snap.reports.length === 0 ? (
          <p className="text-sm text-muted">
            No reports yet today. Go to <b>Talk</b> and say something like “Yam na 5,200 for Kano
            today” — it updates this feed live.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {snap.reports.map((report) => (
              <li key={report.id} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                <span className="capitalize">
                  <b>{report.market}</b> · {report.commodity}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-semibold text-green">{NGN(report.price)}</span>
                  <span className="text-[11px] text-muted">{timeAgo(report.ts)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
