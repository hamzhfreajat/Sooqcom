import type { CategoryNode, DynamicData, Lang } from "@/lib/post/schema";

export interface Photo {
  id: string;
  file: File;
  /** Local address for showing the photo before it is uploaded */
  preview: string;
  /** Set once the backend has stored it */
  url?: string;
  status: "idle" | "uploading" | "done" | "failed";
  error?: string;
}

export interface Video {
  file: File;
  preview: string;
  seconds: number;
}

export interface Place {
  id: number;
  name: string;
}

export interface Area extends Place {
  cityId: number;
}

/** Everything the user has entered so far. */
export interface WizardState {
  photos: Photo[];
  video: Video | null;
  /** Chosen categories from the main section down; the last one is the leaf once it has no children */
  path: number[];
  cityId?: number;
  regionId?: number;
  dynamic: DynamicData;
  payment: string;
  price: string;
  down: string;
  title: string;
  description: string;
  phone: string;
  /** Tags the AI proposed, and the ones kept */
  tags: string[];
  selectedTags: string[];
  /** The draft on the server, once the area is chosen */
  adId?: number;
}

export interface StepProps {
  lang: Lang;
  state: WizardState;
  update: (changes: Partial<WizardState>) => void;
  categories: CategoryNode[];
  cities: Place[];
  areas: Area[];
  /** True when the visitor is signed in; without it nothing is sent to the server */
  online: boolean;
}

/** Picks the text for the page's language. */
export const pick = (lang: Lang) => (ar: string, en: string) => (lang === "ar" ? ar : en);
