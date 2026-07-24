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
            What Africhain helps you do
          </p>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="font-semibold text-green-2">Keep clean books</p>
              <p className="text-muted">
                Sales, debts, tasks and stock stay organised from ordinary speech.
              </p>
            </div>
            <div>
              <p className="font-semibold text-green-2">Restock with confidence</p>
              <p className="text-muted">
                Compare market prices before you buy, sell or send someone to market.
              </p>
            </div>
            <div>
              <p className="font-semibold text-green-2">Grow with proof</p>
              <p className="text-muted">
                Your records become evidence for better decisions, credit and partnerships.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
