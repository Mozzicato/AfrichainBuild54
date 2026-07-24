"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { BusinessState } from "@/lib/types";
import type { MarketResult } from "@/lib/market";
import { NGN } from "@/lib/format";
import MarketPanel from "@/components/MarketPanel";

type Turn = { role: "you" | "africhain"; text: string };

const LANGS = [
  { code: "en-NG", label: "English / Pidgin" },
  { code: "yo-NG", label: "Yorùbá" },
  { code: "ha-NG", label: "Hausa" },
  { code: "ig-NG", label: "Igbo" },
];

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

const QUICK_ACTIONS = [
  "Record sales",
  "Track debt",
  "Check stock",
  "Compare prices",
  "Get advice",
];

const JUDGE_WINS = [
  { label: "Voice-first", value: "No forms" },
  { label: "Local language", value: "Pidgin, Yoruba, Hausa, Igbo" },
  { label: "Market network", value: "Prices traders can update" },
];

export default function TalkPage() {
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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/state", { cache: "no-store" });
        const d = await r.json();
        if (alive) setState(d);
      } catch {
        /* ignore */
      }
    })();
    const Ctor =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    // One-time browser-capability detection (valid effect use; rule is a heuristic).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!Ctor) setSupported(false);
    return () => {
      alive = false;
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
        utterance.rate = 1;
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
      setTurns((items) => [...items, { role: "you", text: clean }]);
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
        setTurns((items) => [...items, { role: "africhain", text: data.reply }]);
        setState(data.state);
        if (data.market) setMarket(data.market);
        speak(data.reply);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Something went wrong";
        setErr(msg);
        setTurns((items) => [...items, { role: "africhain", text: `⚠️ ${msg}` }]);
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
      for (let index = 0; index < e.results.length; index++) {
        const res = e.results[index];
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

  const hasChat = turns.length > 0 || thinking;

  return (
    <main className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex flex-col gap-5">
        <div className="relative overflow-hidden rounded-3xl bg-green-2 p-5 text-cream sm:p-6">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/20" />
          <div className="relative">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              Africhain voice OS
            </p>
            <h1 className="max-w-2xl text-3xl font-black tracking-tight sm:text-5xl">
              Talk to your business. It updates itself.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-cream/85 sm:text-base">
              Record sales, debts, stock, tasks and market prices by voice — in the language traders already use.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {JUDGE_WINS.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wide text-gold">{item.label}</p>
                  <p className="text-xs font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-5 rounded-2xl border border-line bg-surface-sunken p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Quick actions
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((step) => (
                <span
                  key={step}
                  className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-green-2"
                >
                  {step}
                </span>
              ))}
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
              className={`grid h-28 w-28 place-items-center rounded-full text-4xl text-cream shadow-lg transition-transform active:scale-95 disabled:opacity-50 ${
                listening ? "listening bg-terracotta" : "bg-green hover:scale-[1.03] hover:bg-green-2"
              }`}
              style={{ boxShadow: "var(--shadow-lg)" }}
              aria-label={listening ? "Stop recording" : "Start recording"}
            >
              {listening ? "■" : "🎙️"}
            </button>
            <p className="mt-4 h-5 text-sm font-medium text-muted">
              {thinking ? "Africhain dey think…" : listening ? "Listening… tap to stop" : "Tap and speak"}
            </p>
            {transcript && <p className="fade-up mt-1 text-center font-medium text-ink">“{transcript}”</p>}
          </div>

          {!supported && (
            <p className="mt-4 text-center text-xs text-terracotta">
              Voice not supported in this browser — use Chrome, or type below.
            </p>
          )}

          <div className="mt-6 flex gap-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(typed);
              }}
              className="flex flex-1 gap-2"
            >
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="…or type what you would say"
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
              📋
            </button>
          </div>
        </div>

        <div className="card min-h-50 p-5">
          <h2 className="eyebrow mb-3">Conversation</h2>
          {!hasChat ? (
            <div className="py-2">
              <p className="mb-3 text-sm text-muted">
                Try one of these — or say it in your own words:
              </p>
              <div className="flex flex-col gap-2">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    onClick={() => send(example)}
                    className="rounded-xl border border-line bg-surface-sunken px-3.5 py-2.5 text-left text-sm text-ink transition hover:border-green hover:bg-white"
                  >
                    <span className="mr-1.5 text-muted">“</span>
                    {example}
                    <span className="ml-0.5 text-muted">”</span>
                  </button>
                ))}
              </div>
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
                  {turn.text}
                </div>
              ))}
              {thinking && (
                <div className="self-start rounded-2xl rounded-bl-md bg-cream-2 px-4 py-3 flex gap-1.5">
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
              Full dashboard →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Mini label="Today revenue" value={state ? NGN(state.today.revenue) : "—"} accent="var(--green)" />
            <Mini label="Profit" value={state ? NGN(state.today.profit) : "—"} accent="var(--green-2)" />
            <Mini label="Sales" value={state ? String(state.today.salesCount) : "—"} />
            <Mini
              label="Owed to you"
              value={state ? NGN(state.totals.outstandingDebt) : "—"}
              accent="var(--terracotta)"
            />
          </div>
        </div>

        <div className="card p-4">
          <p className="eyebrow mb-3">Business edge</p>
          <div className="space-y-3 text-sm">
            <p>
              <span className="font-semibold text-green-2">No more lost sales:</span>{" "}
              every voice note becomes a clean business record you can trust later.
            </p>
            <p>
              <span className="font-semibold text-green-2">Buy smarter:</span>{" "}
              AMIN shows where prices are low before you restock or travel to market.
            </p>
            <p>
              <span className="font-semibold text-green-2">Know your next move:</span>{" "}
              the coach turns today&apos;s numbers into simple advice for tomorrow.
            </p>
          </div>
        </div>

        {state?.coach && (
          <div className="rounded-2xl bg-green-2 p-4 text-cream" style={{ boxShadow: "var(--shadow-md)" }}>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-lg">🧠</span>
              <h2 className="text-[11px] font-semibold uppercase tracking-wide text-gold">
                AI Business Coach
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-cream/95">{state.coach}</p>
          </div>
        )}

        <Link
          href="/market"
          className="group rounded-2xl border-2 border-gold/60 bg-surface p-4 transition hover:-translate-y-0.5 hover:border-gold"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-green-2">🌍 AMIN Live Market</p>
              <p className="text-xs text-muted">Live prices across markets — updated by traders</p>
            </div>
            <span className="text-sm font-semibold text-green transition group-hover:translate-x-0.5">
              Open →
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
