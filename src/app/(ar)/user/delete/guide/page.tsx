import { DeleteDataPage, staticMetadata } from "@/views/StaticPages";

// Old address of the data-deletion guide, kept because the app stores link to it
export const metadata = staticMetadata("ar", "delete-data");

export default function Page() {
  return <DeleteDataPage locale="ar" />;
}
