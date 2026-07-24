"use client";

import { useEffect, useState } from "react";
import ReceiptCreator from "@/components/ReceiptCreator";
import type { BusinessState } from "@/lib/types";

export default function ReceiptsPage() {
  const [state, setState] = useState<BusinessState | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        if (alive) setState(await response.json());
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
      <ReceiptCreator state={state} />
    </main>
  );
}
