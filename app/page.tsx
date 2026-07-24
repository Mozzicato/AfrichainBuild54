"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BusinessState } from "@/lib/types";
import type { MarketResult } from "@/lib/market";

type Turn = { role: "you" | "africhain"; text: string };

const LANGS = [
  { code: "en-NG", label: "English / Pidgin" },
  { code: "yo-NG", label: "Yorùbá" },
  { code: "ha-NG", label: "Hausa" },
  { code: "ig-NG", label: "Igbo" },
];

const NGN = (n: number) => "₦" + Math.round(n).toLocaleString();

const EXAMPLES = [
  "I sell six paint of rice for nine thousand naira",
  "Mama Nkechi collect two bag of sugar, she never pay, na five thousand",
  "Who dey owe me?",
  "How much yam dey for Sokoto today?",
  "Yam na five thousand two hundred for Kano today",
  "Wetin dey finish for my shop?",
  "I buy ten bag of sugar, add am to stock",
  "Tell Chidi make e sweep the shop",
  "Any advice for me?",
];

const CLOSE_OF_DAY = "How today go? Give me my close of day summary.";

export default function Home() {
  const [state, setState] = useState<BusinessState | null>(null);
  const [market, setMarket] = useState<MarketResult | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [transcript, setTranscript] = useState("");
  const [typed, setTyped] = useState("");
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [lang, setLang] = useState("en-NG");
  const [err, setErr] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/state", { cache: "no-store" });
      setState(await r.json());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    refresh();
    const Ctor =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    if (!Ctor) setSupported(false);
  }, [refresh]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, thinking]);

  const speak = useCallback(
    (text: string) => {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang;
        u.rate = 1;
        window.speechSynthesis.speak(u);
      } catch {
        /* no tts */
      }
    },
    [lang]
  );

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      setErr(null);
      setTurns((t) => [...t, { role: "you", text: clean }]);
      setTranscript("");
      setTyped("");
      setThinking(true);
      try {
        const r = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: clean }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Request failed");
        setTurns((t) => [...t, { role: "africhain", text: data.reply }]);
        setState(data.state);
        if (data.market) setMarket(data.market);
        speak(data.reply);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Something went wrong";
        setErr(msg);
        setTurns((t) => [...t, { role: "africhain", text: "⚠️ " + msg }]);
      } finally {
        setThinking(false);
      }
    },
    [speak]
  );

  const startListening = useCallback(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    let finalText = "";
    rec.onstart = () => {
      setListening(true);
      setErr(null);
    };
    rec.onresult = (e: SpeechRecognitionEventLike) => {
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      setTranscript((finalText + " " + interim).trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      if (finalText.trim()) send(finalText.trim());
    };
    recRef.current = rec;
    rec.start();
  }, [lang, send]);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const resetDemo = useCallback(async () => {
    const r = await fetch("/api/reset", { method: "POST" });
    setState(await r.json());
    setTurns([]);
    setMarket(null);
  }, []);

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="border-b border-[var(--line)] bg-[var(--green-2)]">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[var(--gold)] grid place-items-center text-[var(--green-2)] font-black text-xl">
              A
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight text-cream">Africhain</h1>
              <p className="text-xs text-cream/70 leading-tight">
                Talk to your business — in your language
              </p>
            </div>
          </div>
          <button
            onClick={resetDemo}
            className="text-xs px-3 py-1.5 rounded-lg bg-cream/10 hover:bg-cream/20 text-cream transition"
          >
            Reset demo
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* LEFT — Voice console */}
        <section className="flex flex-col gap-4">
          <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-5 shadow-sm">
            <div className="flex flex-wrap gap-2 mb-4">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition ${
                    lang === l.code
                      ? "bg-[var(--green)] text-cream border-[var(--green)]"
                      : "bg-transparent text-[var(--muted)] border-[var(--line)] hover:border-[var(--green)]"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center py-4">
              <button
                onClick={listening ? stopListening : startListening}
                disabled={thinking}
                className={`h-28 w-28 rounded-full grid place-items-center text-cream text-4xl transition disabled:opacity-50 ${
                  listening
                    ? "bg-[var(--terracotta)] listening"
                    : "bg-[var(--green)] hover:bg-[var(--green-2)]"
                }`}
                aria-label="Speak"
              >
                {listening ? "◼" : "🎙"}
              </button>
              <p className="mt-3 text-sm text-[var(--muted)] h-5">
                {thinking
                  ? "Africhain dey think…"
                  : listening
                  ? "Listening… tap to stop"
                  : "Tap and speak"}
              </p>
              {transcript && (
                <p className="mt-1 text-center text-[var(--ink)] font-medium fade-up">
                  “{transcript}”
                </p>
              )}
            </div>

            {!supported && (
              <p className="text-xs text-[var(--terracotta)] text-center mb-2">
                Voice not supported in this browser — use Chrome, or type below.
              </p>
            )}

            {/* Text fallback — the demo never dies */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(typed);
              }}
              className="flex gap-2"
            >
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="…or type what you would say"
                className="flex-1 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--green)]"
              />
              <button
                type="submit"
                disabled={thinking || !typed.trim()}
                className="rounded-lg bg-[var(--gold)] hover:bg-[var(--gold-2)] text-[var(--green-2)] font-semibold px-4 text-sm disabled:opacity-50"
              >
                Send
              </button>
            </form>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => send(CLOSE_OF_DAY)}
                disabled={thinking}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[var(--green)] text-cream hover:bg-[var(--green-2)] transition disabled:opacity-50"
              >
                📋 Close of day
              </button>
              <span className="text-[11px] text-[var(--muted)]">
                or tap an example:
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => send(ex)}
                  disabled={thinking}
                  className="text-[11px] px-2 py-1 rounded-md bg-[var(--cream-2)] text-[var(--muted)] hover:text-[var(--ink)] transition disabled:opacity-50"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation */}
          <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-4 shadow-sm min-h-[180px]">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">
              Conversation
            </h2>
            {turns.length === 0 && !thinking ? (
              <p className="text-sm text-[var(--muted)]">
                Say something like “I sell five basket of tomato for two thousand”.
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
                {turns.map((t, i) => (
                  <div
                    key={i}
                    className={`fade-up max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                      t.role === "you"
                        ? "self-end bg-[var(--green)] text-cream"
                        : "self-start bg-[var(--cream-2)] text-[var(--ink)]"
                    }`}
                  >
                    {t.text}
                  </div>
                ))}
                {thinking && (
                  <div className="self-start bg-[var(--cream-2)] rounded-2xl px-4 py-3 flex gap-1.5">
                    <span className="dot h-2 w-2 rounded-full bg-[var(--muted)]" />
                    <span className="dot h-2 w-2 rounded-full bg-[var(--muted)]" />
                    <span className="dot h-2 w-2 rounded-full bg-[var(--muted)]" />
                  </div>
                )}
                <div ref={logEndRef} />
              </div>
            )}
          </div>

          {/* AMIN market panel */}
          {market && <MarketPanel m={market} />}
        </section>

        {/* RIGHT — Dashboard */}
        <section className="flex flex-col gap-4">
          <Dashboard state={state} />
        </section>
      </main>

      {/* Vision strip — for judges */}
      <section className="mx-auto max-w-6xl px-4 pb-2">
        <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gold-2)] mb-2">
            Where this goes
          </p>
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <div>
              <p className="font-semibold text-[var(--green-2)]">Today (MVP)</p>
              <p className="text-[var(--muted)]">
                Voice bookkeeping, debts, Oga Tasks & AMIN price lookup on curated
                data — in 5 languages.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--green-2)]">AMIN, live</p>
              <p className="text-[var(--muted)]">
                Same interface, real feeds: government data, exchanges & crowdsourced
                trader prices nationwide.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[var(--green-2)]">The platform</p>
              <p className="text-[var(--muted)]">
                Predictive intelligence, embedded lending & insurance on trusted
                business records. Pan-African.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 py-6 text-center text-[11px] text-[var(--muted)]">
        Africhain · MVP demo · AMIN prices are curated for this demo, architected
        for live ingestion.
      </footer>

      {err && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[var(--terracotta)] text-white text-xs px-3 py-2 rounded-lg shadow">
          {err}
        </div>
      )}
    </div>
  );
}

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

function Dashboard({ state }: { state: BusinessState | null }) {
  if (!state) return <div className="text-sm text-[var(--muted)]">Loading…</div>;
  return (
    <>
      {/* AI Coach — always-on, proactive */}
      {state.coach && (
        <div className="rounded-2xl bg-[var(--green-2)] text-cream p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-lg">🧠</span>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--gold)]">
              AI Business Coach
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-cream/95">{state.coach}</p>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">{state.business}</h2>
          <span className="text-[11px] text-[var(--muted)]">Today</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Revenue" value={NGN(state.today.revenue)} accent="var(--green)" />
          <Stat label="Profit" value={NGN(state.today.profit)} accent="var(--green-2)" />
          <Stat label="Sales" value={String(state.today.salesCount)} />
          <Stat
            label="Owed to you"
            value={NGN(state.totals.outstandingDebt)}
            accent="var(--terracotta)"
          />
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
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Stock
          </h2>
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
                <span className={low ? "text-[var(--terracotta)] font-medium" : ""}>
                  {it.item}
                </span>
                <span className={`font-semibold ${low ? "text-[var(--terracotta)]" : "text-[var(--ink)]"}`}>
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
    </>
  );
}

function MarketPanel({ m }: { m: MarketResult }) {
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
                    background: isLow
                      ? "var(--green)"
                      : isHigh
                      ? "var(--terracotta)"
                      : "var(--gold-2)",
                  }}
                >
                  {NGN(q.price)}
                </div>
              </div>
              {isLow ? (
                <span className="text-[10px] font-semibold text-[var(--green)] w-14">
                  cheapest
                </span>
              ) : isHigh ? (
                <span className="text-[10px] font-semibold text-[var(--terracotta)] w-14">
                  highest
                </span>
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
