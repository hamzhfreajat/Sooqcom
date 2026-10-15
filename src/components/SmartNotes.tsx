import Icon from "@/components/Icon";
import { type SmartNote } from "@/lib/filters";
import type { Locale } from "@/lib/types";

/** What smart search had to give up to find results, in the words the visitor reads. */
const TEXT: Record<SmartNote, Record<Locale, string>> = {
  region: {
    ar: "لا توجد حالياً إعلانات مطابقة في المنطقة التي طلبتها، فعرضنا لك نتائج المدينة كاملة.",
    en: "Nothing matches in the area you asked for yet, so these results cover the whole city.",
  },
  missing: {
    ar: "لم نتعرّف على بعض الأماكن التي كتبتها، فعرضنا أقرب النتائج.",
    en: "We did not recognise some of the places you wrote, so these are the closest results.",
  },
  floor: {
    ar: "لا توجد إعلانات في الطابق الذي طلبته، فعرضنا كل الطوابق.",
    en: "Nothing is listed on the floor you asked for, so all floors are shown.",
  },
  price: {
    ar: "لا توجد إعلانات ضمن ميزانيتك، فرفعنا الحد الأعلى للسعر قليلاً.",
    en: "Nothing is listed within your budget, so the price limit was raised a little.",
  },
  area: {
    ar: "لا توجد إعلانات بالمساحة التي طلبتها، فعرضنا كل المساحات.",
    en: "Nothing matches the size you asked for, so all sizes are shown.",
  },
  features: {
    ar: "لم نجد إعلانات فيها كل المزايا التي طلبتها، فعرضنا أقرب النتائج.",
    en: "No listing has every feature you asked for, so these are the closest results.",
  },
};

export default function SmartNotes({ locale, notes }: { locale: Locale; notes?: SmartNote[] }) {
  if (!notes?.length) return null;
  return (
    <ul className="space-y-1.5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-sm leading-6 text-amber-900">
      {notes.map((note) => (
        <li key={note} className="flex items-start gap-2.5">
          <Icon name="alert" size={17} className="mt-0.5 shrink-0 text-amber-600" />
          <span>{TEXT[note][locale]}</span>
        </li>
      ))}
    </ul>
  );
}
