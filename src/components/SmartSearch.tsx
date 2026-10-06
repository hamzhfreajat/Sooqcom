"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Locale } from "@/lib/types";
import Icon from "./Icon";

interface Labels {
  placeholder: string;
  button: string;
  error: string;
  listening: string;
  examples: string[];
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechWindow = Record<string, (new () => SpeechRecognitionLike) | undefined>;

/** Free-text (or spoken) search: the backend works out the area, price and features. */
export default function SmartSearch({
  locale,
  labels,
  initial = "",
  variant = "hero",
}: {
  locale: Locale;
  labels: Labels;
  initial?: string;
  /** "hero" sits on the home page's sky-blue hero and shows example chips; "inline" sits on white. */
  variant?: "hero" | "inline";
}) {
  const router = useRouter();
  const [text, setText] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [listening, setListening] = useState(false);
  const recognition = useRef<SpeechRecognitionLike | null>(null);

  const submit = async (value: string) => {
    const query = value.trim();
    if (query.length < 3 || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/smart-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query, locale }),
      });
      const data = await response.json();
      if (data.url) {
        router.push(data.url);
        return;
      }
      setMessage(data.message || labels.error);
    } catch {
      setMessage(labels.error);
    }
    setBusy(false);
  };

  const toggleMic = () => {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const speechWindow = window as unknown as SpeechWindow;
    const Speech = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Speech) return;
    const instance = new Speech();
    instance.lang = locale === "en" ? "en-US" : "ar-JO";
    instance.interimResults = true;
    instance.onresult = (event) => setText(Array.from(event.results).map((r) => r[0].transcript).join(" "));
    instance.onend = () => setListening(false);
    instance.onerror = () => setListening(false);
    recognition.current = instance;
    setListening(true);
    instance.start();
  };

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(text);
        }}
        className={`flex items-center gap-2 rounded-2xl border bg-white p-2 transition focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-100 ${
          variant === "hero" ? "border-white shadow-lift" : "border-line"
        }`}
      >
        <span className="ms-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 text-white">
          <Icon name="sparkle" size={19} />
        </span>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={listening ? labels.listening : labels.placeholder}
          aria-label={labels.button}
          className="h-12 min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-muted focus:outline-none sm:text-base"
          dir="auto"
        />
        <button
          type="button"
          onClick={toggleMic}
          aria-label={labels.listening}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
            listening ? "bg-red-50 text-red-600" : "text-muted hover:bg-surface hover:text-ink"
          }`}
        >
          <Icon name="mic" size={20} />
        </button>
        <button type="submit" disabled={busy || text.trim().length < 3} className="btn-primary h-12 shrink-0 px-4 text-[15px] sm:px-6">
          {busy ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Icon name="search" size={18} />}
          <span className="hidden sm:inline">{labels.button}</span>
        </button>
      </form>

      {message && (
        <p role="alert" className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {message}
        </p>
      )}

      {variant === "hero" && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {labels.examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setText(example);
                submit(example);
              }}
              className="rounded-full border border-white bg-white/70 px-3.5 py-1.5 text-sm font-medium text-body shadow-card backdrop-blur transition hover:bg-white hover:text-brand-700"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
