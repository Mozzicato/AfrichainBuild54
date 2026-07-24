"use client";

import type { BusinessState } from "@/lib/types";
import { NGN } from "@/lib/format";

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="text-xl font-bold mt-0.5" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

export default function BusinessDashboard({ state }: { state: BusinessState | null }) {
  if (!state) return <div className="text-sm text-[var(--muted)]">Loading…</div>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Coach — spans both columns */}
      {state.coach && (
        <div className="md:col-span-2 rounded-2xl bg-[var(--green-2)] text-cream p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-lg">🧠</span>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
              AI Business Coach
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-cream/95">{state.coach}</p>
        </div>
      )}

      {/* Today's numbers */}
      <div className="md:col-span-2 rounded-2xl border border-[var(--line)] bg-white/60 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">{state.business}</h2>
          <span className="text-[11px] text-[var(--muted)]">Today</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Revenue" value={NGN(state.today.revenue)} accent="var(--green)" />
          <Stat label="Profit" value={NGN(state.today.profit)} accent="var(--green-2)" />
          <Stat label="Sales" value={String(state.today.salesCount)} />
          <Stat label="Owed to you" value={NGN(state.totals.outstandingDebt)} accent="var(--terracotta)" />
        </div>
      </div>

      {/* Debts */}
      <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
          Who owes you
        </h2>
        {state.debts.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nobody is owing you. 👍</p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--line)]">
            {state.debts.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2 text-sm">
                <span>
                  <span className="font-medium">{d.customer}</span>
                  {d.note && <span className="text-[var(--muted)]"> · {d.note}</span>}
                </span>
                <span className="font-semibold text-[var(--terracotta)]">{NGN(d.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Oga Tasks */}
      <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
          Oga Tasks
        </h2>
        {state.tasks.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No tasks yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {state.tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm">
                <span
                  className={`h-4 w-4 shrink-0 rounded-full grid place-items-center text-[10px] ${
                    t.done ? "bg-[var(--green)] text-cream" : "border border-[var(--line)]"
                  }`}
                >
                  {t.done ? "✓" : ""}
                </span>
                <span className={t.done ? "line-through text-[var(--muted)]" : ""}>
                  <span className="font-medium">{t.who}</span> — {t.task}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Inventory */}
      <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Stock</h2>
          {state.lowStock.length > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--terracotta)]/15 text-[var(--terracotta)]">
              {state.lowStock.length} running low
            </span>
          )}
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {state.inventory.map((it) => {
            const low = it.qty <= it.lowAt;
            return (
              <li key={it.id} className="flex items-center justify-between text-sm">
                <span className={low ? "text-[var(--terracotta)] font-medium" : ""}>{it.item}</span>
                <span className={`font-semibold ${low ? "text-[var(--terracotta)]" : ""}`}>
                  {it.qty} {it.unit}
                  {low && " ⚠"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Recent sales */}
      <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-2">
          Recent sales
        </h2>
        <ul className="flex flex-col divide-y divide-[var(--line)]">
          {state.recentSales.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-1.5 text-sm">
              <span>
                {s.qty} {s.unit} of <span className="font-medium">{s.item}</span>
              </span>
              <span className="font-semibold text-[var(--green)]">{NGN(s.amount)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
