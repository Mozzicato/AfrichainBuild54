"use client";

import type { MarketResult } from "@/lib/market";
import { NGN } from "@/lib/format";

export default function MarketPanel({ m }: { m: MarketResult }) {
  const max = m.highest.price;
  return (
    <div
      className="fade-up rounded-2xl border-2 border-gold bg-surface p-5"
      style={{ boxShadow: "var(--shadow-md)" }}
    >
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="font-bold text-green-2">
          AMIN · {m.commodity} prices{" "}
          <span className="text-sm font-normal text-muted">({m.unit})</span>
        </h2>
        {m.source === "live" ? (
          <span className="flex items-center gap-1 rounded-full bg-green/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green">
            <span className="listening inline-block h-1.5 w-1.5 rounded-full bg-green" />
            live · {m.reportCount} report{m.reportCount === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-2">
            curated · today
          </span>
        )}
      </div>
      <p className="mb-4 text-xs text-muted">
        Africhain Market Intelligence Network
        {m.source === "live" && " · updated by traders like you"}
      </p>

      <div className="flex flex-col gap-2">
        {m.quotes.map((quote) => {
          const pct = Math.round((quote.price / max) * 100);
          const isLow = quote.market === m.cheapest.market;
          const isHigh = quote.market === m.highest.market;
          return (
            <div key={quote.market} className="flex items-center gap-3">
              <span className="flex w-16 items-center gap-1 text-sm font-medium">
                {quote.reported && (
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green" title="trader-reported" />
                )}
                {quote.market}
              </span>
              <div className="h-6 flex-1 overflow-hidden rounded-md bg-cream-2">
                <div
                  className="bar-grow flex h-full items-center justify-end rounded-md px-2 text-[11px] font-semibold text-white"
                  style={{
                    width: `${Math.max(pct, 22)}%`,
                    background: isLow ? "var(--green)" : isHigh ? "var(--terracotta)" : "var(--gold-2)",
                  }}
                >
                  {NGN(quote.price)}
                </div>
              </div>
              {isLow ? (
                <span className="w-14 text-[10px] font-semibold text-green">cheapest</span>
              ) : isHigh ? (
                <span className="w-14 text-[10px] font-semibold text-terracotta">highest</span>
              ) : (
                <span className="w-14" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg border border-green/20 bg-green/10 p-3">
        <p className="text-sm text-green-2">
          <span className="font-semibold">Insight: </span>
          {m.recommendation}
        </p>
      </div>
    </div>
  );
}
