"use client";

import type { BusinessState } from "@/lib/types";
import { NGN } from "@/lib/format";

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-sunken p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 text-xl font-bold tabular-nums" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

export default function BusinessDashboard({ state }: { state: BusinessState | null }) {
  if (!state) return <div className="text-sm text-muted">Loading…</div>;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {state.coach && (
        <div className="rounded-2xl bg-green-2 p-4 text-cream shadow-sm md:col-span-2">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="text-lg">Coach</span>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gold">
              AI Business Coach
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-cream/95">{state.coach}</p>
        </div>
      )}

      <div className="card p-4 md:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">{state.business}</h2>
          <span className="text-[11px] text-muted">Today</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Revenue" value={NGN(state.today.revenue)} accent="var(--green)" />
          <Stat label="Profit" value={NGN(state.today.profit)} accent="var(--green-2)" />
          <Stat label="Sales" value={String(state.today.salesCount)} />
          <Stat label="Owed to you" value={NGN(state.totals.outstandingDebt)} accent="var(--terracotta)" />
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Who owes you
        </h2>
        {state.debts.length === 0 ? (
          <p className="text-sm text-muted">Nobody is owing you. Good sign.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {state.debts.map((debt) => (
              <li key={debt.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="font-medium">{debt.customer}</span>
                  {debt.note && <span className="text-muted"> · {debt.note}</span>}
                </span>
                <span className="font-semibold text-terracotta">{NGN(debt.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Oga Tasks
        </h2>
        {state.tasks.length === 0 ? (
          <p className="text-sm text-muted">No tasks yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {state.tasks.map((task) => (
              <li key={task.id} className="flex items-center gap-2 text-sm">
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] ${
                    task.done ? "bg-green text-cream" : "border border-line"
                  }`}
                >
                  {task.done ? "✓" : ""}
                </span>
                <span className={task.done ? "line-through text-muted" : ""}>
                  <span className="font-medium">{task.who}</span> — {task.task}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted">Stock</h2>
          {state.lowStock.length > 0 && (
            <span className="rounded-full bg-terracotta/15 px-2 py-0.5 text-[10px] font-semibold text-terracotta">
              {state.lowStock.length} running low
            </span>
          )}
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {state.inventory.map((item) => {
            const low = item.qty <= item.lowAt;
            return (
              <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <span className={low ? "font-medium text-terracotta" : ""}>{item.item}</span>
                <span className={`font-semibold ${low ? "text-terracotta" : ""}`}>
                  {item.qty} {item.unit}
                  {low && " low"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="card p-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Recent sales
        </h2>
        <ul className="flex flex-col divide-y divide-line">
          {state.recentSales.map((sale) => (
            <li key={sale.id} className="flex items-center justify-between gap-3 py-1.5 text-sm">
              <span>
                {sale.qty} {sale.unit} of <span className="font-medium">{sale.item}</span>
              </span>
              <span className="font-semibold text-green">{NGN(sale.amount)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
