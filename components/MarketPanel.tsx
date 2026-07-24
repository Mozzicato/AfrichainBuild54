"use client";

import type { MarketResult } from "@/lib/market";
import { NGN } from "@/lib/format";

export default function MarketPanel({ m }: { m: MarketResult }) {
  const max = m.highest.price;
  return (
    <div className="rounded-2xl border-2 border-[var(--gold)] bg-white p-5 shadow-sm fade-up">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-bold text-[var(--green-2)]">
          AMIN · {m.commodity} prices{" "}
          <span className="text-[var(--muted)] font-normal text-sm">({m.unit})</span>
        </h2>
        {m.source === "live" ? (
          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--green)]/15 text-[var(--green)] font-semibold flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)] listening inline-block" />
            live · {m.reportCount} report{m.reportCount === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--gold)]/20 text-[var(--gold-2)] font-semibold">
            curated · today
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--muted)] mb-4">
        Africhain Market Intelligence Network
        {m.source === "live" && " · updated by traders like you"}
      </p>

      <div className="flex flex-col gap-2">
        {m.quotes.map((q) => {
          const pct = Math.round((q.price / max) * 100);
          const isLow = q.market === m.cheapest.market;
          const isHigh = q.market === m.highest.market;
          return (
            <div key={q.market} className="flex items-center gap-3">
              <span className="w-16 text-sm font-medium flex items-center gap-1">
                {q.reported && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--green)] inline-block" title="trader-reported" />
                )}
                {q.market}
              </span>
              <div className="flex-1 h-6 rounded-md bg-[var(--cream-2)] overflow-hidden">
                <div
                  className="bar-grow h-full rounded-md flex items-center justify-end px-2 text-[11px] font-semibold text-white"
                  style={{
                    width: `${Math.max(pct, 22)}%`,
                    background: isLow ? "var(--green)" : isHigh ? "var(--terracotta)" : "var(--gold-2)",
                  }}
                >
                  {NGN(q.price)}
                </div>
              </div>
              {isLow ? (
                <span className="text-[10px] font-semibold text-[var(--green)] w-14">cheapest</span>
              ) : isHigh ? (
                <span className="text-[10px] font-semibold text-[var(--terracotta)] w-14">highest</span>
              ) : (
                <span className="w-14" />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg bg-[var(--green)]/10 border border-[var(--green)]/20 p-3">
        <p className="text-sm text-[var(--green-2)]">
          <span className="font-semibold">💡 </span>
          {m.recommendation}
        </p>
      </div>
    </div>
  );
}
