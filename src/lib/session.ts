import { cookies } from "next/headers";
import { API_URL } from "./config";

/** Account, search and posting calls go to the real backend even when listing data is read from a local copy. */
export const ACCOUNT_API_URL = (process.env.ACCOUNT_API_URL || API_URL).replace(/\/$/, "");

export const TOKEN_COOKIE = "sq_token";
const WEEK = 60 * 60 * 24 * 7;

export interface SessionUser {
  id: number;
  name: string;
  avatar: string | null;
  phone: string | null;
}

export function toSessionUser(user: Record<string, unknown> | null | undefined): SessionUser | null {
  if (!user || typeof user.id !== "number") return null;
  return {
    id: user.id,
    name: String(user.full_name || user.username || ""),
    avatar: (user.avatar_url as string) || null,
    phone: (user.mobile_number as string) || null,
  };
}

/** The token lives in an httpOnly cookie, so page scripts can never read it. */
export async function setToken(token: string) {
  (await cookies()).set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: WEEK,
  });
}

export async function clearToken() {
  (await cookies()).delete(TOKEN_COOKIE);
}

export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(TOKEN_COOKIE)?.value;
}

export async function accountFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${ACCOUNT_API_URL}${path}`, { ...init, headers, cache: "no-store" });
}
