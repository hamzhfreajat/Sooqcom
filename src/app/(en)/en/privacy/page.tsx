import { PrivacyPage, staticMetadata } from "@/views/StaticPages";

export const metadata = staticMetadata("en", "privacy");

export default function Page() {
  return <PrivacyPage locale="en" />;
}
