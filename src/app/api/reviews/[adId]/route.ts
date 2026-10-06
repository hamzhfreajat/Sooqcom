import { NextResponse } from "next/server";
import { accountFetch, getToken } from "@/lib/session";

const adId = async (context: { params: Promise<{ adId: string }> }) => {
  const value = Number((await context.params).adId);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
};

/** An ad's reviews: the summary, a page of reviews and, when signed in, the visitor's own review. */
export async function GET(request: Request, context: { params: Promise<{ adId: string }> }) {
  const id = await adId(context);
  if (!id) return NextResponse.json({ error: "bad id" }, { status: 400 });
  const url = new URL(request.url);
  const skip = Math.max(0, Number(url.searchParams.get("skip")) || 0);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
  const response = await accountFetch(`/ads/${id}/reviews?skip=${skip}&limit=${limit}&_=${Date.now()}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return NextResponse.json({ error: "failed" }, { status: response.status });
  return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store" } });
}

/** Adds or replaces the signed-in visitor's review. */
export async function POST(request: Request, context: { params: Promise<{ adId: string }> }) {
  if (!(await getToken())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = await adId(context);
  if (!id) return NextResponse.json({ error: "bad id" }, { status: 400 });
  const body = (await request.json().catch(() => ({}))) as { rating?: number; tags?: string[]; comment?: string };
  const rating = Math.round(Number(body.rating));
  if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ error: "rating" }, { status: 400 });
  const response = await accountFetch(`/ads/${id}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      rating,
      tags: (body.tags ?? []).filter((tag) => typeof tag === "string").slice(0, 10),
      comment: typeof body.comment === "string" && body.comment.trim() ? body.comment.trim().slice(0, 500) : null,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return NextResponse.json({ error: typeof data.detail === "string" ? data.detail : "failed" }, { status: response.status });
  return NextResponse.json(data);
}

/** Removes the signed-in visitor's review. */
export async function DELETE(_request: Request, context: { params: Promise<{ adId: string }> }) {
  if (!(await getToken())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = await adId(context);
  if (!id) return NextResponse.json({ error: "bad id" }, { status: 400 });
  const response = await accountFetch(`/ads/${id}/reviews/mine`, { method: "DELETE" });
  if (!response.ok) return NextResponse.json({ error: "failed" }, { status: response.status });
  return NextResponse.json({ ok: true });
}
