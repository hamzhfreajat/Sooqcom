/**
 * The add-ad flow's rules, mirrored from the mobile app so an ad written on the
 * website is stored exactly like one written in the app: which detail form a
 * category gets, every field of every form, and the checks before publishing.
 *
 * Option values stay in Arabic because they are what gets stored and filtered on.
 */
import { FACETS } from "@/components/filters/shared";

export type Lang = "ar" | "en";
type Text = Record<Lang, string>;

export const RENT_ROOT = 3;
export const SALE_ROOT = 2;
/** The app's two starting points, in its order */
export const MAIN_CATEGORIES = [RENT_ROOT, SALE_ROOT];

export const MIN_PHOTOS = 3;
export const MAX_PHOTOS = 20;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_SECONDS = 30;
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
export const TITLE_MIN = 10;
export const TITLE_MAX = 70;
export const DESCRIPTION_MIN = 20;
export const PHONE_PATTERN = /^07[789]\d{7}$/;
export const PAYMENT_METHODS = ["كاش", "أقساط", "كاش أو أقساط"];

export interface CategoryNode {
  id: number;
  parentId: number | null;
  /** The Arabic name: it is what gets stored, and what decides the detail form */
  name: string;
  /** The name to show, when the page is not in Arabic */
  label?: string;
}

export const shownName = (category?: CategoryNode) => category?.label ?? category?.name ?? "";

export type FormType = "Apartment" | "Land" | "Villa" | "Commercial" | "Chalet" | "Generic";
export type DynamicData = Record<string, string | string[]>;

const COMMERCIAL_WORDS = [
  "تجاري", "مكتب", "مكاتب", "مخزن", "مخازن", "عياد", "عيادات", "معرض", "معارض", "مستودع", "صناعي", "مبنى", "مباني", "مجمع",
  "محل", "محلات", "كراج", "مطعم", "مقهى", "كافيه", "سوبر ماركت", "صيدلية", "مخبز",
];
const isLandName = (name: string) => name.includes("أراضي") || name.includes("أرض ") || name.endsWith(" أرض") || name === "أرض";
const hasCommercialWord = (name: string) => COMMERCIAL_WORDS.some((word) => name.includes(word));

/** Which detail form a category gets. Same decisions, in the same order, as the app. */
export function formTypeOf(leaf: CategoryNode, mainName: string, byId: Map<number, CategoryNode>): FormType {
  const combined = `${mainName} ${leaf.name}`;
  if (isLandName(combined)) return "Land";

  let current: CategoryNode | undefined = leaf;
  const seen = new Set<number>();
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    if (current.id === 311 || current.id === 10311) return "Commercial";
    if (isLandName(current.name)) return "Land";
    if (hasCommercialWord(current.name)) return "Commercial";
    if (current.id === 306) return "Apartment";
    current = current.parentId !== null ? byId.get(current.parentId) : undefined;
  }

  if (hasCommercialWord(combined)) return "Commercial";
  if (combined.includes("شقق")) return "Apartment";
  if (combined.includes("مزارع") || combined.includes("شاليهات")) return "Chalet";
  if (combined.includes("فلل") || combined.includes("قصور")) return "Villa";
  if (mainName.includes("عقار")) return "Apartment";
  return "Generic";
}

// ---------------------------------------------------------------------------
// Detail forms
// ---------------------------------------------------------------------------
export interface FormContext {
  isRent: boolean;
  leafName: string;
}

export interface Field {
  /** measure: a number with a unit. text: free text. radio: one choice. checks: any number of choices (always optional). note: a warning line. */
  kind: "measure" | "text" | "radio" | "checks" | "note";
  key: string;
  label: Text;
  unit?: Text;
  options?: string[];
  /** Fields are required unless this is false; "checks" are never required */
  required?: boolean;
  numeric?: boolean;
  /** Shares its row with the next field */
  half?: boolean;
  when?: (data: DynamicData, context: FormContext) => boolean;
}

export interface Section {
  title: Text;
  icon: string;
  fields: Field[];
}

const t = (ar: string, en: string): Text => ({ ar, en });
const SQM = t("متر مربع", "m²");
const METER = t("متر", "m");
const JOD = t("دينار", "JOD");
const YES_NO = ["نعم", "لا"];
const one = (data: DynamicData, key: string) => (typeof data[key] === "string" ? (data[key] as string) : "");
const many = (data: DynamicData, key: string) => (Array.isArray(data[key]) ? (data[key] as string[]) : []);

const measure = (key: string, label: Text, unit: Text, extra: Partial<Field> = {}): Field => ({ kind: "measure", key, label, unit, ...extra });
const text = (key: string, label: Text, extra: Partial<Field> = {}): Field => ({ kind: "text", key, label, ...extra });
const radio = (key: string, label: Text, options: string[], extra: Partial<Field> = {}): Field => ({ kind: "radio", key, label, options, ...extra });
const checks = (key: string, label: Text, options: string[], extra: Partial<Field> = {}): Field => ({ kind: "checks", key, label, options, required: false, ...extra });

const FLOORS = ["طابق التسوية", "طابق شبه أرضي", "الطابق الأرضي", "1", "2", "3", "4", "5", "6", "7", "طابق أخير", "روف", "طابق أخير مع روف"];
const RENT_PERIODS = ["يومي", "أسبوعي", "شهري", "كل 3 أشهر", "كل أربع أشهر", "كل 5 أشهر", "كل 6 أشهر", "سنوي"];
const FURNISHING = ["مفروشة", "غير مفروشة", "مفروش جزئياً"];
const NEARBY = ["بنك / صراف آلي", "دراي كلين", "سوبر ماركت", "صالة رياضية / جيم", "صيدلية", "محطة باصات", "مدرسة", "مستشفى", "مسجد", "مطعم"];
const FACADES = ["شمالية", "جنوبية", "شرقية", "غربية", "شمالية شرقية", "شمالية غربية", "جنوبية شرقية", "جنوبية غربية"];

const ADVERTISER: Section = {
  title: t("صفة المعلن", "Advertiser"),
  icon: "user",
  fields: [radio("advertiser_type", t("نوع المعلن", "Advertiser type"), ["من المالك مباشرة", "وسيط"])],
};

/** Extra blocks every rental gets (apartments and villas). */
const RENTAL_TERMS: Section[] = [
  {
    title: t("الرسوم والتأمين", "Fees and deposit"),
    icon: "chart",
    fields: [
      radio("building_fees_status", t("رسوم الخدمات/الحارس", "Service / guard fees"), ["يوجد رسوم", "لا يوجد رسوم"]),
      measure("monthly_building_fee", t("قيمة الرسوم الشهرية", "Monthly fee"), JOD, { when: (d) => one(d, "building_fees_status") === "يوجد رسوم" }),
      radio("security_deposit_type", t("مبلغ التأمين", "Security deposit"), ["بدون تأمين", "نصف شهر", "شهر واحد", "مبلغ آخر"]),
      measure("custom_security_deposit", t("قيمة التأمين", "Deposit amount"), JOD, { when: (d) => one(d, "security_deposit_type") === "مبلغ آخر" }),
    ],
  },
  {
    title: t("الفئة المستهدفة وشروط التأجير", "Tenants and rental terms"),
    icon: "users",
    fields: [
      checks("target_tenants", t("الفئة المستهدفة", "Preferred tenants"), [
        "الجميع / بدون شروط", "عائلات فقط", "يفضل عرسان جدد", "طالبات/موظفات", "عزاب", "أجانب/دبلوماسيين", "سكن شركات/موظفين",
      ]),
      checks("property_restrictions", t("شروط وإرشادات التأجير", "Rental rules"), [
        "التزام بالهدوء / بيئة عائلية", "يمنع القطط نهائياً", "مسموح بالقطط فقط", "مسموح بالقطط والكلاب", "يمنع إقامة الحفلات الصاخبة",
        "يمنع التأجير اليومي / السياحي", "للسكن فقط", "التدخين على البلكونة فقط", "ممنوع التدخين داخل الشقة", "ممنوع الأرجيلة نهائياً",
        "يمنع الصعود إلى السطح", "الالتزام بموقف سيارة واحد فقط", "يمنع ثقب الجدران بدون إذن", "يمنع تغيير ألوان الدهان",
        "المستأجر مسؤول عن الصيانة البسيطة", "تسليم الشقة بنفس حالة الاستلام",
      ]),
    ],
  },
  {
    title: t("الخدمات التحتية والمرافق", "Utilities"),
    icon: "building",
    fields: [
      checks("water_supply", t("المياه", "Water"), ["بئر ماء مستقل", "بئر ماء مشترك", "مياه سلطة فقط", "مضخة ماء راكبة"]),
      checks("meters_setup", t("العدادات", "Meters"), ["ساعة كهرباء مفصولة", "ساعة ماء مفصولة", "عدادات مشتركة"]),
      checks("cooling_features", t("التبريد", "Cooling"), ["مكيفات راكبة", "تأسيس مكيفات"]),
      checks("heating_features", t("التدفئة", "Heating"), ["تدفئة مركزية - ديزل", "تدفئة مركزية - غاز", "تدفئة تحت البلاط"]),
      checks("water_heating_features", t("تسخين المياه", "Water heating"), ["سخان شمسي", "كيزر كهرباء"]),
    ],
  },
];

const APARTMENT: Section[] = [
  {
    title: t("تفاصيل العقار", "Property details"),
    icon: "building",
    fields: [
      measure("area", t("مساحة البناء", "Built area"), SQM),
      measure("land_area", t("مساحة الأرض", "Land area"), SQM, { when: (_, c) => c.leafName.includes("مستقلة") }),
      radio("has_terrace", t("هل يوجد ترس؟", "Is there a terrace?"), YES_NO),
      measure("terrace_area", t("مساحة الترس", "Terrace area"), SQM, { when: (d) => one(d, "has_terrace") === "نعم" }),
      radio("bedrooms", t("عدد الغرف", "Bedrooms"), ["1", "2", "3", "4", "5", "+6"], {
        when: (_, c) => !c.leafName.includes("ستوديو") && !c.leafName.includes("استوديو"),
      }),
      radio("bathrooms", t("عدد الحمامات", "Bathrooms"), ["1", "2", "3", "4", "5", "+6"]),
      radio("furnishing", t("حالة الفرش", "Furnishing"), FURNISHING, { when: (_, c) => c.isRent }),
      checks("rent_duration", t("مدة الإيجار", "Rent period"), RENT_PERIODS, { when: (_, c) => c.isRent }),
      radio("floor", t("الطابق", "Floor"), FLOORS),
      radio("age", t("عمر البناء", "Building age"), ["0 - 11 شهر", "1 - 5 سنوات", "6 - 9 سنوات", "10 - 19 سنوات", "+20 سنة"]),
    ],
  },
  {
    title: t("المزايا والتفاصيل الإضافية", "Features"),
    icon: "star",
    fields: [
      checks("main_features", t("المزايا الرئيسية", "Main features"), [
        "تكييف مركزي", "تدفئة", "شرفة / بلكونة", "غرفة خادمة", "غرفة غسيل", "خزائن حائط", "مسبح خاص", "سخان شمسي", "زجاج شبابيك مزدوج",
        "مطبخ راكب", "صالون واسع", "تأسيس تكييف", "مناسبة لعرسان", "كراج", "سوبر ديلوكس",
      ]),
      checks("extra_features", t("المزايا الإضافية والمرافق", "Building amenities"), [
        "يوجد مصعد", "حديقة", "حارس / أمن وحماية", "منطقة شواء", "نظام كهرباء احتياطي للطوارئ", "بركة سباحة", "انتركم",
      ]),
      checks("nearby", t("مواقع قريبة", "Nearby"), NEARBY),
      radio("facade", t("الواجهة", "Facing"), ["شقة طابقية", ...FACADES], { required: false }),
    ],
  },
];

const VILLA: Section[] = [
  {
    title: t("تفاصيل الفيلا", "Villa details"),
    icon: "villa",
    fields: [
      measure("land_area", t("مساحة الأرض", "Land area"), SQM),
      measure("build_area", t("مساحة البناء", "Built area"), SQM),
      radio("has_terrace", t("هل يوجد ترس؟", "Is there a terrace?"), YES_NO),
      measure("terrace_area", t("مساحة الترس", "Terrace area"), SQM, { when: (d) => one(d, "has_terrace") === "نعم" }),
      radio("villa_type", t("تصنيف الفيلا", "Villa type"), ["متلاصقة", "مستقلة", "روف", "تاون هاوس"]),
      radio("floors", t("عدد الطوابق", "Floors"), ["طابق واحد", "طابقين", "ثلاثة+"]),
      checks("features", t("إضافات الفيلا", "Villa extras"), ["مسبح", "جاكوزي", "سينما منزلية", "نظام أمني", "بئر ماء", "طاقة شمسية"]),
    ],
  },
];

const COMMERCIAL: Section[] = [
  {
    title: t("تفاصيل العقار", "Property details"),
    icon: "store",
    fields: [
      measure("area", t("مساحة البناء", "Built area"), SQM),
      radio("furnishing", t("حالة الفرش", "Furnishing"), FURNISHING),
      checks("rent_duration", t("مدة الإيجار", "Rent period"), RENT_PERIODS, { when: (_, c) => c.isRent }),
      radio("floor", t("الطابق", "Floor"), FLOORS),
    ],
  },
  {
    title: t("المزايا والتفاصيل الإضافية", "Features"),
    icon: "star",
    fields: [
      checks("interior_details", t("التفاصيل الداخلية", "Interior"), [
        "غرفة أساسية", "مطبخ", "حمام", "غرفة استقبال", "غرفة اجتماعات", "مستودع داخلي", "ديكورات", "تأسيس شبكات",
      ]),
      checks("exterior_details", t("التفاصيل الخارجية", "Exterior"), [
        "يوجد مواقف سيارات", "واجهة زجاجية", "مدخل مستقل", "لوحة إعلانية خارجية", "كاميرات مراقبة خارجية", "حراسة / أمن",
      ]),
      checks("nearby", t("مواقع قريبة", "Nearby"), NEARBY),
      radio("key_money", t("الخلو", "Key money"), ["يوجد خلو", "بدون خلو"], { when: (_, c) => c.isRent }),
      measure("key_money_value", t("قيمة الخلو", "Key money amount"), JOD, { when: (d, c) => c.isRent && one(d, "key_money") === "يوجد خلو" }),
    ],
  },
];

const CHALET: Section[] = [
  {
    title: t("تفاصيل الشاليه المزرعة", "Chalet / farm details"),
    icon: "sun",
    fields: [
      radio("duration", t("المدة", "Stay"), ["إيجار يومي (بدون مبيت)", "مبيت"]),
      checks("facilities", t("المرافق", "Facilities"), ["مسبح مفلطر", "مسبح مدفأ", "ألعاب أطفال", "مساحة شواء", "ملعب كرة قدم/طائرة", "جلسات خارجية"]),
    ],
  },
];

const LAND: Section[] = [
  {
    title: t("معلومات الأرض الأساسية", "Basic land information"),
    icon: "land",
    fields: [
      measure("area", t("مساحة الأرض", "Land area"), SQM),
      measure("length", t("الطول", "Length"), METER, { half: true }),
      measure("width", t("العرض", "Width"), METER, { required: false, half: true }),
      radio("geometric_shape", t("الشكل الهندسي", "Shape"), ["مستطيل", "مربع", "غير منتظم", "زاوية / شارعَين"]),
      text("plot_number", t("رقم القطعة", "Plot number"), { numeric: true }),
      checks("facade", t("الواجهة", "Facing"), FACADES),
    ],
  },
  {
    title: t("الوضع القانوني والملكية", "Legal status and ownership"),
    icon: "shield",
    fields: [
      radio("is_mortgaged", t("هل العقار مرهون؟", "Is it mortgaged?"), YES_NO),
      text("mortgage_details", t("تفاصيل الرهن / إمكانية الفك", "Mortgage details"), { required: false, when: (d) => one(d, "is_mortgaged") === "نعم" }),
      radio("ownership_type", t("نوع الملكية", "Ownership"), ["طابو", "حصة مشاع", "إفراز", "قسيمة", "وكالة", "أخرى"]),
      text("shares_number", t("عدد الحصص من المجموع الكلي", "Number of shares out of the total"), { when: (d) => one(d, "ownership_type") === "حصة مشاع" }),
      {
        kind: "note",
        key: "agency_note",
        label: t(
          "يرجى العلم بأن البيع بموجب وكالة يتطلب التأكد من صلاحية الوكالة لدى الجهات الرسمية.",
          "A sale under power of attorney requires checking with the authorities that the power of attorney is valid.",
        ),
        when: (d) => one(d, "ownership_type") === "وكالة",
      },
      radio("papers_status", t("حالة الأوراق", "Paperwork"), ["كاملة", "ناقصة", "تحت الإجراء", "جاهزة للبيع"]),
      checks("legal_status_checks", t("تأكيدات إضافية", "Additional confirmations"), ["يوجد كفالة / تنظيم", "توجد مخالفات", "توجد خدمات تنظيمية", "توجد رسوم متأخرة"]),
    ],
  },
  {
    title: t("التصنيف التنظيمي والمعماري", "Zoning"),
    icon: "layers",
    fields: [
      radio("zoning_classification", t("تصنيف الأرض (حالة التنظيم)", "Zoning status"), ["داخل التنظيم", "خارج التنظيم"]),
      radio("zoning_category", t("فئة التنظيم", "Zoning category"), ["سكن أ", "سكن ب", "سكن ج", "سكن د", "أحكام خاصة"], {
        when: (d) => one(d, "zoning_classification") === "داخل التنظيم",
      }),
      measure("building_ratio", t("نصيب البناء", "Building ratio"), t("٪", "%"), { required: false, when: (d) => one(d, "land_type") !== "زراعية" }),
      measure("allowed_floors", t("الطوابق المسموح بها", "Allowed floors"), t("طوابق", "floors"), { required: false, when: (d) => one(d, "land_type") !== "زراعية" }),
      text("soil_type", t("نوع التربة", "Soil type"), { required: false, when: (d) => one(d, "land_type") === "زراعية" }),
      radio("irrigation_water", t("توفر مياه ري", "Irrigation water"), YES_NO, { required: false, when: (d) => one(d, "land_type") === "زراعية" }),
      radio("electricity_capacity", t("قدرة تحمل الكهرباء", "Electricity capacity"), ["3 Phase متوفر", "غير متوفر"], {
        required: false,
        when: (d) => one(d, "land_type") === "صناعية",
      }),
      checks("allowed_usage", t("الاستعمال المسموح", "Allowed use"), ["سكن", "عمارة", "فيلا", "محلات", "مستودعات", "مزرعة", "مشروع استثماري"]),
      radio("is_subdivided", t("هل الأرض مفروزة؟", "Is the land subdivided?"), YES_NO),
      radio("has_blueprint", t("هل عليها مخطط؟", "Is there a site plan?"), YES_NO),
    ],
  },
  {
    title: t("الوصول والبنية التحتية", "Access and infrastructure"),
    icon: "pin",
    fields: [
      radio("street_type", t("نوع الشارع", "Street type"), ["شارع رئيسي", "شارع فرعي", "شارع داخلي", "شارع نافذ", "زاوية / على شارعين"]),
      radio("street_facade", t("الواجهة على الشارع", "Street frontage"), ["مباشرة", "خلفية", "زاوية", "أكثر من واجهة"]),
      measure("street_width_1", t("عرض الشارع 1", "Street width 1"), METER, {
        required: false, half: true, when: (d) => ["زاوية", "أكثر من واجهة"].includes(one(d, "street_facade")),
      }),
      measure("street_width_2", t("عرض الشارع 2", "Street width 2"), METER, {
        required: false, half: true, when: (d) => ["زاوية", "أكثر من واجهة"].includes(one(d, "street_facade")),
      }),
      measure("street_width", t("عرض الشارع", "Street width"), METER, {
        required: false, when: (d) => !["زاوية", "أكثر من واجهة"].includes(one(d, "street_facade")),
      }),
      checks("available_services", t("الخدمات المتوفرة", "Available services"), ["ماء", "كهرباء", "صرف صحي", "هاتف / إنترنت", "شارع معبد", "إنارة", "غير مخدومة"]),
      measure("distance_to_service", t("المسافة لأقرب نقطة خدمة", "Distance to the nearest service point"), METER, {
        required: false, when: (d) => many(d, "available_services").includes("غير مخدومة"),
      }),
      radio("topography", t("طبيعة الأرض", "Terrain"), ["مستوية", "مائلة", "مرتفعة", "منخفضة", "تحتاج تسوية"]),
      text("topography_notes", t("ملاحظات عن الطبيعة (جرف/طمم..)", "Terrain notes"), { required: false, when: (d) => one(d, "topography") === "تحتاج تسوية" }),
    ],
  },
  {
    title: t("ميزات إضافية", "Extra features"),
    icon: "star",
    fields: [
      checks("extra_features", t("تتضمن الميزات التالية", "Includes"), [
        "الأرض مسورة", "فيها بناء قائم", "فيها أشجار / زراعة", "بئر ماء", "عداد كهرباء", "عداد ماء", "تصلح للبناء الفوري", "تصلح للاستثمار", "يوجد جار مباشر",
      ]),
      checks("nearby_locations", t("مواقع قريبة", "Nearby"), [...NEARBY, "موقف سيارات", "مول / مركز تسوق"]),
    ],
  },
  {
    title: t("معلومات احترافية إضافية", "More for professionals"),
    icon: "briefcase",
    fields: [
      radio("sale_reason", t("سبب البيع", "Reason for selling"), ["سفر", "سيولة", "تغيير استثمار", "تقسيم ميراث", "ترقية", "أخرى"], { required: false }),
      radio("exchange_possible", t("إمكانية التبادل", "Open to exchange"), YES_NO, { required: false }),
      radio("partnership_possible", t("إمكانية الشراكة", "Open to partnership"), YES_NO, { required: false }),
    ],
  },
];

const GENERIC: Section[] = [
  { title: t("تفاصيل أخرى", "Other details"), icon: "box", fields: [radio("condition", t("الحالة", "Condition"), ["جديد", "مستعمل"])] },
];

/** Every block of the details step for a form type, the advertiser block first. */
export function detailSections(formType: FormType, context: FormContext): Section[] {
  const rental = context.isRent ? RENTAL_TERMS : [];
  const body: Record<FormType, Section[]> = {
    Apartment: [...APARTMENT, ...rental],
    Villa: [...VILLA, ...rental],
    Land: LAND,
    Commercial: COMMERCIAL,
    Chalet: CHALET,
    Generic: GENERIC,
  };
  return [ADVERTISER, ...body[formType]];
}

export const isShown = (field: Field, data: DynamicData, context: FormContext) => !field.when || field.when(data, context);

/** Keys of the required fields that are shown but still empty, in page order. */
export function missingFields(sections: Section[], data: DynamicData, context: FormContext): string[] {
  const missing: string[] = [];
  for (const section of sections) {
    for (const field of section.fields) {
      if (field.kind === "note" || field.kind === "checks" || field.required === false || !isShown(field, data, context)) continue;
      if (!one(data, field.key).trim()) missing.push(field.key);
    }
  }
  return missing;
}

/** What is stored: only the fields on screen, with every multi-choice present as a list (as the app sends it). */
export function cleanDynamic(sections: Section[], data: DynamicData, context: FormContext): DynamicData {
  const cleaned: DynamicData = {};
  for (const section of sections) {
    for (const field of section.fields) {
      if (field.kind === "note" || !isShown(field, data, context)) continue;
      if (field.kind === "checks") cleaned[field.key] = many(data, field.key);
      else if (one(data, field.key).trim()) cleaned[field.key] = one(data, field.key).trim();
    }
  }
  return cleaned;
}

// ---------------------------------------------------------------------------
// Texts
// ---------------------------------------------------------------------------
const EXTRA_EN: Record<string, string> = {
  "نعم": "Yes", "لا": "No", "من المالك مباشرة": "Directly from the owner", "وسيط": "Agent", "مفروشة": "Furnished", "غير مفروشة": "Unfurnished",
  "مفروش جزئياً": "Partly furnished", "كاش": "Cash", "أقساط": "Instalments", "كاش أو أقساط": "Cash or instalments", "+6": "6+",
  "شقة طابقية": "Whole-floor apartment", "يوجد رسوم": "Fees apply", "لا يوجد رسوم": "No fees", "بدون تأمين": "No deposit", "نصف شهر": "Half a month",
  "شهر واحد": "One month", "مبلغ آخر": "Another amount", "جديد": "New", "مستعمل": "Used", "داخل التنظيم": "Inside zoning", "خارج التنظيم": "Outside zoning",
  "مستقلة": "Detached", "متلاصقة": "Semi-detached", "تاون هاوس": "Townhouse", "طابق واحد": "One floor", "طابقين": "Two floors", "ثلاثة+": "Three or more",
  "يوجد خلو": "Key money applies", "بدون خلو": "No key money", "مبيت": "Overnight", "إيجار يومي (بدون مبيت)": "Day use (no overnight)",
};
let optionsEn: Map<string, string> | null = null;

/** An option as shown to the reader. The stored value is always the Arabic one. */
export function optionLabel(value: string, lang: Lang): string {
  if (lang === "ar") return value;
  if (!optionsEn) {
    optionsEn = new Map(Object.entries(EXTRA_EN));
    // The listing filters already translate the options they share with this form
    for (const facet of FACETS) for (const option of facet.options) if (!optionsEn.has(option.value)) optionsEn.set(option.value, option.label.en);
  }
  return optionsEn.get(value) ?? value;
}

/** The areas people search most, per governorate, as the app lists them. */
export const POPULAR_AREAS: Record<string, string[]> = {
  "عمان": ["تلاع العلي", "طبربور", "ضاحية الرشيد", "الجبيهة", "خلدا", "عبدون", "شفا بدران", "الجاردنز", "الرابية", "الدوار السابع", "جبل عمان", "طريق المطار"],
  "إربد": ["الراهبات الوردية", "اربد مول", "شارع البتراء", "الحي الشرقي", "ايدون", "اسكان الأطباء", "اسكان المهندسين", "زبدة"],
  "العقبة": ["السكنية 10", "السكنية 5", "السكنية 9", "السكنية 7", "السكنية 6", "السكنية 1", "الشامية", "المركزية", "ايلة", "البلد القديمة"],
  "الزرقاء": ["الزرقاء الجديدة", "بلعما", "الهاشمية", "جريبا", "اسكان البتراوي", "ضاحية المدينة المنورة", "صروت", "القنية", "السخنة", "الرصيفة"],
  "المفرق": ["بلعما", "عين والمعمرية", "المراجم", "ارحاب", "بريقا", "الزنية", "حيان المشرف", "الخالدية", "دحل", "الزعتري", "ثغرة الجب", "حي الضباط"],
  "السلط": ["البلقاء", "أم جوزة", "البحيرة", "السلالم", "سيحان", "نقب الدبور", "سلعوف", "دعم الغزالات", "الصوانيه", "العيزرية"],
  "الكرك": ["مؤتة", "أدر", "الثنية", "العدنانية", "المرج", "القصر", "زحوم", "المزار الجنوبي"],
  "معان": ["سطح معان", "أذرح", "قصبة معان", "وادي موسى", "الشوبك", "جامعة الحسين بن طلال", "الجفر"],
  "مادبا": ["لب", "وسط مادبا", "ماعين", "ذيبان", "الجامعة الألمانية الأردنية", "الفيصلية", "الخطابية", "الزعفران", "دليله الحمايده", "منجا"],
  "جرش": ["مقبله", "عنيبة", "وسط جرش", "ثغرة عصفور", "دبين", "وادي الدير", "دحل", "سوف", "جامعة جرش", "النبي هود", "كفر خل", "المصطبة"],
  "عجلون": ["عبين", "صخرة", "عفنة", "جامعة عجلون الوطنية", "القلعة", "عنجرة", "عين جنا", "كفرنجا"],
  "الطفيلة": ["العيص", "جامعة الطفيلة التقنية", "الحسا", "الرشادية", "القادسية"],
};

/** Western digits for anything typed with Arabic-Indic or Persian ones. */
export function westernDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

/** A typed amount as a number, or undefined when it is not one. */
export function amount(value: string): number | undefined {
  const parsed = Number(westernDigits(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export interface BasicInfo {
  payment: string;
  price: string;
  down: string;
  title: string;
  description: string;
  phone: string;
}

export type BasicError = "price" | "down" | "titleShort" | "titleLong" | "description" | "phoneMissing" | "phoneInvalid";

/** The checks of the "basic information" step, keyed by field. */
export function basicErrors(info: BasicInfo): Partial<Record<keyof BasicInfo, BasicError>> {
  const errors: Partial<Record<keyof BasicInfo, BasicError>> = {};
  if (info.payment !== "أقساط" && !westernDigits(info.price).trim()) errors.price = "price";
  if ((info.payment === "أقساط" || info.payment === "كاش أو أقساط") && !westernDigits(info.down).trim()) errors.down = "down";
  const title = info.title.trim();
  if (title.length < TITLE_MIN) errors.title = "titleShort";
  else if (title.length > TITLE_MAX) errors.title = "titleLong";
  if (info.description.trim().length < DESCRIPTION_MIN) errors.description = "description";
  const phone = westernDigits(info.phone).trim();
  if (!phone) errors.phone = "phoneMissing";
  else if (!PHONE_PATTERN.test(phone)) errors.phone = "phoneInvalid";
  return errors;
}
