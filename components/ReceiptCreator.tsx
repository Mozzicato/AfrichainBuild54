"use client";

import { useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import type { BusinessState, Sale } from "@/lib/types";
import { NGN } from "@/lib/format";

function saleLabel(sale: Sale) {
  return `${sale.qty} ${sale.unit} ${sale.item} - ${NGN(sale.amount)}`;
}

function cleanReceiptSpeech(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function extractAfter(text: string, keys: string[]) {
  const lower = text.toLowerCase();
  for (const key of keys) {
    const index = lower.indexOf(key);
    if (index >= 0) return text.slice(index + key.length).trim();
  }
  return "";
}

export default function ReceiptCreator({ state }: { state: BusinessState | null }) {
  const sales = useMemo(() => state?.recentSales || [], [state?.recentSales]);
  const [saleId, setSaleId] = useState("");
  const [customer, setCustomer] = useState("");
  const [note, setNote] = useState("Thank you for your patronage.");
  const [listening, setListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  const selectedSale = useMemo(
    () => sales.find((sale) => sale.id === saleId) || sales[0],
    [saleId, sales]
  );

  const applyVoiceText = (rawText: string) => {
    const text = cleanReceiptSpeech(rawText);
    if (!text) return;
    setVoiceText(text);

    const notePart = extractAfter(text, [" note ", " notes ", " message ", " write "]);
    const customerPart =
      extractAfter(text, ["customer ", "for customer ", "for ", "name is ", "give am to "]) ||
      text.split(".")[0];

    if (customerPart) {
      const cleanedCustomer = customerPart
        .replace(/ note .*/i, "")
        .replace(/ message .*/i, "")
        .replace(/ write .*/i, "")
        .trim();
      if (cleanedCustomer) setCustomer(cleanedCustomer);
    }

    if (notePart) setNote(notePart);

    const matchingSale = sales.find((sale) => text.toLowerCase().includes(sale.item.toLowerCase()));
    if (matchingSale) setSaleId(matchingSale.id);
  };

  const startReceiptVoice = () => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Ctor) {
      setVoiceError("Voice is not supported here. Use Chrome or type the receipt details.");
      return;
    }

    const rec = new Ctor();
    rec.lang = "en-NG";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 3;
    let finalText = "";
    let latestText = "";

    rec.onstart = () => {
      setListening(true);
      setVoiceError("");
      setVoiceText("");
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
      setVoiceText(latestText);
    };
    rec.onerror = () => {
      setListening(false);
      setVoiceError("I could not hear clearly. Try saying: Customer Mr Chidi. Note thank you.");
    };
    rec.onend = () => {
      setListening(false);
      applyVoiceText(finalText || latestText);
    };
    recRef.current = rec;
    rec.start();
  };

  const stopReceiptVoice = () => {
    recRef.current?.stop();
  };

  const createPdf = () => {
    if (!state || !selectedSale) return;
    const doc = new jsPDF();
    const date = new Date(selectedSale.ts).toLocaleString();

    doc.setFillColor(22, 79, 55);
    doc.rect(0, 0, 210, 36, "F");
    doc.setTextColor(247, 243, 232);
    doc.setFontSize(22);
    doc.text("Africhain Receipt", 16, 21);
    doc.setFontSize(10);
    doc.text(state.business, 16, 29);

    doc.setTextColor(34, 32, 26);
    doc.setFontSize(11);
    doc.text(`Customer: ${customer.trim() || "Walk-in customer"}`, 16, 52);
    doc.text(`Date: ${date}`, 16, 60);
    doc.text(`Receipt ID: ${selectedSale.id.toUpperCase()}`, 16, 68);

    doc.setDrawColor(227, 217, 194);
    doc.line(16, 78, 194, 78);

    doc.setFontSize(12);
    doc.text("Item", 16, 92);
    doc.text("Qty", 118, 92);
    doc.text("Total", 160, 92);
    doc.line(16, 97, 194, 97);

    doc.setFontSize(11);
    doc.text(selectedSale.item, 16, 111);
    doc.text(`${selectedSale.qty} ${selectedSale.unit}`, 118, 111);
    doc.text(NGN(selectedSale.amount), 160, 111);

    doc.line(16, 123, 194, 123);
    doc.setFontSize(14);
    doc.text("Amount paid", 118, 138);
    doc.text(NGN(selectedSale.amount), 160, 138);

    doc.setFontSize(10);
    doc.setTextColor(107, 100, 85);
    doc.text(note || "Thank you for your patronage.", 16, 164, { maxWidth: 178 });
    doc.text("Generated with Africhain", 16, 282);

    doc.save(`africhain-receipt-${selectedSale.id}.pdf`);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
      <div className="card p-5">
        <p className="eyebrow mb-2">Receipt creator</p>
        <h1 className="text-2xl font-bold text-green-2">Turn any sale into a receipt</h1>
        <p className="mt-1 text-sm text-muted">
          Pick a sale, type the details, or fill the receipt by voice.
        </p>

        <div className="mt-5 rounded-2xl border border-line bg-surface-sunken p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-green-2">Voice-fill receipt</p>
              <p className="text-xs text-muted">
                Say: Customer Mr Chidi. Note thank you for buying from us.
              </p>
            </div>
            <button
              onClick={listening ? stopReceiptVoice : startReceiptVoice}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                listening ? "bg-terracotta text-white" : "bg-green text-cream hover:bg-green-2"
              }`}
            >
              {listening ? "Stop listening" : "Fill with voice"}
            </button>
          </div>
          {voiceText && (
            <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-ink">
              Heard: {voiceText}
            </p>
          )}
          {voiceError && <p className="mt-2 text-xs text-terracotta">{voiceError}</p>}
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-green-2">Sale</span>
            <select
              value={selectedSale?.id || ""}
              onChange={(event) => setSaleId(event.target.value)}
              className="rounded-xl border border-line bg-surface-sunken px-3 py-2.5 outline-none transition focus:border-green focus:bg-white"
            >
              {sales.map((sale) => (
                <option key={sale.id} value={sale.id}>
                  {saleLabel(sale)}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-green-2">Customer name</span>
            <input
              value={customer}
              onChange={(event) => setCustomer(event.target.value)}
              placeholder="Walk-in customer"
              className="rounded-xl border border-line bg-surface-sunken px-3 py-2.5 outline-none transition focus:border-green focus:bg-white"
            />
          </label>

          <label className="grid gap-1.5 text-sm">
            <span className="font-semibold text-green-2">Receipt note</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="resize-none rounded-xl border border-line bg-surface-sunken px-3 py-2.5 outline-none transition focus:border-green focus:bg-white"
            />
          </label>

          <button
            onClick={createPdf}
            disabled={!state || !selectedSale}
            className="rounded-xl bg-green px-4 py-3 text-sm font-bold text-cream transition hover:bg-green-2 disabled:opacity-50"
          >
            Download PDF receipt
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
        <div className="rounded-2xl bg-green-2 p-4 text-cream">
          <p className="text-xs uppercase tracking-wide text-gold">Africhain receipt</p>
          <p className="mt-1 font-bold">{state?.business || "Your business"}</p>
        </div>
        <div className="mt-5 space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Customer</span>
            <span className="font-semibold">{customer.trim() || "Walk-in customer"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Date</span>
            <span className="font-semibold">
              {selectedSale ? new Date(selectedSale.ts).toLocaleDateString() : "-"}
            </span>
          </div>
          <div className="rounded-2xl bg-surface-sunken p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Item</p>
            <p className="mt-1 font-bold capitalize text-green-2">
              {selectedSale ? selectedSale.item : "No sale selected"}
            </p>
            <div className="mt-3 flex justify-between">
              <span>{selectedSale ? `${selectedSale.qty} ${selectedSale.unit}` : "-"}</span>
              <span className="font-bold text-green">{selectedSale ? NGN(selectedSale.amount) : "-"}</span>
            </div>
          </div>
          <div className="flex justify-between border-t border-line pt-4 text-base">
            <span className="font-semibold">Total</span>
            <span className="font-black text-green-2">{selectedSale ? NGN(selectedSale.amount) : "-"}</span>
          </div>
          <p className="text-xs text-muted">{note}</p>
        </div>
      </div>
    </div>
  );
}
