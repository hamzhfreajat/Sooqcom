import { NextResponse } from "next/server";
import { type WizardInput, buildAd } from "@/lib/post/server";
import { accountFetch, getToken } from "@/lib/session";

/**
 * Saves the ad in progress as a draft, like the app does while the user moves
 * through the steps: created once the area is chosen, updated after that.
 * Saving is best effort; the wizard carries on if it fails.
 */
export async function POST(request: Request) {
  if (!(await getToken())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const input = (await request.json().catch(() => ({}))) as WizardInput;
  const { payload } = await buildAd(input);
  if (!payload.category_id) return NextResponse.json({ error: "category" }, { status: 400 });

  const id = Number.isSafeInteger(input.id) ? input.id : undefined;
  const response = await accountFetch(id ? `/ads/${id}/draft` : "/ads/draft", {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    // The draft endpoints have no "region" or "video_url" fields
    body: JSON.stringify({
      category_id: payload.category_id,
      title: payload.title,
      description: payload.description,
      price: payload.price,
      location: payload.location,
      attributes: payload.attributes,
      linked_tags: payload.linked_tags,
      image_urls: payload.image_urls,
      phone_number: payload.phone_number,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return NextResponse.json({ error: "draft failed" }, { status: response.status });
  return NextResponse.json({ id: data.id });
}
