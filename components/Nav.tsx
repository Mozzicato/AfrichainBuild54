"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Talk", icon: "🎙" },
  { href: "/business", label: "Business", icon: "📊" },
  { href: "/market", label: "Market", icon: "🌍" },
];

export default function Nav() {
  const pathname = usePathname();
  const [resetting, setResetting] = useState(false);

  const reset = async () => {
    setResetting(true);
    try {
      await fetch("/api/reset", { method: "POST" });
      window.location.reload();
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-[var(--green-2)] shadow-sm">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-[var(--gold)] grid place-items-center text-[var(--green-2)] font-black">
            A
          </div>
          <span className="text-cream font-bold hidden sm:inline">Africhain</span>
        </Link>

        <nav className="flex items-center gap-1 bg-black/15 rounded-full p-1">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1.5 ${
                  active
                    ? "bg-[var(--gold)] text-[var(--green-2)]"
                    : "text-cream/80 hover:text-cream"
                }`}
              >
                <span>{l.icon}</span>
                <span>{l.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={reset}
          disabled={resetting}
          className="text-xs px-3 py-1.5 rounded-lg bg-cream/10 hover:bg-cream/20 text-cream transition disabled:opacity-50 shrink-0"
        >
          {resetting ? "…" : "Reset"}
        </button>
      </div>
    </header>
  );
}
