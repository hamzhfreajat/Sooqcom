import { NextResponse } from "next/server";
import { accountFetch, getToken } from "@/lib/session";

const STATUSES = ["All", "Active", "Uncompleted", "Expired", "Sold", "Paused", "Rejected"];
const ACTIONS = ["pause", "resume", "sold", "delete", "republish"];

/** The signed-in user's ads with their statistics, plus the totals for the whole account. */
export async function GET(request: Request) {
  if (!(await getToken())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const status = STATUSES.includes(url.searchParams.get("status") ?? "") ? (url.searchParams.get("status") as string) : "All";
  const search = (url.searchParams.get("search") ?? "").trim().slice(0, 80);
  const query = new URLSearchParams({ status });
  if (search) query.set("search", search);

  const [summary, ads] = await Promise.all([accountFetch("/my-ads/dashboard"), accountFetch(`/my-ads?${query.toString()}`)]);
  if (summary.status === 401 || ads.status === 401) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!summary.ok || !ads.ok) return NextResponse.json({ error: "failed" }, { status: 502 });

  const list = (await ads.json()) as Record<string, unknown>[];
  return NextResponse.json(
    {
      summary: await summary.json(),
      // Only what the page shows
      ads: list.map((ad) => {
        const attributes = (ad.attributes ?? {}) as Record<string, unknown>;
        const images = Array.isArray(attributes.image_urls) ? (attributes.image_urls as unknown[]).filter((u): u is string => typeof u === "string") : [];
        return {
          id: ad.id,
          title: ad.title,
          price: ad.price,
          image: images[0] ?? (typeof ad.image_url === "string" && ad.image_url.startsWith("http") ? ad.image_url : null),
          photos: images.length,
          location: [attributes.region, attributes.city].filter(Boolean).join("، ") || ad.location,
          category: attributes.leaf_category_name ?? null,
          status: ad.status,
          views: ad.views ?? 0,
          chats: ad.chats_count ?? 0,
          favorites: ad.favorites_count ?? 0,
          rating: ad.rating_avg ?? null,
          reviews: ad.reviews_count ?? 0,
          score: ad.performance_score ?? 0,
          hint: ad.suggested_action ?? null,
          createdAt: ad.created_at ?? null,
          republishedAt: ad.last_republished_at ?? null,
        };
      }),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

/** Pause, resume, mark as sold, republish or delete one or more of the user's ads, or republish all of them. */
export async function POST(request: Request) {
  if (!(await getToken())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { ids?: number[]; action?: string };

  // Every live ad at once. The server skips ads republished in the last 24 hours and says how many
  if (body.action === "republish_all") {
    const response = await accountFetch("/my-ads/republish-all", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: "failed" }, { status: response.status });
    return NextResponse.json({ ok: true, republished: Number(data.republished) || 0, waiting: Number(data.waiting) || 0 });
  }
  const ids = (body.ids ?? []).filter((id) => Number.isSafeInteger(id) && id > 0).slice(0, 100);
  if (ids.length === 0 || !ACTIONS.includes(body.action ?? "")) return NextResponse.json({ error: "bad request" }, { status: 400 });

  // Republishing one ad goes through its own endpoint, which allows it once every 24 hours
  if (body.action === "republish" && ids.length === 1) {
    const response = await accountFetch(`/ads/${ids[0]}/republish`, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: typeof data.detail === "string" ? data.detail : "failed" }, { status: response.status });
    return NextResponse.json({ ok: true });
  }

  const response = await accountFetch("/my-ads/bulk-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ad_ids: ids, action: body.action }),
  });
  if (!response.ok) return NextResponse.json({ error: "failed" }, { status: response.status });
  return NextResponse.json({ ok: true });
}
