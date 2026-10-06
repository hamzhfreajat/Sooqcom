import { NextResponse } from "next/server";
import { ACCOUNT_API_URL, setToken, toSessionUser } from "@/lib/session";

/** Exchanges a Google sign-in credential for a backend session. */
export async function POST(request: Request) {
  const { credential } = (await request.json().catch(() => ({}))) as { credential?: string };
  if (!credential) return NextResponse.json({ error: "missing credential" }, { status: 400 });

  const response = await fetch(`${ACCOUNT_API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: credential }),
    cache: "no-store",
  });
  if (!response.ok) return NextResponse.json({ error: "login failed" }, { status: 401 });

  const data = await response.json();
  await setToken(data.token);
  return NextResponse.json({ user: toSessionUser(data.user) });
}
