import { AboutPage, staticMetadata } from "@/views/StaticPages";

export const metadata = staticMetadata("ar", "about");

export default function Page() {
  return <AboutPage locale="ar" />;
}
