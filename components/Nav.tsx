"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Talk", eyebrow: "Voice" },
  { href: "/business", label: "Business", eyebrow: "Books" },
  { href: "/market", label: "Market", eyebrow: "AMIN" },
  { href: "/receipts", label: "Receipts", eyebrow: "PDF" },
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
    <header className="sticky top-0 z-20 bg-green-2 shadow-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gold font-black text-green-2">
            A
          </div>
          <span className="hidden font-bold text-cream sm:inline">Africhain</span>
        </Link>

        <nav className="flex items-center gap-1 rounded-full bg-black/15 p-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium transition sm:px-4 ${
                  active ? "bg-gold text-green-2" : "text-cream/80 hover:text-cream"
                }`}
              >
                <span>{link.label}</span>
                <span className="hidden text-[10px] uppercase tracking-wide opacity-70 sm:inline">
                  {link.eyebrow}
                </span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={reset}
          disabled={resetting}
          className="shrink-0 rounded-lg bg-cream/10 px-3 py-1.5 text-xs text-cream transition hover:bg-cream/20 disabled:opacity-50"
        >
          {resetting ? "…" : "Reset"}
        </button>
      </div>
    </header>
  );
}
