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

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      {/* LEFT — Voice console */}
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--green-2)]">
            Talk to your business
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Speak in your language — record sales, debts, tasks and check market prices.
          </p>
        </div>

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
                listening ? "bg-[var(--terracotta)] listening" : "bg-[var(--green)] hover:bg-[var(--green-2)]"
              }`}
              aria-label="Speak"
            >
              {listening ? "◼" : "🎙"}
            </button>
            <p className="mt-3 text-sm text-[var(--muted)] h-5">
              {thinking ? "Africhain dey think…" : listening ? "Listening… tap to stop" : "Tap and speak"}
            </p>
            {transcript && (
              <p className="mt-1 text-center text-[var(--ink)] font-medium fade-up">“{transcript}”</p>
            )}
          </div>

          {!supported && (
            <p className="text-xs text-[var(--terracotta)] text-center mb-2">
              Voice not supported in this browser — use Chrome, or type below.
            </p>
          )}

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
            <span className="text-[11px] text-[var(--muted)]">or tap an example:</span>
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
        <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-4 shadow-sm min-h-[160px]">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">
            Conversation
          </h2>
          {turns.length === 0 && !thinking ? (
            <p className="text-sm text-[var(--muted)]">
              Say something like “I sell five basket of tomato for two thousand”.
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
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

        {market && <MarketPanel m={market} />}
      </section>

      {/* RIGHT — compact snapshot + coach */}
      <section className="flex flex-col gap-4">
        <div className="rounded-2xl border border-[var(--line)] bg-white/60 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">{state?.business || "Your shop"}</h2>
            <Link href="/business" className="text-xs font-semibold text-[var(--green)] hover:underline">
              Full dashboard →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Mini label="Today revenue" value={state ? NGN(state.today.revenue) : "—"} accent="var(--green)" />
            <Mini label="Profit" value={state ? NGN(state.today.profit) : "—"} accent="var(--green-2)" />
            <Mini label="Sales" value={state ? String(state.today.salesCount) : "—"} />
            <Mini label="Owed to you" value={state ? NGN(state.totals.outstandingDebt) : "—"} accent="var(--terracotta)" />
          </div>
        </div>

        {state?.coach && (
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

        <Link
          href="/market"
          className="rounded-2xl border-2 border-[var(--gold)] bg-white p-4 shadow-sm hover:bg-[var(--cream-2)] transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-[var(--green-2)]">🌍 AMIN Live Market</p>
              <p className="text-xs text-[var(--muted)]">
                Live prices across markets — updated by traders
              </p>
            </div>
            <span className="text-[var(--green)] font-semibold text-sm">Open →</span>
          </div>
        </Link>
      </section>

      {err && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[var(--terracotta)] text-white text-xs px-3 py-2 rounded-lg shadow">
          {err}
        </div>
      )}
    </main>
  );
}

function Mini({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white p-3">
      <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="text-lg font-bold mt-0.5" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}
