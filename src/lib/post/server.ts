/**
 * Server side of the add-ad flow: turns what the wizard collected into the
 * exact request body the mobile app sends, after checking it.
 */
import { getTaxonomy } from "@/lib/api";
import {
  type BasicInfo,
  type CategoryNode,
  type DynamicData,
  MAIN_CATEGORIES,
  MAX_PHOTOS,
  MIN_PHOTOS,
  RENT_ROOT,
  amount,
  basicErrors,
  cleanDynamic,
  detailSections,
  formTypeOf,
  missingFields,
  westernDigits,
} from "./schema";

export interface WizardInput extends Partial<BasicInfo> {
  /** The draft created earlier in the flow, if any */
  id?: number;
  categoryId?: number;
  cityId?: number;
  regionId?: number;
  dynamic?: DynamicData;
  tags?: string[];
  images?: string[];
  videoUrl?: string;
}

const MAX_TEXT = 300;
const MAX_LIST = 40;

/** Keeps the free-form answers to short strings and short lists of strings. */
function sanitize(dynamic: unknown): DynamicData {
  const clean: DynamicData = {};
  if (!dynamic || typeof dynamic !== "object") return clean;
  for (const [key, value] of Object.entries(dynamic as Record<string, unknown>).slice(0, 80)) {
    if (!/^[a-z0-9_]{1,40}$/.test(key)) continue;
    if (typeof value === "string") clean[key] = westernDigits(value).slice(0, MAX_TEXT);
    else if (Array.isArray(value)) clean[key] = value.filter((item): item is string => typeof item === "string").slice(0, MAX_LIST).map((item) => item.slice(0, 80));
  }
  return clean;
}

export interface Built {
  /** Problems that stop publishing; empty when the ad is complete */
  errors: string[];
  payload: Record<string, unknown>;
}

/**
 * Builds the ad as the app would send it. Drafts are built from whatever is
 * there so far; `errors` says what a publish would still need.
 */
export async function buildAd(input: WizardInput): Promise<Built> {
  const errors: string[] = [];
  const taxonomy = await getTaxonomy();
  const nodes: CategoryNode[] = taxonomy.categories.map((c) => ({ id: c.id, parentId: c.parent_id, name: c.name }));
  const byId = new Map(nodes.map((node) => [node.id, node]));

  const leaf = input.categoryId ? byId.get(input.categoryId) : undefined;
  // The main section is the top of the leaf's branch: rentals or sales
  let main = leaf;
  const seen = new Set<number>();
  while (main && !MAIN_CATEGORIES.includes(main.id) && main.parentId !== null && !seen.has(main.id)) {
    seen.add(main.id);
    main = byId.get(main.parentId);
  }
  const isLeaf = !!leaf && !nodes.some((node) => node.parentId === leaf.id);
  if (!leaf || !main || !MAIN_CATEGORIES.includes(main.id) || leaf.id === main.id || !isLeaf) errors.push("category");

  const city = taxonomy.cities.find((c) => c.id === input.cityId);
  const region = taxonomy.regions.find((r) => r.id === input.regionId);
  if (!city || !region || region.city_id !== city.id) errors.push("place");

  const images = (input.images ?? []).filter((url) => typeof url === "string" && /^https?:\/\//.test(url)).slice(0, MAX_PHOTOS);
  if (images.length < MIN_PHOTOS) errors.push("photos");

  const info: BasicInfo = {
    payment: input.payment || "كاش",
    price: westernDigits(input.price ?? ""),
    down: westernDigits(input.down ?? ""),
    title: (input.title ?? "").trim(),
    description: (input.description ?? "").trim(),
    phone: westernDigits(input.phone ?? "").trim(),
  };
  for (const problem of Object.values(basicErrors(info))) errors.push(problem);

  let dynamic = sanitize(input.dynamic);
  let formType = "Generic";
  if (leaf && main) {
    const context = { isRent: main.id === RENT_ROOT, leafName: leaf.name };
    formType = formTypeOf(leaf, main.name, byId);
    const sections = detailSections(formTypeOf(leaf, main.name, byId), context);
    if (missingFields(sections, dynamic, context).length > 0) errors.push("details");
    dynamic = cleanDynamic(sections, dynamic, context);
  }

  const installments = info.payment === "أقساط";
  const withDown = installments || info.payment === "كاش أو أقساط";
  const videoUrl = typeof input.videoUrl === "string" && /^https?:\/\//.test(input.videoUrl) ? input.videoUrl : undefined;

  const payload: Record<string, unknown> = {
    title: info.title.slice(0, 70) || (leaf && main ? `${leaf.name} - ${main.name}` : ""),
    description: info.description.slice(0, 5000),
    // An instalment-only ad has no cash price, as in the app
    price: installments ? 0 : amount(info.price) ?? 0,
    location: city?.name_ar ?? "",
    region: region?.name_ar ?? "",
    category_id: leaf?.id,
    linked_tags: (input.tags ?? []).filter((tag) => typeof tag === "string").slice(0, 10).map((tag) => tag.slice(0, 40)),
    image_urls: images,
    ...(images.length ? { image_url: images[0] } : {}),
    ...(videoUrl ? { video_url: videoUrl } : {}),
    attributes: {
      transaction_type: main?.name,
      leaf_category_name: leaf?.name,
      dynamic_data: dynamic,
      form_type: formType,
      payment_method: info.payment,
      city: city?.name_ar,
      region: region?.name_ar,
      phone_number: info.phone,
      ...(withDown ? { down_payment: amount(info.down) ?? 0 } : {}),
    },
    phone_number: info.phone,
  };
  return { errors, payload };
}
