import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/config";
import { dict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export default function AppBand({ locale }: { locale: Locale }) {
  const t = dict(locale);
  return (
    <section className="mt-16 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-10 text-white sm:px-12 sm:py-12">
      <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <h2 className="text-2xl font-black text-white sm:text-3xl">{t.app_title}</h2>
          <p className="mt-3 leading-8 text-brand-100">{t.app_body}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={PLAY_STORE_URL} rel="noopener" className="btn bg-white px-6 py-3 text-base text-brand-700 hover:bg-brand-50">
            Google Play
          </a>
          <a href={APP_STORE_URL} rel="noopener" className="btn border border-white/40 px-6 py-3 text-base text-white hover:bg-white/10">
            App Store
          </a>
        </div>
      </div>
    </section>
  );
}
