"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { BusinessState } from "@/lib/types";
import type { MarketResult } from "@/lib/market";
import { NGN } from "@/lib/format";
import MarketPanel from "@/components/MarketPanel";

type Mode = "sales" | "prices" | "inventory";
type Turn = { role: "you" | "africhain"; text: string; mode?: Mode };

const LANGS = [
  { code: "en-NG", label: "English / Pidgin" },
  { code: "yo-NG", label: "Yoruba" },
  { code: "ha-NG", label: "Hausa" },
  { code: "ig-NG", label: "Igbo" },
];

const MODES: Record<
  Mode,
  {
    title: string;
    short: string;
    helper: string;
    cta: string;
    accent: string;
    examples: string[];
  }
> = {
  sales: {
    title: "Log sales",
    short: "Sales, debts and expenses",
    helper: "Use this when money enters or leaves the shop.",
    cta: "Record sale",
    accent: "bg-green text-cream",
    examples: [
      "I sell six paint of rice for nine thousand naira",
      "Mama Nkechi collect two bag of sugar, she never pay, na five thousand",
      "Chidi paid three thousand from him debt",
      "Add fuel expense three thousand five hundred",
    ],
  },
  prices: {
    title: "Ask live prices",
    short: "AMIN market intelligence",
    helper: "Use this before restocking or reporting market prices.",
    cta: "Check price",
    accent: "bg-gold text-green-2",
    examples: [
      "How much yam dey for Sokoto today?",
      "Where rice cheap today?",
      "Tomato na six thousand five hundred for Mile 12 today",
      "Compare pepper price for Kano and Abuja",
    ],
  },
  inventory: {
    title: "Update inventory",
    short: "Stock in, stock out, low stock",
    helper: "Use this to keep stock accurate as you buy and sell.",
    cta: "Update stock",
    accent: "bg-terracotta text-white",
    examples: [
      "I buy ten bag of sugar, add am to stock",
      "How many bag of rice remain?",
      "Wetin dey finish for my shop?",
      "Add twenty carton of milk to inventory",
    ],
  },
};

const CLOSE_OF_DAY = "How today go? Give me my close of day summary.";

export default function TalkPage() {
  const [state, setState] = useState<BusinessState | null>(null);
  const [market, setMarket] = useState<MarketResult | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [transcript, setTranscript] = useState("");
  const [typed, setTyped] = useState("");
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [lang, setLang] = useState("en-NG");
  const [mode, setMode] = useState<Mode>("sales");
  const [err, setErr] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        const data = await response.json();
        if (alive) setState(data);
      } catch {
        /* ignore */
      }
    };
    load();
    const poll = setInterval(load, 5000);
    const Ctor =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    // One-time browser-capability detection.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!Ctor) setSupported(false);
    return () => {
      alive = false;
      clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, thinking]);

  const speak = useCallback(
    (text: string) => {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.95;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
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
      setTurns((items) => [...items, { role: "you", text: clean, mode }]);
      setTranscript("");
      setTyped("");
      setThinking(true);
      try {
        const response = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: clean, mode }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Request failed");
        setTurns((items) => [...items, { role: "africhain", text: data.reply, mode }]);
        setState(data.state);
        if (data.market) setMarket(data.market);
        speak(data.reply);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Something went wrong";
        setErr(msg);
        setTurns((items) => [...items, { role: "africhain", text: `Warning: ${msg}`, mode }]);
      } finally {
        setThinking(false);
      }
    },
    [mode, speak]
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
    rec.continuous = true;
    rec.maxAlternatives = 3;
    let finalText = "";
    let latestText = "";

    rec.onstart = () => {
      setListening(true);
      setErr(null);
      setTranscript("");
    };
    rec.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = "";
      for (let index = event.resultIndex || 0; index < event.results.length; index++) {
        const result = event.results[index];
        const best = result[0]?.transcript || "";
        if (result.isFinal) finalText = `${finalText} ${best}`.trim();
        else interim = `${interim} ${best}`.trim();
      }
      latestText = `${finalText} ${interim}`.trim();
      setTranscript(latestText);
    };
    rec.onerror = () => {
      setListening(false);
      setErr("I could not hear clearly. Try the right mode, move closer, or type it.");
    };
    rec.onend = () => {
      setListening(false);
      const heard = finalText.trim() || latestText.trim();
      if (heard) send(heard);
    };
    recRef.current = rec;
    rec.start();
  }, [lang, send]);

  const stopListening = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const active = MODES[mode];
  const hasChat = turns.length > 0 || thinking;
  const lowStock = state?.inventory.filter((item) => item.qty <= item.lowAt).slice(0, 4) || [];

  return (
    <main className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-6 lg:grid-cols-[1.12fr_0.88fr]">
      <section className="flex flex-col gap-5">
        <div className="relative overflow-hidden rounded-3xl bg-green-2 p-5 text-cream sm:p-6">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold/20" />
          <div className="relative">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Africhain voice counter
            </p>
            <h1 className="max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">
              Choose what you want to do, then talk.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-cream/85 sm:text-base">
              Separate modes help Africhain hear better: logging sales, checking live prices, or updating stock.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {(Object.keys(MODES) as Mode[]).map((key) => {
            const item = MODES[key];
            const selected = key === mode;
            return (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selected
                    ? "border-green bg-white shadow-md"
                    : "border-line bg-surface/80 hover:-translate-y-0.5 hover:border-green"
                }`}
              >
                <span className={`mb-3 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${item.accent}`}>
                  {item.cta}
                </span>
                <h2 className="font-bold text-green-2">{item.title}</h2>
                <p className="mt-1 text-xs text-muted">{item.short}</p>
              </button>
            );
          })}
        </div>

        <div className="card p-6">
          <div className="mb-5 rounded-2xl border border-line bg-surface-sunken p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="eyebrow mb-1">Current voice mode</p>
                <h2 className="text-xl font-black text-green-2">{active.title}</h2>
                <p className="mt-1 text-sm text-muted">{active.helper}</p>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${active.accent}`}>
                {active.cta}
              </span>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {LANGS.map((item) => (
              <button
                key={item.code}
                onClick={() => setLang(item.code)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  lang === item.code
                    ? "border-green bg-green text-cream shadow-sm"
                    : "border-line bg-transparent text-muted hover:border-green hover:text-green"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center">
            <button
              onClick={listening ? stopListening : startListening}
              disabled={thinking}
              className={`grid h-32 w-32 place-items-center rounded-full text-2xl font-black text-cream shadow-lg transition-transform active:scale-95 disabled:opacity-50 ${
                listening ? "listening bg-terracotta" : "bg-green hover:scale-[1.03] hover:bg-green-2"
              }`}
              style={{ boxShadow: "var(--shadow-lg)" }}
              aria-label={listening ? "Stop recording" : "Start recording"}
            >
              {listening ? "Stop" : "Mic"}
            </button>
            <p className="mt-4 h-5 text-sm font-medium text-muted">
              {thinking ? "Africhain dey think..." : listening ? "Listening... tap again when done" : "Tap and speak"}
            </p>
            {transcript && <p className="fade-up mt-1 text-center font-medium text-ink">&quot;{transcript}&quot;</p>}
          </div>

          {!supported && (
            <p className="mt-4 text-center text-xs text-terracotta">
              Voice is not supported in this browser - use Chrome, or type below.
            </p>
          )}

          <div className="mt-6 flex gap-2">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                send(typed);
              }}
              className="flex flex-1 gap-2"
            >
              <input
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder={`Type a ${active.title.toLowerCase()} command`}
                className="flex-1 rounded-xl border border-line bg-surface-sunken px-4 py-2.5 text-sm outline-none transition focus:border-green focus:bg-white"
              />
              <button
                type="submit"
                disabled={thinking || !typed.trim()}
                className="rounded-xl bg-gold px-4 text-sm font-semibold text-green-2 transition hover:bg-gold-2 disabled:opacity-50"
              >
                Send
              </button>
            </form>
            <button
              onClick={() => send(CLOSE_OF_DAY)}
              disabled={thinking}
              title="Get your close-of-day summary"
              className="shrink-0 rounded-xl bg-green px-3.5 text-sm font-semibold text-cream transition hover:bg-green-2 disabled:opacity-50"
            >
              Summary
            </button>
          </div>
        </div>

        <div className="card min-h-50 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="eyebrow">Try in {active.title}</h2>
            <span className="text-xs text-muted">Mode helps Africhain understand noisy speech</span>
          </div>
          {!hasChat ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {active.examples.map((example) => (
                <button
                  key={example}
                  onClick={() => send(example)}
                  className="rounded-xl border border-line bg-surface-sunken px-3.5 py-2.5 text-left text-sm text-ink transition hover:border-green hover:bg-white"
                >
                  <span className="mr-1.5 text-muted">&quot;</span>
                  {example}
                  <span className="ml-0.5 text-muted">&quot;</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex max-h-[22rem] flex-col gap-2.5 overflow-y-auto pr-1">
              {turns.map((turn, index) => (
                <div
                  key={index}
                  className={`fade-up max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                    turn.role === "you"
                      ? "self-end rounded-br-md bg-green text-cream"
                      : "self-start rounded-bl-md bg-cream-2 text-ink"
                  }`}
                >
                  {turn.mode && turn.role === "you" && (
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-cream/70">
                      {MODES[turn.mode].title}
                    </span>
                  )}
                  {turn.text}
                </div>
              ))}
              {thinking && (
                <div className="flex gap-1.5 self-start rounded-2xl rounded-bl-md bg-cream-2 px-4 py-3">
                  <span className="dot h-2 w-2 rounded-full bg-muted" />
                  <span className="dot h-2 w-2 rounded-full bg-muted" />
                  <span className="dot h-2 w-2 rounded-full bg-muted" />
                </div>
              )}
              <div ref={logEndRef} />
            </div>
          )}
        </div>

        {market && <MarketPanel m={market} />}
      </section>

      <section className="flex flex-col gap-4 lg:sticky lg:top-20">
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">{state?.business || "Your shop"}</h2>
            <Link href="/business" className="text-xs font-semibold text-green hover:underline">
              Full dashboard -&gt;
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Mini label="Today revenue" value={state ? NGN(state.today.revenue) : "-"} accent="var(--green)" />
            <Mini label="Profit" value={state ? NGN(state.today.profit) : "-"} accent="var(--green-2)" />
            <Mini label="Sales" value={state ? String(state.today.salesCount) : "-"} />
            <Mini
              label="Owed to you"
              value={state ? NGN(state.totals.outstandingDebt) : "-"}
              accent="var(--terracotta)"
            />
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="eyebrow">Stock watch</p>
            <Link href="/business" className="text-xs font-semibold text-green hover:underline">
              Inventory -&gt;
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted">Stock looks healthy right now.</p>
          ) : (
            <div className="space-y-2">
              {lowStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-surface-sunken p-3 text-sm">
                  <span className="font-semibold capitalize text-green-2">{item.item}</span>
                  <span className="font-bold text-terracotta">
                    {item.qty} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-4">
          <p className="eyebrow mb-3">Better hearing</p>
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-semibold text-green-2">Pick the right mode:</span>{" "}
              it tells Africhain whether to expect sales, prices or stock.
            </p>
            <p>
              <span className="font-semibold text-green-2">Say the key numbers last:</span>{" "}
              &quot;six paint of rice, nine thousand naira&quot; is easier to confirm.
            </p>
            <p>
              <span className="font-semibold text-green-2">Check the transcript:</span>{" "}
              if the market is noisy, type the correction before sending.
            </p>
          </div>
        </div>

        {state?.coach && (
          <div className="rounded-2xl bg-green-2 p-4 text-cream" style={{ boxShadow: "var(--shadow-md)" }}>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-lg">Coach</span>
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-gold">
                AI Business Coach
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-cream/95">{state.coach}</p>
          </div>
        )}

        <Link
          href="/receipts"
          className="group rounded-2xl border-2 border-gold/60 bg-surface p-4 transition hover:-translate-y-0.5 hover:border-gold"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-green-2">Receipt creator</p>
              <p className="text-xs text-muted">Download a PDF from any recent sale</p>
            </div>
            <span className="text-sm font-semibold text-green transition group-hover:translate-x-0.5">
              Open -&gt;
            </span>
          </div>
        </Link>
      </section>

      {err && (
        <div className="fade-up fixed bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-terracotta px-3 py-2 text-xs text-white shadow-lg">
          {err}
        </div>
      )}
    </main>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-sunken p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}
