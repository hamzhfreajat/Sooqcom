"use client";

import { useRef, useState } from "react";
import Lightbox from "./Lightbox";

interface Labels {
  enlarge: string;
  close: string;
  previous: string;
  next: string;
}

/**
 * Swipeable photo gallery. The first photo is rendered eagerly; the rest load as they come near.
 * The enlarge button, or a click on the photo, opens the photos full screen.
 */
export default function Gallery({ images, thumbs, alt, labels }: { images: string[]; thumbs: string[]; alt: string; labels: Labels }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [enlarged, setEnlarged] = useState(false);

  const goTo = (index: number) => {
    const el = scroller.current;
    if (!el) return;
    const slide = el.children[index] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    setCurrent(index);
  };

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    // scrollLeft is negative in RTL
    setCurrent(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
  };

  if (images.length === 0) return null;

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-ink">
        <div
          ref={scroller}
          onScroll={onScroll}
          className="no-scrollbar flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto sm:aspect-[16/10]"
        >
          {images.map((src, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt={index === 0 ? alt : `${alt} - ${index + 1}`}
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
              decoding="async"
              onClick={() => setEnlarged(true)}
              className="h-full w-full shrink-0 cursor-zoom-in snap-start object-contain"
            />
          ))}
        </div>
        <button
          type="button"
          aria-label={labels.enlarge}
          title={labels.enlarge}
          onClick={() => setEnlarged(true)}
          className="absolute bottom-3 end-3 z-10 inline-flex h-10 items-center gap-2 rounded-full bg-white/95 px-4 text-sm font-bold text-ink shadow-card transition hover:bg-white"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
          </svg>
          {labels.enlarge}
        </button>
        {enlarged && (
          <Lightbox
            images={images}
            thumbs={thumbs}
            title={alt}
            start={current}
            labels={{ close: labels.close, details: "", previous: labels.previous, next: labels.next }}
            onClose={() => setEnlarged(false)}
          />
        )}
        {images.length > 1 && (
          <>
            <span className="absolute end-3 top-3 rounded-lg bg-ink/70 px-2.5 py-1 text-xs font-bold text-white" dir="ltr">
              {current + 1} / {images.length}
            </span>
            <button
              type="button"
              aria-label={labels.previous}
              onClick={() => goTo(Math.max(0, current - 1))}
              disabled={current === 0}
              className="absolute start-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-card disabled:opacity-40 sm:flex"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ltr:rotate-180" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
            </button>
            <button
              type="button"
              aria-label={labels.next}
              onClick={() => goTo(Math.min(images.length - 1, current + 1))}
              disabled={current === images.length - 1}
              className="absolute end-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-card disabled:opacity-40 sm:flex"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="rtl:rotate-180" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {thumbs.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`${index + 1}`}
              className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 ${index === current ? "border-brand-600" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
