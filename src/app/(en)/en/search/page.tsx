import type { SearchParams } from "@/lib/filters";
import SearchView, { searchMetadata } from "@/views/SearchView";

export const metadata = searchMetadata("en");

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <SearchView locale="en" searchParams={await searchParams} />;
}
