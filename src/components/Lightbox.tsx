"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  /** Full-size photos */
  images: string[];
  /** Small versions of the same photos, for the strip at the bottom */
  thumbs: string[];
  title: string;
  /** The photo to open on */
  start?: number;
  /** Link to the ad itself, shown in the top bar */
  detailsHref?: string;
  labels: { close: string; details: string; previous: string; next: string };
  onClose: () => void;
}

/**
 * Full-screen photo viewer: one large photo at a time, swipe or arrows to move,
 * a strip of thumbnails underneath. Closes with the button or Escape.
 */
export default function Lightbox({ images, thumbs, title, start = 0, detailsHref, labels, onClose }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(Math.min(start, images.length - 1));
  const [mounted, setMounted] = useState(false);
  /** Photos that have been on or next to the screen; they load once and stay loaded */
  const [seen, setSeen] = useState<Set<number>>(() => new Set());

  const goTo = useCallback(
    (index: number, smooth = true) => {
      const next = Math.min(images.length - 1, Math.max(0, index));
      const slide = scroller.current?.children[next] as HTMLElement | undefined;
      slide?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", inline: "start", block: "nearest" });
      setCurrent(next);
    },
    [images.length],
  );

  useEffect(() => setMounted(true), []);

  // Open on the photo the card was showing, and keep the page behind still
  useEffect(() => {
    if (!mounted) return;
    goTo(start, false);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted, start, goTo]);

  useEffect(() => {
    const rtl = document.documentElement.dir === "rtl";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      // The arrow keys follow the reading direction
      else if (event.key === "ArrowLeft") goTo(current + (rtl ? 1 : -1));
      else if (event.key === "ArrowRight") goTo(current + (rtl ? -1 : 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [current, goTo, onClose]);

  useEffect(() => {
    setSeen((previous) => {
      const next = new Set(previous);
      for (const index of [current - 1, current, current + 1]) next.add(index);
      return next;
    });
  }, [current]);

  // Keep the current thumbnail in view
  useEffect(() => {
    (strip.current?.children[current] as HTMLElement | undefined)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [current]);

  if (!mounted) return null;

  const arrow = "absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25 disabled:opacity-0 sm:flex";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[100] flex flex-col bg-[#060b16]/95 backdrop-blur-sm"
      // Clicks must not reach the card underneath, which is a link to the ad
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-3 px-4 py-3 text-white sm:px-6">
        <p className="min-w-0 flex-1 truncate text-[15px] font-bold">{title}</p>
        <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold" dir="ltr">
          {current + 1} / {images.length}
        </span>
        {detailsHref && (
          <a href={detailsHref} className="hidden h-10 shrink-0 items-center rounded-full bg-white px-4 text-sm font-bold text-ink transition hover:bg-brand-50 sm:inline-flex">
            {labels.details}
          </a>
        )}
        <button type="button" onClick={onClose} aria-label={labels.close} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/25">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scroller}
          onScroll={(event) => {
            const el = event.currentTarget;
            // scrollLeft is negative in right-to-left pages
            setCurrent(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
          }}
          className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto"
        >
          {images.map((src, index) => (
            <div key={src} className="h-full w-full shrink-0 snap-start px-2 pb-1 sm:px-20">
              {seen.has(index) && (
                // Small photos are scaled up to the screen rather than left as a stamp in the middle
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={`${title} - ${index + 1}`} decoding="async" className="h-full w-full object-contain" />
              )}
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label={labels.previous}
              disabled={current === 0}
              onClick={(event) => {
                event.stopPropagation();
                goTo(current - 1);
              }}
              className={`${arrow} start-4`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="ltr:rotate-180" aria-hidden="true">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={labels.next}
              disabled={current === images.length - 1}
              onClick={(event) => {
                event.stopPropagation();
                goTo(current + 1);
              }}
              className={`${arrow} end-4`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="rtl:rotate-180" aria-hidden="true">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div ref={strip} className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-4 py-3 sm:justify-center sm:px-6">
          {thumbs.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`${index + 1}`}
              aria-current={index === current}
              className={`h-14 w-[74px] shrink-0 overflow-hidden rounded-lg border-2 transition ${index === current ? "border-white" : "border-transparent opacity-50 hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {detailsHref && (
        <a href={detailsHref} className="mx-4 mb-4 inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-ink sm:hidden">
          {labels.details}
        </a>
      )}
    </div>,
    document.body,
  );
}
