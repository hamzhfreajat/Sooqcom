import { AboutPage, staticMetadata } from "@/views/StaticPages";

export const metadata = staticMetadata("en", "about");

export default function Page() {
  return <AboutPage locale="en" />;
}
