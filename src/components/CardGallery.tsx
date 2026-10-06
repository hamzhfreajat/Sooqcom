"use client";

import { useRef, useState } from "react";
import Lightbox from "./Lightbox";

interface Props {
  /** Card-size photos */
  images: string[];
  alt: string;
  priority?: boolean;
  /** Adds the enlarge button, which opens the photos full screen */
  viewer?: { detailsHref: string; labels: { enlarge: string; close: string; details: string; previous: string; next: string } };
}

/** How many photos can be swiped inside the card itself; the full-screen viewer shows them all */
const SWIPE_LIMIT = 5;

/** The full-size photo behind a card-size one ("…_m.jpg" is the card version of "….jpg"). */
const fullSize = (url: string) => url.replace(/_m\.jpg$/i, ".jpg");

/** Swipeable photos inside an ad card. Only the first photo loads until the user moves. */
export default function CardGallery({ images, alt, priority, viewer }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [touched, setTouched] = useState(false);
  const [enlarged, setEnlarged] = useState(false);
  const shown = images.slice(0, SWIPE_LIMIT);

  const move = (step: number) => {
    const el = scroller.current;
    if (!el) return;
    const next = Math.min(shown.length - 1, Math.max(0, current + step));
    setTouched(true);
    (el.children[next] as HTMLElement | undefined)?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  return (
    <div className="group/gallery relative h-full w-full">
      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          setTouched(true);
          setCurrent(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
        }}
        className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto"
      >
        {shown.map((src, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={index === 0 || touched ? src : undefined}
            alt={index === 0 ? alt : `${alt} - ${index + 1}`}
            loading={index === 0 && priority ? "eager" : "lazy"}
            fetchPriority={index === 0 && priority ? "high" : "auto"}
            decoding="async"
            className="h-full w-full shrink-0 snap-start object-cover"
          />
        ))}
      </div>

      {shown.length > 1 && (
        <>
          {(["prev", "next"] as const).map((side) => (
            <button
              key={side}
              type="button"
              aria-label={side === "prev" ? viewer?.labels.previous ?? "Previous photo" : viewer?.labels.next ?? "Next photo"}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                move(side === "prev" ? -1 : 1);
              }}
              className={`absolute top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink opacity-0 shadow-card transition hover:bg-white group-hover/gallery:opacity-100 md:flex ${side === "prev" ? "start-2" : "end-2"}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" className={side === "prev" ? "ltr:rotate-180" : "rtl:rotate-180"}>
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
          ))}
          <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1" dir="ltr">
            {shown.map((src, index) => (
              <span key={src} className={`h-1.5 rounded-full transition-all ${index === current ? "w-4 bg-white" : "w-1.5 bg-white/60"}`} />
            ))}
          </div>
        </>
      )}

      {viewer && (
        <>
          <button
            type="button"
            aria-label={viewer.labels.enlarge}
            title={viewer.labels.enlarge}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setEnlarged(true);
            }}
            className="absolute bottom-2.5 end-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-white backdrop-blur transition hover:scale-105 hover:bg-ink/85"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
            </svg>
          </button>
          {enlarged && (
            <Lightbox
              images={images.map(fullSize)}
              thumbs={images}
              title={alt}
              start={current}
              detailsHref={viewer.detailsHref}
              labels={viewer.labels}
              onClose={() => setEnlarged(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
