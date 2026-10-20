/**
 * Google Analytics events from the browser. Browser only.
 *
 * Analytics itself loads once the page is idle (SiteShell), so an event can come first:
 * it is queued in dataLayer the way gtag's own snippet does and sent once analytics
 * loads. With no measurement id configured nothing is ever sent.
 */
type Gtag = (...args: unknown[]) => void;

/** The actions that matter to the business; marked as key events in Analytics. */
export type KeyEvent = "phone_reveal" | "whatsapp_click" | "chat_click" | "post_start" | "post_published";

export function gaEvent(name: KeyEvent, params: Record<string, string | number> = {}): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: Gtag };
  w.dataLayer = w.dataLayer || [];
  if (!w.gtag) {
    // gtag reads its queue as `arguments` objects, exactly as Google's snippet pushes them
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    };
  }
  w.gtag("event", name, params);
}
