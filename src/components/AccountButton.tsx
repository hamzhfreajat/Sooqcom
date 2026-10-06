"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import Icon from "./Icon";

export interface SessionUser {
  id: number;
  name: string;
  avatar: string | null;
  phone: string | null;
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

/** Other components open the sign-in dialog with `requestLogin()` and learn about changes through `onSessionChange`. */
export const requestLogin = () => window.dispatchEvent(new Event("sq:login"));
export function onSessionChange(listener: (user: SessionUser | null) => void) {
  const handler = (event: Event) => listener((event as CustomEvent<SessionUser | null>).detail);
  window.addEventListener("sq:session", handler);
  return () => window.removeEventListener("sq:session", handler);
}
export async function fetchSession(): Promise<SessionUser | null> {
  try {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    return (await response.json()).user ?? null;
  } catch {
    return null;
  }
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function AccountButton({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [dialog, setDialog] = useState(false);
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState("");
  const googleButton = useRef<HTMLDivElement>(null);

  const publish = useCallback((next: SessionUser | null) => {
    setUser(next);
    window.dispatchEvent(new CustomEvent("sq:session", { detail: next }));
  }, []);

  useEffect(() => {
    fetchSession().then(publish);
    const open = () => setDialog(true);
    window.addEventListener("sq:login", open);
    return () => window.removeEventListener("sq:login", open);
  }, [publish]);

  // Google's button is rendered by its own script once the dialog is open
  useEffect(() => {
    if (!dialog || !GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !window.google || !googleButton.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }: { credential: string }) => {
          setError("");
          const response = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential }),
          });
          if (!response.ok) return setError(t.login_failed);
          publish((await response.json()).user);
          setDialog(false);
        },
      });
      window.google.accounts.id.renderButton(googleButton.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        width: 300,
        locale,
      });
    };
    if (window.google) render();
    else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = render;
      document.head.appendChild(script);
    }
    return () => {
      cancelled = true;
    };
  }, [dialog, locale, publish, t.login_failed]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setMenu(false);
    publish(null);
  };

  return (
    <>
      {user ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenu(!menu)}
            aria-expanded={menu}
            className="flex h-11 items-center gap-2 rounded-xl border border-line px-2.5 text-sm font-semibold text-ink hover:border-ink"
          >
            <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-brand-700">
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <Icon name="user" size={16} />
              )}
            </span>
            <span className="hidden max-w-[110px] truncate md:inline">{user.name || t.my_account}</span>
          </button>
          {menu && (
            <div className="absolute end-0 top-full z-50 mt-2 w-56 rounded-xl border border-line bg-white p-1.5 shadow-pop">
              {(
                [
                  ["layers", locale === "en" ? "My ads" : "إعلاناتي", "/account"],
                  ["chart", locale === "en" ? "Statistics" : "الإحصائيات", "/account#stats"],
                  ["plus", t.post_ad, "/post"],
                ] as const
              ).map(([icon, label, path]) => (
                <a
                  key={path}
                  href={`${locale === "en" ? "/en" : ""}${path}`}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-surface"
                >
                  <Icon name={icon} size={16} className="text-muted" />
                  {label}
                </a>
              ))}
              <button type="button" onClick={logout} className="mt-1 w-full rounded-lg border-t border-line px-3 py-2.5 text-start text-sm font-medium text-red-600 hover:bg-surface">
                {t.logout}
              </button>
            </div>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => setDialog(true)} className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-ink hover:bg-surface">
          <Icon name="user" size={18} />
          <span className="hidden md:inline">{t.login}</span>
        </button>
      )}

      {dialog && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-6" onClick={() => setDialog(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.login_title}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-white p-7 text-center shadow-pop sm:rounded-3xl"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-96.png" alt="" width={56} height={56} className="mx-auto h-14 w-14" />
            <h2 className="mt-4 text-xl font-bold">{t.login_title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{t.login_body}</p>
            <div className="mt-6 flex min-h-11 justify-center">
              {GOOGLE_CLIENT_ID ? <div ref={googleButton} /> : <p className="rounded-xl bg-surface px-4 py-3 text-sm text-body">{t.login_unavailable}</p>}
            </div>
            {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
            <button type="button" onClick={() => setDialog(false)} className="mt-6 text-sm font-semibold text-muted hover:text-ink">
              {locale === "en" ? "Not now" : "ليس الآن"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
