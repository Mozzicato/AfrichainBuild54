"use client";

import { useEffect, useState } from "react";
import type { BusinessState } from "@/lib/types";
import BusinessDashboard from "@/components/BusinessDashboard";

export default function BusinessPage() {
  const [state, setState] = useState<BusinessState | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/state", { cache: "no-store" });
        if (alive) setState(await r.json());
      } catch {
        /* ignore */
      }
    };
    load();
    const poll = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(poll);
    };
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-[var(--green-2)]">Business</h1>
        <p className="text-sm text-[var(--muted)]">
          Your books, debts, tasks and stock — updated as you talk.
        </p>
      </div>
      <BusinessDashboard state={state} />

      {/* Vision strip */}
      <section className="mt-6">
        <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gold-2)] mb-2">
            Where this goes
          </p>
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <div>
              <p className="font-semibold text-[var(--green-2)]">Today (MVP)</p>
              <p className="text-[var(--muted)]">
                Voice bookkeeping, debts, tasks, stock & AMIN prices — in 5 languages.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--green-2)]">AMIN network</p>
              <p className="text-[var(--muted)]">
                Live crowdsourced prices today; government & exchange feeds next.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--green-2)]">The platform</p>
              <p className="text-[var(--muted)]">
                Group buying, predictive intelligence, embedded lending & insurance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
