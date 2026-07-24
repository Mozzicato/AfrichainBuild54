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
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-green-2 sm:text-3xl">Business</h1>
        <p className="mt-1 text-sm text-muted">
          Your books, debts, tasks and stock — updated as you talk.
        </p>
      </div>
      <BusinessDashboard state={state} />

      <section className="mt-6">
        <div className="card p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gold-2">
            Where this goes
          </p>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="font-semibold text-green-2">Today (MVP)</p>
              <p className="text-muted">
                Voice bookkeeping, debts, tasks, stock and AMIN prices — in local language.
              </p>
            </div>
            <div>
              <p className="font-semibold text-green-2">AMIN network</p>
              <p className="text-muted">
                Live crowdsourced prices today; verified exchange and government feeds next.
              </p>
            </div>
            <div>
              <p className="font-semibold text-green-2">The platform</p>
              <p className="text-muted">
                Group buying, predictive intelligence, embedded lending and insurance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
