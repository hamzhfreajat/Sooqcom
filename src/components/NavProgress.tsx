"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * A thin bar at the top of the page while the next page loads, so a click
 * always gets an immediate response even when the server takes a moment.
 */
export default function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");

  // The address changed: the new page is on screen
  useEffect(() => {
    setPhase((current) => (current === "loading" ? "done" : current));
    const timer = setTimeout(() => setPhase((current) => (current === "done" ? "idle" : current)), 350);
    return () => clearTimeout(timer);
  }, [pathname, search]);

  useEffect(() => {
    let safety: ReturnType<typeof setTimeout>;
    const start = () => {
      setPhase("loading");
      clearTimeout(safety);
      // Never leave the bar hanging if a navigation is cancelled
      safety = setTimeout(() => setPhase("idle"), 20_000);
    };
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      start();
    };
    window.addEventListener("sq:navigate", start);
    // Capture phase, so this runs before the router handles the click
    document.addEventListener("click", onClick, true);
    return () => {
      clearTimeout(safety);
      window.removeEventListener("sq:navigate", start);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
      <div
        className="h-full origin-left bg-brand-600 rtl:origin-right"
        style={{
          transform: `scaleX(${phase === "idle" ? 0 : phase === "loading" ? 0.85 : 1})`,
          opacity: phase === "idle" ? 0 : 1,
          transition:
            phase === "loading"
              ? "transform 8s cubic-bezier(0.1, 0.7, 0.1, 1), opacity 0.1s"
              : phase === "done"
                ? "transform 0.2s ease-out, opacity 0.3s 0.15s"
                : "none",
        }}
      />
    </div>
  );
}
