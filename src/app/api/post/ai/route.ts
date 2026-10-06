import { NextResponse } from "next/server";
import { type WizardInput, buildAd } from "@/lib/post/server";
import { accountFetch, getToken } from "@/lib/session";

/**
 * The two AI helpers of the add-ad flow, through the same backend endpoints the app uses:
 *   suggest  - writes a title, a description and smart tags from the details entered so far
 *   evaluate - scores the finished ad and gives tips before publishing
 */
export async function POST(request: Request) {
  if (!(await getToken())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { kind?: string; input?: WizardInput };
  const { payload } = await buildAd(body.input ?? {});
  const attributes = payload.attributes as Record<string, unknown>;

  if (body.kind === "suggest") {
    const response = await accountFetch("/ai/generate-suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: attributes.leaf_category_name,
        transaction_type: attributes.transaction_type,
        city: attributes.city,
        region: attributes.region,
        attributes,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: "suggest failed" }, { status: response.status });
    const first = Array.isArray(data.suggestions) ? data.suggestions[0] : undefined;
    return NextResponse.json({
      title: String(first?.title ?? "").slice(0, 70),
      description: String(first?.description ?? ""),
      tags: Array.isArray(data.smart_tags) ? data.smart_tags.map(String).slice(0, 10) : [],
    });
  }

  if (body.kind === "evaluate") {
    const response = await accountFetch("/ai/evaluate-ad", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: "evaluate failed" }, { status: response.status });
    return NextResponse.json({
      score: typeof data.score === "number" ? Math.max(0, Math.min(100, Math.round(data.score))) : 75,
      tips: Array.isArray(data.tips) ? data.tips.map(String).slice(0, 5) : [],
    });
  }

  return NextResponse.json({ error: "unknown kind" }, { status: 400 });
}
