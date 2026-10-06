import { NextResponse } from "next/server";
import { MAX_PHOTO_BYTES, MAX_VIDEO_BYTES } from "@/lib/post/schema";
import { accountFetch, getToken } from "@/lib/session";

/**
 * Forwards one photo or one video to the backend, which checks, resizes and
 * stores it. One file per call, so each photo gets its own answer and a
 * rejected one can be shown with its reason, as in the app.
 */
export async function POST(request: Request) {
  if (!(await getToken())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const incoming = await request.formData();
  const file = incoming.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });

  const isVideo = file.type.startsWith("video/");
  if (!isVideo && !file.type.startsWith("image/")) return NextResponse.json({ error: "صيغة الملف غير مدعومة" }, { status: 400 });
  if (file.size > (isVideo ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES)) return NextResponse.json({ error: "حجم الملف كبير جداً" }, { status: 413 });

  const outgoing = new FormData();
  outgoing.append("files", file, file.name);
  const response = await accountFetch("/media/upload", { method: "POST", body: outgoing });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // The same wording the app shows for the backend's reasons
    const detail = String(data.detail ?? "").toLowerCase();
    const reason = detail.includes("watermark")
      ? "الصورة تحتوي على شعار أو علامة مائية"
      : detail.includes("too large") || response.status === 413
        ? "حجم الصورة كبير جداً"
        : detail.includes("extension") || detail.includes("not allowed")
          ? "صيغة الصورة غير مدعومة"
          : typeof data.detail === "string" && data.detail
            ? data.detail
            : `تعذر الرفع (خطأ ${response.status})`;
    return NextResponse.json({ error: reason }, { status: response.status });
  }
  const url = Array.isArray(data.urls) ? data.urls[0] : undefined;
  if (!url) return NextResponse.json({ error: "لم يتم إرجاع رابط للصورة" }, { status: 502 });
  return NextResponse.json({ url });
}
