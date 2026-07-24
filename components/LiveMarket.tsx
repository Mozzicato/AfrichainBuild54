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
  if (dir === "up") return <span className="text-[var(--green)] text-xs">▲</span>;
  if (dir === "down") return <span className="text-[var(--terracotta)] text-xs">▼</span>;
  return <span className="text-[var(--muted)] text-xs">–</span>;
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
    const clock = setInterval(() => tick((n) => n + 1), 1000); // refresh "updated Xs ago"
    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(clock);
    };
  }, []);

  if (!snap) return <p className="text-sm text-[var(--muted)]">Loading live market…</p>;

  const sel = snap.commodities.find((c) => c.commodity === selected) || snap.commodities[0];
  const max = sel.highest.price;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[var(--green-2)]">AMIN Live</h1>
          <p className="text-sm text-[var(--muted)]">
            Africhain Market Intelligence Network — prices across Nigeria&apos;s markets
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--green)]/15 text-[var(--green)] font-semibold">
            <span className="h-2 w-2 rounded-full bg-[var(--green)] listening inline-block" />
            LIVE
          </span>
          <span className="text-[var(--muted)]">updated {timeAgo(snap.updatedAt)}</span>
        </div>
      </div>

      {/* Ticker strip */}
      <div className="rounded-xl bg-[var(--green-2)] text-cream px-3 py-2 overflow-x-auto">
        <div className="flex gap-5 min-w-max text-sm">
          {snap.commodities.map((c) => (
            <button
              key={c.commodity}
              onClick={() => setSelected(c.commodity)}
              className="flex items-center gap-1.5 whitespace-nowrap hover:text-[var(--gold)] transition"
            >
              <span className="font-semibold capitalize">{c.commodity}</span>
              <span className="text-cream/80">{NGN(c.cheapest.price)}</span>
              <Arrow dir={c.cheapest.dir} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* Commodity list */}
        <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-3 shadow-sm h-max">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] px-1 mb-2">
            Commodities
          </h2>
          <ul className="flex flex-col">
            {snap.commodities.map((c) => {
              const active = c.commodity === sel.commodity;
              return (
                <li key={c.commodity}>
                  <button
                    onClick={() => setSelected(c.commodity)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                      active ? "bg-[var(--green)] text-cream" : "hover:bg-[var(--cream-2)]"
                    }`}
                  >
                    <span className="capitalize font-medium flex items-center gap-1.5">
                      {c.commodity}
                      {c.reportCount > 0 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)] inline-block" />
                      )}
                    </span>
                    <span className="flex items-center gap-1">
                      {NGN(c.cheapest.price)}
                      <Arrow dir={c.cheapest.dir} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Selected commodity detail */}
        <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold capitalize text-[var(--green-2)]">
              {sel.commodity}{" "}
              <span className="text-sm font-normal text-[var(--muted)]">({sel.unit})</span>
            </h2>
            <span className="text-xs text-[var(--muted)]">avg {NGN(sel.average)}</span>
          </div>
          {sel.reportCount > 0 && (
            <p className="text-xs text-[var(--green)] font-medium mb-3">
              🟢 {sel.reportCount} live trader report{sel.reportCount === 1 ? "" : "s"} folded in
            </p>
          )}

          <div className="flex flex-col gap-2 mt-3">
            {sel.quotes.map((q) => {
              const pct = Math.max(Math.round((q.price / max) * 100), 22);
              const isLow = q.market === sel.cheapest.market;
              const isHigh = q.market === sel.highest.market;
              return (
                <div key={q.market} className="flex items-center gap-3">
                  <span className="w-20 text-sm font-medium flex items-center gap-1">
                    {q.reported && <span className="h-1.5 w-1.5 rounded-full bg-[var(--gold)] inline-block" />}
                    {q.market}
                  </span>
                  <div className="flex-1 h-7 rounded-md bg-[var(--cream-2)] overflow-hidden">
                    <div
                      className="h-full rounded-md flex items-center justify-end px-2 text-[11px] font-semibold text-white transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: isLow ? "var(--green)" : isHigh ? "var(--terracotta)" : "var(--gold-2)",
                      }}
                    >
                      {NGN(q.price)}
                    </div>
                  </div>
                  <span className="w-6 text-center">
                    <Arrow dir={q.dir} />
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg bg-[var(--green)]/10 border border-[var(--green)]/20 p-3">
            <p className="text-sm text-[var(--green-2)]">
              <span className="font-semibold">💡 </span>
              Cheapest is <b className="capitalize">{sel.cheapest.market}</b> at {NGN(sel.cheapest.price)}
              ; dearest is <b className="capitalize">{sel.highest.market}</b> at {NGN(sel.highest.price)}. Buy
              in {sel.cheapest.market}, sell where price is high.
            </p>
          </div>
        </div>
      </div>

      {/* Recent trader reports */}
      <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Live trader reports
          </h2>
          <Link href="/" className="text-xs font-semibold text-[var(--green)] hover:underline">
            🎙 Report a price →
          </Link>
        </div>
        {snap.reports.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No reports yet today. Go to <b>Talk</b> and say something like “Yam na 5,200 for Kano
            today” — it updates this feed live.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--line)]">
            {snap.reports.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-1.5 text-sm">
                <span className="capitalize">
                  <b>{r.market}</b> · {r.commodity}
                </span>
                <span className="flex items-center gap-3">
                  <span className="font-semibold text-[var(--green)]">{NGN(r.price)}</span>
                  <span className="text-[11px] text-[var(--muted)]">{timeAgo(r.ts)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
