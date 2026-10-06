import { NextResponse } from "next/server";
import { accountFetch, clearToken, getToken, toSessionUser } from "@/lib/session";

export async function GET() {
  if (!(await getToken())) return NextResponse.json({ user: null });
  const response = await accountFetch("/auth/me");
  if (!response.ok) {
    if (response.status === 401) await clearToken();
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: toSessionUser(await response.json()) });
}
