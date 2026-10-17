"use client";

import { useEffect } from "react";
import { trackShown } from "@/lib/track";

/** An ad card counts as seen when at least half of it stays on screen this long. */
const VISIBLE_FOR = 1000;
const HALF = 0.5;
/** Seen ads are sent together every few seconds, and when the visitor leaves. */
const SEND_EVERY = 5000;

/**
 * Counts the ads visitors see in lists, the way the app counts the ads it shows while
 * scrolling. Every card marked with data-ad-id is watched, on every page, including
 * cards that appear later (next page of results, client-side navigation). Renders nothing.
 */
export default function AdImpressions() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const timers = new Map<Element, number>();
    const queued = new Set<number>();
    const watched = new WeakSet<Element>();

    const flush = () => {
      if (!queued.size) return;
      trackShown([...queued]);
      queued.clear();
    };

    const visibility = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = Number((entry.target as HTMLElement).dataset.adId);
          if (!id) continue;
          // isIntersecting stays true below the threshold (30% visible), so the ratio decides
          if (entry.isIntersecting && entry.intersectionRatio >= HALF) {
            if (!timers.has(entry.target)) {
              timers.set(
                entry.target,
                window.setTimeout(() => {
                  queued.add(id);
                  timers.delete(entry.target);
                  visibility.unobserve(entry.target);
                }, VISIBLE_FOR),
              );
            }
          } else {
            // Scrolled away (or under half) before a second passed: not seen
            window.clearTimeout(timers.get(entry.target));
            timers.delete(entry.target);
          }
        }
      },
      { threshold: HALF },
    );

    const watch = (root: ParentNode) => {
      root.querySelectorAll("[data-ad-id]").forEach((card) => {
        if (watched.has(card)) return;
        watched.add(card);
        visibility.observe(card);
      });
    };
    watch(document);
    // Cards added after the first render, looked for at most a few times a second
    let looking = 0;
    const additions = new MutationObserver(() => {
      if (looking) return;
      looking = window.setTimeout(() => {
        looking = 0;
        watch(document);
      }, 300);
    });
    additions.observe(document.body, { childList: true, subtree: true });

    const interval = window.setInterval(flush, SEND_EVERY);
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);

    return () => {
      flush();
      visibility.disconnect();
      additions.disconnect();
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(looking);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  return null;
}
