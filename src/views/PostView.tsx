import type { Metadata } from "next";
import PostWizard from "@/components/post/PostWizard";
import { getTaxonomy } from "@/lib/api";
import { filterOptions } from "@/lib/filters";
import { dict } from "@/lib/i18n";
import { AD_SEGMENT } from "@/lib/taxonomy";
import type { Locale } from "@/lib/types";

export function postMetadata(locale: Locale): Metadata {
  return { title: dict(locale).post_ad, robots: { index: false, follow: true } };
}

/** The add-ad page: the same steps, questions and checks as the mobile app. */
export default async function PostView({ locale }: { locale: Locale }) {
  const taxonomy = await getTaxonomy();
  // Category and place names in the page's language, as the listing filters show them
  const options = filterOptions(locale, taxonomy);

  return (
    <PostWizard
      lang={locale}
      allowPreview={process.env.NODE_ENV === "development" || process.env.POST_PREVIEW === "1"}
      adPrefix={`${locale === "en" ? "/en" : ""}/${AD_SEGMENT[locale]}`}
      categories={taxonomy.categories.map((category) => ({
        id: category.id,
        parentId: category.parent_id,
        name: category.name,
        label: options.categories.find((option) => option.id === category.id)?.name,
      }))}
      cities={options.cities.map((city) => ({ id: city.id, name: city.name }))}
      areas={options.regions.map((region) => ({ id: region.id, cityId: region.cityId, name: region.name }))}
    />
  );
}
