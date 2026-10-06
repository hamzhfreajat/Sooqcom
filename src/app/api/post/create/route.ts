import { NextResponse } from "next/server";
import { type WizardInput, buildAd } from "@/lib/post/server";
import { accountFetch, getToken } from "@/lib/session";

/**
 * Publishes the ad through the same endpoints the app uses: the draft made
 * earlier in the flow is published, or a new ad is created when there is none.
 */
export async function POST(request: Request) {
  if (!(await getToken())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const input = (await request.json().catch(() => ({}))) as WizardInput;
  const { errors, payload } = await buildAd(input);
  if (errors.length > 0) return NextResponse.json({ error: "incomplete", fields: errors }, { status: 400 });

  const id = Number.isSafeInteger(input.id) ? input.id : undefined;
  const response = await accountFetch(id ? `/ads/${id}` : "/ads", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, ...(id ? { id } : {}), is_published: true }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof data.detail === "string" ? data.detail : "failed";
    return NextResponse.json({ error: detail }, { status: response.status });
  }
  return NextResponse.json({ id: data.id ?? id, title: data.title ?? payload.title });
}
