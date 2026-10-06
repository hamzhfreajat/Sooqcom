export type Locale = "ar" | "en";
export type Deal = "rent" | "sale";

export interface City {
  id: number;
  name_ar: string;
  name_en: string;
}

export interface Region extends City {
  city_id: number;
  lat: number | null;
  lng: number | null;
}

export interface Taxonomy {
  categories: { id: number; parent_id: number | null; name: string }[];
  cities: City[];
  regions: Region[];
}

export interface AdCard {
  id: number;
  title: string;
  /** The title for search results: names the deal and the place when the ad's own title does not */
  seo_title?: string;
  slug: string;
  price: number | null;
  deal: Deal | null;
  category_id: number;
  category_name: string;
  city_id: number | null;
  region_id: number | null;
  city_ar: string | null;
  city_en: string | null;
  region_ar: string | null;
  region_en: string | null;
  image: string | null;
  /** Up to five card-size photos */
  images: string[];
  images_count: number;
  excerpt: string;
  floor: string | null;
  /** Short labels from the ad's details (rent period, furnishing, features) */
  tags?: string[];
  is_hot?: boolean;
  is_featured?: boolean;
  below_market?: boolean;
  has_video?: boolean;
  phone: string | null;
  is_organic: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  furnished: boolean | null;
  rating_avg: number | null;
  reviews_count: number;
  created_at: string | null;
}

export interface PriceStats {
  count: number;
  median: number | null;
  low: number | null;
  high: number | null;
}

export interface PlaceCount extends City {
  count: number;
}

export interface Landing {
  total: number;
  page: number;
  page_size: number;
  ads: AdCard[];
  stats: PriceStats | null;
  deal: Deal | null;
  locations: PlaceCount[];
  bedrooms: { value: number; count: number }[];
  /** Ads each narrower page of this scope would hold (rentals only; zero otherwise) */
  refinements?: {
    furnished: number; daily: number; monthly: number;
    unfurnished?: number; owner?: number; instalments?: number; ground?: number; first?: number; new?: number;
    /** Ads at or under each price ceiling, keyed by the ceiling */
    caps?: Record<string, number>;
  };
  categories: { id: number; name: string; count: number }[];
  breadcrumb: { id: number; name: string }[];
  /** Ads per category of the deal in the chosen place, children included */
  category_counts?: { id: number; count: number }[];
}

export interface AdDetail extends AdCard {
  images: string[];
  description: string;
  live: boolean;
  indexable: boolean;
  updated_at: string | null;
  location: string | null;
  details: Record<string, string | string[]>;
  source_type: string;
  owner_name: string | null;
  phone: string | null;
  breadcrumb: { id: number; name: string }[];
  market: PriceStats;
  similar: AdCard[];
}

/** One line of a price guide: an area, a city, or a number of bedrooms. */
export interface PriceRow {
  count: number;
  median: number;
  low: number;
  high: number;
}

export interface PriceGuide {
  deal: Deal;
  stats: PriceStats;
  places: (PriceRow & City)[];
  bedrooms: (PriceRow & { value: number })[];
  updated_at: string | null;
}

/** Ads a refinement page would hold: feature is "owner", "unfurnished", "instalments", "ground" or "cap:200". */
export interface SitemapFeatureRow {
  feature: string;
  category_id: number;
  city_id: number | null;
  region_id: number | null;
  count: number;
  latest: string | null;
}

export interface SitemapLandingRow {
  category_id: number;
  city_id: number | null;
  region_id: number | null;
  bedrooms?: number | null;
  furnished?: boolean;
  rent_period?: "daily" | "monthly" | null;
  count: number;
  latest: string | null;
}
